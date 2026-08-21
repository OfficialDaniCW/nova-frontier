import { and, eq, lte, isNotNull, ne } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  colonies,
  buildings,
  research,
  ships,
  fleets,
  sectors,
  combatLogs,
  marketOrders,
  commLog,
} from '@/lib/db/schema'
import {
  getBuildingDef,
  getResearchDef,
  getShipDef,
  FACTION_DEFENSE_MULTIPLIER,
} from '@/lib/game/definitions'
import { projectColonyResources } from '@/lib/game/resources'

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

async function logComm(
  userId: string,
  category: string,
  severity: string,
  message: string,
) {
  await db.insert(commLog).values({
    id: newId('comm'),
    userId,
    category,
    severity,
    message,
  })
}

/** Settle a colony's accrued resources up to now and bump lastTickAt. Call before any spend. */
export async function settleColony(colonyId: string) {
  const [colony] = await db.select().from(colonies).where(eq(colonies.id, colonyId)).limit(1)
  if (!colony) return null
  const projected = projectColonyResources(colony)
  const [updated] = await db
    .update(colonies)
    .set({ ...projected, lastTickAt: new Date() })
    .where(eq(colonies.id, colonyId))
    .returning()
  return updated
}

async function resolveBuildingQueues(now: Date) {
  const due = await db
    .select()
    .from(buildings)
    .where(and(isNotNull(buildings.queueEtaAt), lte(buildings.queueEtaAt, now)))

  for (const b of due) {
    if (b.queuedLevel == null) continue
    await db
      .update(buildings)
      .set({ level: b.queuedLevel, queuedLevel: null, queueStartedAt: null, queueEtaAt: null })
      .where(eq(buildings.id, b.id))

    // Recompute colony production rates from building levels.
    await recomputeColonyRates(b.colonyId)

    const def = getBuildingDef(b.buildingType)
    await logComm(
      b.userId,
      'construction',
      'success',
      `${def.name} construction complete — now level ${b.queuedLevel}.`,
    )
  }
}

async function recomputeColonyRates(colonyId: string) {
  const rows = await db.select().from(buildings).where(eq(buildings.colonyId, colonyId))
  let energyRate = 6
  let alloyRate = 4
  let crystalRate = 1
  let energyCap = 2000
  let alloyCap = 2000
  let crystalCap = 1000

  for (const b of rows) {
    if (b.level <= 0) continue
    const def = getBuildingDef(b.buildingType)
    if (def.productionPerLevel) {
      const add = def.productionPerLevel.amount * b.level
      if (def.productionPerLevel.resource === 'energy') energyRate += add
      if (def.productionPerLevel.resource === 'alloy') alloyRate += add
      if (def.productionPerLevel.resource === 'crystal') crystalRate += add
    }
    if (def.storagePerLevel) {
      const add = def.storagePerLevel * b.level
      energyCap += add
      alloyCap += add
      crystalCap += add * 0.5
    }
  }

  await settleColony(colonyId)
  await db
    .update(colonies)
    .set({ energyRate, alloyRate, crystalRate, energyCap, alloyCap, crystalCap })
    .where(eq(colonies.id, colonyId))
}

async function resolveResearchQueues(now: Date) {
  const due = await db
    .select()
    .from(research)
    .where(and(isNotNull(research.queueEtaAt), lte(research.queueEtaAt, now)))

  for (const r of due) {
    if (r.queuedLevel == null) continue
    await db
      .update(research)
      .set({ level: r.queuedLevel, queuedLevel: null, queueStartedAt: null, queueEtaAt: null })
      .where(eq(research.id, r.id))

    const def = getResearchDef(r.techId)
    await logComm(
      r.userId,
      'research',
      'success',
      `${def.name} research complete — now level ${r.queuedLevel}.`,
    )
  }
}

async function resolveShipQueues(now: Date) {
  const due = await db
    .select()
    .from(ships)
    .where(and(isNotNull(ships.queueEtaAt), lte(ships.queueEtaAt, now)))

  for (const s of due) {
    if (s.queuedCount == null) continue
    await db
      .update(ships)
      .set({
        count: s.count + s.queuedCount,
        queuedCount: null,
        queueStartedAt: null,
        queueEtaAt: null,
      })
      .where(eq(ships.id, s.id))

    await logComm(
      s.userId,
      'fleet',
      'success',
      `Fabrication complete — ${s.queuedCount}x ${s.shipType} added to the hangar.`,
    )
  }
}

function fleetTotalPower(shipCounts: Record<string, number>, stat: 'attack' | 'defense') {
  let total = 0
  for (const [shipId, count] of Object.entries(shipCounts)) {
    try {
      const def = getShipDef(shipId)
      total += def[stat] * count
    } catch {
      // unknown ship type, skip
    }
  }
  return total
}

async function resolveFleetArrivals(now: Date) {
  const due = await db
    .select()
    .from(fleets)
    .where(and(eq(fleets.resolved, false), lte(fleets.arrivesAt, now)))

  for (const fleet of due) {
    const [sector] = await db.select().from(sectors).where(eq(sectors.id, fleet.sectorId)).limit(1)
    if (!sector) {
      await db.update(fleets).set({ resolved: true, status: 'lost' }).where(eq(fleets.id, fleet.id))
      continue
    }

    const shipCounts = fleet.shipCounts as Record<string, number>

    if (fleet.mission === 'scout') {
      await logComm(
        fleet.userId,
        'fleet',
        'info',
        `Scan complete at ${sector.name}: garrison strength ~${sector.garrisonStrength}, faction ${sector.faction}.`,
      )
      await db
        .update(fleets)
        .set({ resolved: true, status: 'returned' })
        .where(eq(fleets.id, fleet.id))
    } else if (fleet.mission === 'attack') {
      const attackerPower = fleetTotalPower(shipCounts, 'attack')
      const mult = FACTION_DEFENSE_MULTIPLIER[sector.faction] ?? 1
      const defenderPower = sector.garrisonStrength * mult
      const win = attackerPower > defenderPower

      let shipsLost: Record<string, number> = {}
      if (win) {
        // Winner takes light losses proportional to defender power.
        const lossRatio = Math.min(0.4, defenderPower / (attackerPower + 1))
        for (const [shipId, count] of Object.entries(shipCounts)) {
          const lost = Math.floor(count * lossRatio)
          if (lost > 0) shipsLost[shipId] = lost
        }
        const newGarrison = 0
        await db
          .update(sectors)
          .set({ garrisonStrength: newGarrison })
          .where(eq(sectors.id, sector.id))
      } else {
        // Loser takes heavy losses — most of the fleet.
        for (const [shipId, count] of Object.entries(shipCounts)) {
          shipsLost[shipId] = count
        }
        if (sector.faction === 'obsidian') {
          // Obsidian vendetta: schedule a counter-raid against the player's home colony.
          const [homeColony] = await db
            .select()
            .from(colonies)
            .where(eq(colonies.userId, fleet.userId))
            .limit(1)
          if (homeColony) {
            const raidArrival = new Date(now.getTime() + 10 * 60 * 1000)
            await db.insert(fleets).values({
              id: newId('fleet'),
              userId: fleet.userId,
              colonyId: homeColony.id,
              sectorId: sector.id,
              mission: 'obsidian_raid',
              shipCounts: { 'gunship': 6, 'interceptor': 10 },
              departedAt: now,
              arrivesAt: raidArrival,
              status: 'en_route',
              resolved: false,
            })
            await logComm(
              fleet.userId,
              'combat',
              'danger',
              `Obsidian Vanguard vendetta triggered — a counter-raid fleet has been dispatched toward your colony, ETA 10 minutes.`,
            )
          }
        }
      }

      await db.insert(combatLogs).values({
        id: newId('combat'),
        userId: fleet.userId,
        sectorId: sector.id,
        sectorName: sector.name,
        faction: sector.faction,
        outcome: win ? 'win' : 'loss',
        attackerPower,
        defenderPower,
        shipsLost,
        energyLooted: 0,
        alloyLooted: 0,
        crystalLooted: 0,
      })

      // Deduct casualties from hangar.
      for (const [shipId, lost] of Object.entries(shipsLost)) {
        const [row] = await db
          .select()
          .from(ships)
          .where(and(eq(ships.colonyId, fleet.colonyId), eq(ships.shipType, shipId)))
          .limit(1)
        if (row) {
          await db
            .update(ships)
            .set({ count: Math.max(0, row.count - lost) })
            .where(eq(ships.id, row.id))
        }
      }

      await logComm(
        fleet.userId,
        'combat',
        win ? 'success' : 'danger',
        win
          ? `Victory at ${sector.name} — garrison broken. Fleet may now salvage the sector.`
          : `Defeat at ${sector.name} — fleet routed with heavy losses.`,
      )

      await db
        .update(fleets)
        .set({ resolved: true, status: win ? 'victorious' : 'defeated' })
        .where(eq(fleets.id, fleet.id))
    } else if (fleet.mission === 'obsidian_raid') {
      // NPC raid arrives at player's home colony.
      const [homeColony] = await db
        .select()
        .from(colonies)
        .where(eq(colonies.id, fleet.colonyId))
        .limit(1)
      if (homeColony) {
        const settled = await settleColony(homeColony.id)
        if (settled) {
          const stolenEnergy = Math.min(settled.energy, settled.energy * 0.15)
          const stolenAlloy = Math.min(settled.alloy, settled.alloy * 0.15)
          await db
            .update(colonies)
            .set({
              energy: settled.energy - stolenEnergy,
              alloy: settled.alloy - stolenAlloy,
            })
            .where(eq(colonies.id, homeColony.id))
        }
      }
      await logComm(
        fleet.userId,
        'combat',
        'danger',
        `Obsidian Vanguard raiders struck your colony, making off with a portion of stored Energy and Alloy.`,
      )
      await db
        .update(fleets)
        .set({ resolved: true, status: 'raid_complete' })
        .where(eq(fleets.id, fleet.id))
    } else if (fleet.mission === 'salvage') {
      const settled = await settleColony(fleet.colonyId)
      if (settled) {
        await db
          .update(colonies)
          .set({
            energy: Math.min(settled.energyCap, settled.energy + sector.energyReward),
            alloy: Math.min(settled.alloyCap, settled.alloy + sector.alloyReward),
            crystal: Math.min(settled.crystalCap, settled.crystal + sector.crystalReward),
          })
          .where(eq(colonies.id, fleet.colonyId))
      }
      await db
        .update(sectors)
        .set({ energyReward: 0, alloyReward: 0, crystalReward: 0 })
        .where(eq(sectors.id, sector.id))
      await logComm(
        fleet.userId,
        'trade',
        'success',
        `Salvage run at ${sector.name} complete — resources transferred to colony storage.`,
      )
      await db
        .update(fleets)
        .set({ resolved: true, status: 'returned' })
        .where(eq(fleets.id, fleet.id))
    } else if (fleet.mission === 'colonize') {
      if (sector.garrisonStrength <= 0 && !sector.ownerUserId) {
        await db
          .update(sectors)
          .set({ ownerUserId: fleet.userId, ownerColonyId: fleet.colonyId })
          .where(eq(sectors.id, sector.id))
        await logComm(
          fleet.userId,
          'system',
          'success',
          `${sector.name} has been claimed for the Concord Compact.`,
        )
      } else {
        await logComm(
          fleet.userId,
          'system',
          'warning',
          `Colonization of ${sector.name} failed — sector is no longer unclaimed or ungarrisoned.`,
        )
      }
      await db
        .update(fleets)
        .set({ resolved: true, status: 'returned' })
        .where(eq(fleets.id, fleet.id))
    } else {
      await db
        .update(fleets)
        .set({ resolved: true, status: 'returned' })
        .where(eq(fleets.id, fleet.id))
    }
  }
}

async function resolveMarketOrders() {
  const openSells = await db
    .select()
    .from(marketOrders)
    .where(and(eq(marketOrders.side, 'sell'), eq(marketOrders.status, 'open')))

  // NPC exchange fallback: instantly fill sell orders against a fixed rate if no
  // opposing buy order exists. This keeps the market alive in a low-population game.
  const NPC_RATE: Record<string, number> = { energy: 1, alloy: 1.6, crystal: 4.2 }

  for (const order of openSells) {
    if (order.remainingQuantity <= 0) continue
    const rate = NPC_RATE[order.resource] ?? 1
    // Only auto-fill if the asking price is at or below the NPC rate (a fair deal).
    if (order.pricePerUnit <= rate) {
      const settled = await settleColony(order.colonyId)
      if (!settled) continue
      const payoutResource = order.paymentResource as 'energy' | 'alloy' | 'crystal'
      const payout = order.remainingQuantity * order.pricePerUnit
      const cap =
        payoutResource === 'energy'
          ? settled.energyCap
          : payoutResource === 'alloy'
            ? settled.alloyCap
            : settled.crystalCap
      const current =
        payoutResource === 'energy'
          ? settled.energy
          : payoutResource === 'alloy'
            ? settled.alloy
            : settled.crystal
      const newAmount = Math.min(cap, current + payout)

      await db
        .update(colonies)
        .set({ [payoutResource]: newAmount } as never)
        .where(eq(colonies.id, order.colonyId))

      await db
        .update(marketOrders)
        .set({ remainingQuantity: 0, status: 'filled' })
        .where(eq(marketOrders.id, order.id))

      await logComm(
        order.userId,
        'trade',
        'success',
        `Market order filled: sold ${order.quantity} ${order.resource} for ${payout.toFixed(0)} ${order.paymentResource} (NPC exchange).`,
      )
    }
  }
}

/**
 * Single entry point for all game-state resolution. Called by the cron route
 * and can also be invoked opportunistically from server actions before a
 * read, so client and cron always share one code path.
 */
export async function runTick() {
  const now = new Date()
  await resolveBuildingQueues(now)
  await resolveResearchQueues(now)
  await resolveShipQueues(now)
  await resolveFleetArrivals(now)
  await resolveMarketOrders()
  return { ranAt: now.toISOString() }
}
