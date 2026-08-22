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
  bloomState,
  systemDiscoveries,
  governors,
  doctrines,
} from '@/lib/db/schema'
import {
  getBuildingDef,
  getResearchDef,
  getShipDef,
  getResourcePriorityDef,
  FACTION_DEFENSE_MULTIPLIER,
} from '@/lib/game/definitions'
import { projectColonyResources } from '@/lib/game/resources'
import { getTraitDef, rollSurveyReward, planetTraitBonus } from '@/lib/game/galaxy'
import { creedModifiers, allegianceCombatMultiplier } from '@/lib/game/creed'
import {
  fleetAttackPower,
  stationedDefensePower,
  shieldMitigation,
  applyLosses,
  RAID_LOOT_FRACTION,
  RAID_SHIELD_MS,
} from '@/lib/game/combat'

const BLOOM_SPREAD_INTERVAL_MS = 3 * 60 * 1000
const BLOOM_SPREAD_THRESHOLD = 55
const BLOOM_INCURSION_THRESHOLD = 70
const BLOOM_STATE_ID = 'global'

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

export async function logComm(
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
    const message =
      def.id === 'monument'
        ? `${def.name} construction complete — now level ${b.queuedLevel}. +${(def.scorePerLevel ?? 0) * b.queuedLevel} score.`
        : `${def.name} construction complete — now level ${b.queuedLevel}.`
    await logComm(b.userId, 'construction', 'success', message)
  }
}

export async function recomputeColonyRates(colonyId: string) {
  const rows = await db.select().from(buildings).where(eq(buildings.colonyId, colonyId))
  let energyRate = 6
  let alloyRate = 4
  let crystalRate = 1
  let devotionRate = 0
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
    if (def.devotionPerLevel) {
      devotionRate += def.devotionPerLevel * b.level
    }
    if (def.storagePerLevel) {
      const add = def.storagePerLevel * b.level
      energyCap += add
      alloyCap += add
      crystalCap += add * 0.5
    }
  }

  const [colony] = await db.select().from(colonies).where(eq(colonies.id, colonyId)).limit(1)
  const priority = getResourcePriorityDef(colony?.resourcePriority ?? 'balanced')
  energyRate *= priority.multipliers.energy
  alloyRate *= priority.multipliers.alloy
  crystalRate *= priority.multipliers.crystal

  // Colonized planets contribute passive rate bonuses from their traits.
  if (colony) {
    const ownedPlanets = await db
      .select({ traits: sectors.traits })
      .from(sectors)
      .where(eq(sectors.ownerColonyId, colonyId))
    const bonus = planetTraitBonus(ownedPlanets)
    energyRate *= bonus.energyRate
    alloyRate *= bonus.alloyRate
    crystalRate *= bonus.crystalRate

    // Creed signature + unlocked doctrines + allegiance signature layer on last.
    const [gov] = await db
      .select()
      .from(governors)
      .where(eq(governors.id, colony.governorId))
      .limit(1)
    if (gov) {
      const doctrineRows = await db
        .select({ doctrineId: doctrines.doctrineId, level: doctrines.level })
        .from(doctrines)
        .where(eq(doctrines.governorId, gov.id))
      const mods = creedModifiers(gov.creedId, doctrineRows, gov.allegiance)
      energyRate *= mods.energyMult
      alloyRate *= mods.alloyMult
      crystalRate *= mods.crystalMult
      devotionRate *= mods.devotionMult
    }
  }

  await settleColony(colonyId)
  await db
    .update(colonies)
    .set({ energyRate, alloyRate, crystalRate, devotionRate, energyCap, alloyCap, crystalCap })
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

/** Look up a governor's callsign by userId, falling back to a generic label. */
async function callsignForUser(userId: string): Promise<string> {
  const [gov] = await db
    .select({ callsign: governors.callsign })
    .from(governors)
    .where(eq(governors.userId, userId))
    .limit(1)
  return gov?.callsign ?? 'Unknown Governor'
}

/** Deduct casualties from a specific colony's stationed hangar rows. */
async function deductHangarLosses(colonyId: string, lost: Record<string, number>) {
  for (const [shipId, count] of Object.entries(lost)) {
    if (!count || count <= 0) continue
    const [row] = await db
      .select()
      .from(ships)
      .where(and(eq(ships.colonyId, colonyId), eq(ships.shipType, shipId)))
      .limit(1)
    if (row) {
      await db
        .update(ships)
        .set({ count: Math.max(0, row.count - count) })
        .where(eq(ships.id, row.id))
    }
  }
}

/**
 * Resolve a player-vs-player raid fleet arriving at a defender's home colony.
 * Attacker power (with creed bonus) is compared against the defender's
 * stationed hangar + Shield Generator. On a win the raider loots a slice of the
 * defender's stored resources (reduced by their shield); both sides take
 * losses. Either way the target gains a temporary raid shield.
 */
async function resolvePvpRaid(fleet: typeof fleets.$inferSelect, now: Date) {
  const shipCounts = fleet.shipCounts as Record<string, number>
  const targetColonyId = fleet.targetColonyId
  const finish = (status: string) =>
    db.update(fleets).set({ resolved: true, status }).where(eq(fleets.id, fleet.id))

  // Attacker's own home colony (where surviving ships return).
  const [attackerColony] = await db
    .select()
    .from(colonies)
    .where(eq(colonies.id, fleet.colonyId))
    .limit(1)

  if (!targetColonyId) {
    // Target vanished — return the fleet intact.
    await finish('recalled')
    return
  }

  const [target] = await db
    .select()
    .from(colonies)
    .where(eq(colonies.id, targetColonyId))
    .limit(1)

  if (!target) {
    await logComm(
      fleet.userId,
      'combat',
      'warning',
      `Raid aborted — the target colony no longer exists. Your fleet returns home.`,
    )
    await finish('recalled')
    return
  }

  const attackerCallsign = await callsignForUser(fleet.userId)
  const defenderCallsign = await callsignForUser(target.userId)

  // Settle the defender's economy so loot reflects current stored resources.
  const settled = await settleColony(target.id)

  // Defender's stationed ships + Shield Generator level.
  const defenderShipRows = await db
    .select()
    .from(ships)
    .where(eq(ships.colonyId, target.id))
  const stationed: Record<string, number> = {}
  for (const r of defenderShipRows) if (r.count > 0) stationed[r.shipType] = r.count
  const [shieldRow] = await db
    .select()
    .from(buildings)
    .where(and(eq(buildings.colonyId, target.id), eq(buildings.buildingType, 'shield-generator')))
    .limit(1)
  const shieldLevel = shieldRow?.level ?? 0

  // Attacker power: ship attack × creed fleet-attack multiplier.
  let creedAttackMult = 1
  const [atkGov] = await db
    .select()
    .from(governors)
    .where(eq(governors.userId, fleet.userId))
    .limit(1)
  if (atkGov) {
    const doctrineRows = await db
      .select({ doctrineId: doctrines.doctrineId, level: doctrines.level })
      .from(doctrines)
      .where(eq(doctrines.governorId, atkGov.id))
    creedAttackMult = creedModifiers(atkGov.creedId, doctrineRows, atkGov.allegiance).fleetAttackMult
  }
  const attackerPower = Math.round(fleetAttackPower(shipCounts) * creedAttackMult)
  const defenderPower = Math.round(stationedDefensePower(stationed, shieldLevel))
  const win = attackerPower > defenderPower

  let energyLooted = 0
  let alloyLooted = 0
  let crystalLooted = 0
  let attackerLost: Record<string, number> = {}
  let defenderLost: Record<string, number> = {}

  if (win) {
    // Loot a slice of stored resources, reduced by the defender's shield.
    const keep = shieldMitigation(shieldLevel)
    const lootFrac = RAID_LOOT_FRACTION * (1 - keep)
    if (settled) {
      energyLooted = Math.floor(settled.energy * lootFrac)
      alloyLooted = Math.floor(settled.alloy * lootFrac)
      crystalLooted = Math.floor(settled.crystal * lootFrac)
      await db
        .update(colonies)
        .set({
          energy: Math.max(0, settled.energy - energyLooted),
          alloy: Math.max(0, settled.alloy - alloyLooted),
          crystal: Math.max(0, settled.crystal - crystalLooted),
        })
        .where(eq(colonies.id, target.id))
    }
    // Winner takes light losses (~15%), defender loses a slice of stationed ships (~25%).
    attackerLost = applyLosses(shipCounts, 0.15).lost
    defenderLost = applyLosses(stationed, 0.25).lost
  } else {
    // Failed raid: attacker routed (~70% losses), defender minimal (~8%).
    attackerLost = applyLosses(shipCounts, 0.7).lost
    defenderLost = applyLosses(stationed, 0.08).lost
  }

  // Return surviving attacker ships to the attacker's home hangar.
  const survivors: Record<string, number> = {}
  for (const [shipId, count] of Object.entries(shipCounts)) {
    const remaining = count - (attackerLost[shipId] ?? 0)
    if (remaining > 0) survivors[shipId] = remaining
  }
  if (attackerColony) {
    for (const [shipId, count] of Object.entries(survivors)) {
      const [row] = await db
        .select()
        .from(ships)
        .where(and(eq(ships.colonyId, attackerColony.id), eq(ships.shipType, shipId)))
        .limit(1)
      if (row) {
        await db.update(ships).set({ count: row.count + count }).where(eq(ships.id, row.id))
      } else {
        await db.insert(ships).values({
          id: newId('ship'),
          userId: fleet.userId,
          colonyId: attackerColony.id,
          shipType: shipId,
          count,
        })
      }
    }
  }

  // Defender loses its casualties from the hangar.
  await deductHangarLosses(target.id, defenderLost)

  // Grant the target a raid shield.
  await db
    .update(colonies)
    .set({ raidShieldUntil: new Date(now.getTime() + RAID_SHIELD_MS) })
    .where(eq(colonies.id, target.id))

  // Dual combat-log rows (attacker + defender perspectives).
  await db.insert(combatLogs).values({
    id: newId('combat'),
    userId: fleet.userId,
    sectorId: null,
    sectorName: `Raid vs ${defenderCallsign}`,
    faction: 'player',
    outcome: win ? 'win' : 'loss',
    attackerPower,
    defenderPower,
    shipsLost: attackerLost,
    energyLooted,
    alloyLooted,
    crystalLooted,
  })
  await db.insert(combatLogs).values({
    id: newId('combat'),
    userId: target.userId,
    sectorId: null,
    sectorName: `Raid by ${attackerCallsign}`,
    faction: 'player',
    outcome: win ? 'loss' : 'win',
    attackerPower,
    defenderPower,
    shipsLost: defenderLost,
    energyLooted,
    alloyLooted,
    crystalLooted,
  })

  // Comm alerts for both governors.
  if (win) {
    await logComm(
      fleet.userId,
      'combat',
      'success',
      `Raid on ${defenderCallsign} succeeded — looted ${energyLooted} Energy, ${alloyLooted} Alloy, ${crystalLooted} Crystal.`,
    )
    await logComm(
      target.userId,
      'combat',
      'danger',
      `${attackerCallsign} raided your colony ${target.name} and made off with ${energyLooted} Energy, ${alloyLooted} Alloy, ${crystalLooted} Crystal.`,
    )
  } else {
    await logComm(
      fleet.userId,
      'combat',
      'danger',
      `Raid on ${defenderCallsign} failed — their defenses held and your fleet was routed.`,
    )
    await logComm(
      target.userId,
      'combat',
      'success',
      `You repelled a raid by ${attackerCallsign}. Their fleet was driven off with heavy losses.`,
    )
  }

  await finish(win ? 'victorious' : 'defeated')
}

async function resolveFleetArrivals(now: Date) {
  const due = await db
    .select()
    .from(fleets)
    .where(and(eq(fleets.resolved, false), lte(fleets.arrivesAt, now)))

  for (const fleet of due) {
    // PvP raids target another player's colony, not a galaxy sector, so they
    // resolve before (and instead of) the sector lookup below.
    if (fleet.mission === 'pvp_raid') {
      await resolvePvpRaid(fleet, now)
      continue
    }

    if (!fleet.sectorId) {
      await db.update(fleets).set({ resolved: true, status: 'lost' }).where(eq(fleets.id, fleet.id))
      continue
    }
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
    } else if (fleet.mission === 'survey') {
      await resolveSurvey(fleet, sector, now)
      await db
        .update(fleets)
        .set({ resolved: true, status: 'surveyed' })
        .where(eq(fleets.id, fleet.id))
    } else if (fleet.mission === 'attack') {
      const basePower = fleetTotalPower(shipCounts, 'attack')

      // Layer creed fleet-attack bonus + allegiance Zeal/Dissent onto base power.
      let creedAttackMult = 1
      let zealKind: 'zeal' | 'dissent' | null = null
      let zealMult = 1
      const [atkGov] = await db
        .select()
        .from(governors)
        .where(eq(governors.userId, fleet.userId))
        .limit(1)
      if (atkGov) {
        const doctrineRows = await db
          .select({ doctrineId: doctrines.doctrineId, level: doctrines.level })
          .from(doctrines)
          .where(eq(doctrines.governorId, atkGov.id))
        creedAttackMult = creedModifiers(atkGov.creedId, doctrineRows, atkGov.allegiance)
          .fleetAttackMult
        const za = allegianceCombatMultiplier(atkGov.allegiance, sector.faction)
        zealMult = za.mult
        zealKind = za.kind
      }
      const attackerPower = Math.round(basePower * creedAttackMult * zealMult)

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

      const zealNote =
        zealKind === 'zeal'
          ? ' Zeal surged against a rival faction.'
          : zealKind === 'dissent'
            ? ' Dissent dulled the assault on your own faction.'
            : ''
      await logComm(
        fleet.userId,
        'combat',
        win ? 'success' : 'danger',
        (win
          ? `Victory at ${sector.name} — garrison broken. Fleet may now salvage the sector.`
          : `Defeat at ${sector.name} — fleet routed with heavy losses.`) + zealNote,
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
    } else if (fleet.mission === 'bloom_incursion') {
      // Bloom incursion arrives at the player's home colony — corrupts a
      // slice of stored resources and population rather than stealing them.
      const [homeColony] = await db
        .select()
        .from(colonies)
        .where(eq(colonies.id, fleet.colonyId))
        .limit(1)
      if (homeColony) {
        const settled = await settleColony(homeColony.id)
        if (settled) {
          const corruptedCrystal = Math.min(settled.crystal, settled.crystal * 0.12)
          const populationLoss = Math.round(settled.population * 0.05)
          await db
            .update(colonies)
            .set({
              crystal: settled.crystal - corruptedCrystal,
              population: Math.max(1, settled.population - populationLoss),
            })
            .where(eq(colonies.id, homeColony.id))
        }
      }
      await logComm(
        fleet.userId,
        'bloom',
        'danger',
        `The Bloom breached your perimeter — corrupted spores contaminated stored Crystal and thinned the population before retreating.`,
      )
      await db
        .update(fleets)
        .set({ resolved: true, status: 'incursion_complete' })
        .where(eq(fleets.id, fleet.id))
    } else if (fleet.mission === 'cleanse') {
      const attackerPower = fleetTotalPower(shipCounts, 'attack')
      const resistance = sector.bloomIntensity * 1.5
      const win = attackerPower > resistance && sector.faction === 'bloom'

      let shipsLost: Record<string, number> = {}
      if (win) {
        const purged = Math.max(1, Math.round(attackerPower / 4))
        const newIntensity = Math.max(0, sector.bloomIntensity - purged)
        const lossRatio = Math.min(0.35, resistance / (attackerPower + 1))
        for (const [shipId, count] of Object.entries(shipCounts)) {
          const lost = Math.floor(count * lossRatio)
          if (lost > 0) shipsLost[shipId] = lost
        }

        if (newIntensity <= 0) {
          await db
            .update(sectors)
            .set({
              faction: 'unclaimed',
              bloomIntensity: 0,
              garrisonStrength: 0,
              crystalReward: sector.crystalReward + 400,
            })
            .where(eq(sectors.id, sector.id))
          await logComm(
            fleet.userId,
            'bloom',
            'success',
            `Bloom fully cleansed at ${sector.name} — corruption purged and the sector reverted to unclaimed space.`,
          )
        } else {
          await db
            .update(sectors)
            .set({ bloomIntensity: newIntensity })
            .where(eq(sectors.id, sector.id))
          await logComm(
            fleet.userId,
            'bloom',
            'success',
            `Cleansing operation at ${sector.name} reduced Bloom intensity to ${newIntensity}%.`,
          )
        }
      } else {
        for (const [shipId, count] of Object.entries(shipCounts)) {
          shipsLost[shipId] = count
        }
        const backlash = Math.min(100, sector.bloomIntensity + 5)
        await db.update(sectors).set({ bloomIntensity: backlash }).where(eq(sectors.id, sector.id))
        await logComm(
          fleet.userId,
          'bloom',
          'danger',
          `Cleansing operation at ${sector.name} failed — the Bloom overwhelmed the fleet and intensified.`,
        )
      }

      await db.insert(combatLogs).values({
        id: newId('combat'),
        userId: fleet.userId,
        sectorId: sector.id,
        sectorName: sector.name,
        faction: sector.faction,
        outcome: win ? 'win' : 'loss',
        attackerPower,
        defenderPower: resistance,
        shipsLost,
        energyLooted: 0,
        alloyLooted: 0,
        crystalLooted: 0,
      })

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

      await db
        .update(fleets)
        .set({ resolved: true, status: win ? 'victorious' : 'defeated' })
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
        // New planet trait bonuses take effect immediately.
        await recomputeColonyRates(fleet.colonyId)
        const traitIds = Array.isArray(sector.traits) ? (sector.traits as string[]) : []
        const traitNames = traitIds
          .map((t) => getTraitDef(t)?.name)
          .filter((n): n is string => Boolean(n))
        const traitSuffix =
          traitNames.length > 0
            ? ` Survey teams confirm ${traitNames.join(', ')} — production uplift applied.`
            : ''
        await logComm(
          fleet.userId,
          'system',
          'success',
          `${sector.name} has been claimed for your holdings.${traitSuffix}`,
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

/**
 * A survey fleet reaching a system upgrades the player's discovery of it to
 * 'surveyed' (revealing all planets) and, for anomaly/derelict/ruin sites,
 * awards a one-off resource cache scaled by the player's Xeno-Archaeology.
 */
async function resolveSurvey(
  fleet: typeof fleets.$inferSelect,
  anchorSector: typeof sectors.$inferSelect,
  now: Date,
) {
  const systemId = anchorSector.systemId
  if (!systemId) return

  await db
    .update(systemDiscoveries)
    .set({ level: 'surveyed', discoveredAt: now })
    .where(
      and(eq(systemDiscoveries.userId, fleet.userId), eq(systemDiscoveries.systemId, systemId)),
    )

  const systemPlanets = await db.select().from(sectors).where(eq(sectors.systemId, systemId))
  const siteType = systemPlanets.find((p) => p.sectorType && p.sectorType !== 'outpost')?.sectorType

  // Xeno-Archaeology boosts anomaly/derelict payouts.
  const [xeno] = await db
    .select()
    .from(research)
    .where(and(eq(research.userId, fleet.userId), eq(research.techId, 'xeno-archaeology')))
    .limit(1)
  const rewardMult = 1 + (xeno?.level ?? 0) * 0.25

  const reward = rollSurveyReward(siteType, rewardMult)
  if (reward && (reward.energy || reward.alloy || reward.crystal)) {
    const settled = await settleColony(fleet.colonyId)
    if (settled) {
      await db
        .update(colonies)
        .set({
          energy: Math.min(settled.energyCap, settled.energy + (reward.energy ?? 0)),
          alloy: Math.min(settled.alloyCap, settled.alloy + (reward.alloy ?? 0)),
          crystal: Math.min(settled.crystalCap, settled.crystal + (reward.crystal ?? 0)),
        })
        .where(eq(colonies.id, fleet.colonyId))
    }
    await logComm(
      fleet.userId,
      'fleet',
      'success',
      `Survey of ${anchorSector.name.split(' ')[0]} complete — ${systemPlanets.length} planet(s) charted and a cache recovered (${reward.energy ?? 0}E / ${reward.alloy ?? 0}A / ${reward.crystal ?? 0}C).`,
    )
  } else {
    await logComm(
      fleet.userId,
      'fleet',
      'success',
      `Survey complete — ${systemPlanets.length} planet(s) charted and added to your star map.`,
    )
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

function sectorDistance(a: { positionX: number; positionY: number }, b: { positionX: number; positionY: number }) {
  return Math.max(Math.abs(a.positionX - b.positionX), Math.abs(a.positionY - b.positionY))
}

/**
 * The Bloom threat system: unclaimed sectors adjacent to a Bloom sector can
 * be consumed over time, and heavily-corrupted Bloom sectors adjacent to a
 * player's territory can trigger an incursion fleet against that player's
 * home colony. Throttled to once every BLOOM_SPREAD_INTERVAL_MS so it doesn't
 * run on every tick invocation.
 */
async function resolveBloomSpread(now: Date) {
  const [state] = await db.select().from(bloomState).where(eq(bloomState.id, BLOOM_STATE_ID)).limit(1)
  if (state && now.getTime() - state.lastSpreadAt.getTime() < BLOOM_SPREAD_INTERVAL_MS) return

  const allSectors = await db.select().from(sectors)
  const bloomSectors = allSectors.filter((s) => s.faction === 'bloom')

  for (const bloomSector of bloomSectors) {
    const nextIntensity = Math.min(100, bloomSector.bloomIntensity + 2 + Math.floor(Math.random() * 3))
    await db.update(sectors).set({ bloomIntensity: nextIntensity }).where(eq(sectors.id, bloomSector.id))
    bloomSector.bloomIntensity = nextIntensity

    // Spread: a high-intensity Bloom sector has a chance to consume an
    // adjacent unclaimed, non-Bloom sector.
    if (nextIntensity >= BLOOM_SPREAD_THRESHOLD && Math.random() < 0.3) {
      const candidates = allSectors.filter(
        (s) =>
          s.id !== bloomSector.id &&
          s.faction !== 'bloom' &&
          !s.ownerUserId &&
          sectorDistance(s, bloomSector) <= 1,
      )
      if (candidates.length > 0) {
        const target = candidates[Math.floor(Math.random() * candidates.length)]
        const seedIntensity = 15 + Math.floor(Math.random() * 11)
        await db
          .update(sectors)
          .set({
            faction: 'bloom',
            bloomIntensity: seedIntensity,
            garrisonStrength: Math.max(target.garrisonStrength, 20 + Math.floor(Math.random() * 20)),
          })
          .where(eq(sectors.id, target.id))
        target.faction = 'bloom'
        target.bloomIntensity = seedIntensity
      }
    }

    // Incursion: a heavily-corrupted Bloom sector adjacent to a player's
    // claimed sector may launch a raid fleet against that player's colony.
    if (nextIntensity >= BLOOM_INCURSION_THRESHOLD) {
      const threatenedOwners = new Set(
        allSectors
          .filter((s) => s.ownerUserId && sectorDistance(s, bloomSector) <= 1)
          .map((s) => s.ownerUserId as string),
      )
      for (const ownerUserId of threatenedOwners) {
        const [alreadyIncoming] = await db
          .select()
          .from(fleets)
          .where(
            and(
              eq(fleets.userId, ownerUserId),
              eq(fleets.mission, 'bloom_incursion'),
              eq(fleets.resolved, false),
            ),
          )
          .limit(1)
        if (alreadyIncoming) continue

        const [countermeasures] = await db
          .select()
          .from(research)
          .where(and(eq(research.userId, ownerUserId), eq(research.techId, 'bloom-countermeasures')))
          .limit(1)
        const reduction = (countermeasures?.level ?? 0) * 0.05
        const incursionChance = Math.max(0.05, 0.35 - reduction)
        if (Math.random() >= incursionChance) continue

        const [homeColony] = await db
          .select()
          .from(colonies)
          .where(eq(colonies.userId, ownerUserId))
          .limit(1)
        if (!homeColony) continue

        const incursionArrival = new Date(now.getTime() + 8 * 60 * 1000)
        await db.insert(fleets).values({
          id: newId('fleet'),
          userId: ownerUserId,
          colonyId: homeColony.id,
          sectorId: bloomSector.id,
          mission: 'bloom_incursion',
          shipCounts: {},
          departedAt: now,
          arrivesAt: incursionArrival,
          status: 'en_route',
          resolved: false,
        })
        await logComm(
          ownerUserId,
          'bloom',
          'danger',
          `Bloom incursion detected near your territory — corrupted spores advancing on your colony, ETA 8 minutes.`,
        )
      }
    }
  }

  if (state) {
    await db.update(bloomState).set({ lastSpreadAt: now }).where(eq(bloomState.id, BLOOM_STATE_ID))
  } else {
    await db.insert(bloomState).values({ id: BLOOM_STATE_ID, lastSpreadAt: now })
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
  await resolveBloomSpread(now)
  await resolveMarketOrders()
  return { ranAt: now.toISOString() }
}
