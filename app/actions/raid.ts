'use server'

import { and, eq, inArray, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  colonies,
  ships,
  fleets,
  combatLogs,
  governors,
  buildings,
  starSystems,
  compacts,
  compactMembers,
} from '@/lib/db/schema'
import { getUserId } from '@/lib/game/session'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { runTick } from '@/lib/game/tick'
import { SECTOR_DISTANCE_SPEED_SEC_PER_UNIT } from '@/lib/game/definitions'
import { galaxyDistance } from '@/lib/game/galaxy'
import { areCompactsAtWar } from '@/app/actions/diplomacy'
import {
  fleetAttackPower,
  stationedDefensePower,
  isRaidShielded,
} from '@/lib/game/combat'
import { revalidatePath } from 'next/cache'

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

async function getUserCompactId(userId: string) {
  const [m] = await db
    .select()
    .from(compactMembers)
    .where(eq(compactMembers.userId, userId))
    .limit(1)
  return m?.compactId ?? null
}

/** Coordinates a colony's fleets depart from (its home system), default origin. */
async function homeCoords(colony: typeof colonies.$inferSelect) {
  if (colony.homeSystemId) {
    const [home] = await db
      .select()
      .from(starSystems)
      .where(eq(starSystems.id, colony.homeSystemId))
      .limit(1)
    if (home) return { positionX: home.positionX, positionY: home.positionY }
  }
  return { positionX: 0, positionY: 0 }
}

function shipMap(rows: { shipType: string; count: number }[]) {
  const m: Record<string, number> = {}
  for (const r of rows) if (r.count > 0) m[r.shipType] = r.count
  return m
}

export type RaidTarget = {
  defenderUserId: string
  callsign: string
  colonyId: string
  colonyName: string
  compactTag: string
  distance: number
  etaSec: number
  defensePower: number
  shielded: boolean
  shieldUntil: string | null
}

export type RaidFleetView = {
  id: string
  direction: 'outgoing' | 'incoming'
  otherCallsign: string
  shipCounts: Record<string, number>
  arrivesAt: string
}

export type RaidLogView = {
  id: string
  sectorName: string
  outcome: string
  attackerPower: number
  defenderPower: number
  energyLooted: number
  alloyLooted: number
  crystalLooted: number
  createdAt: string
}

export async function getRaidState() {
  const userId = await getUserId()
  await runTick()
  const { colony } = await ensurePlayerBootstrapped(userId)

  const myCompactId = await getUserCompactId(userId)

  // --- My defense summary -------------------------------------------------
  const now = Date.now()
  let myShieldLevel = 0
  let myDefensePower = 0
  let myRaidShieldUntil: string | null = null
  let myStationed: Record<string, number> = {}
  if (colony) {
    const [shieldRow] = await db
      .select()
      .from(buildings)
      .where(
        and(eq(buildings.colonyId, colony.id), eq(buildings.buildingType, 'shield-generator')),
      )
      .limit(1)
    myShieldLevel = shieldRow?.level ?? 0
    const rows = await db.select().from(ships).where(eq(ships.colonyId, colony.id))
    myStationed = shipMap(rows)
    myDefensePower = Math.round(stationedDefensePower(myStationed, myShieldLevel))
    myRaidShieldUntil = colony.raidShieldUntil ? new Date(colony.raidShieldUntil).toISOString() : null
  }

  // --- Valid enemy targets (players in at-war compacts) -------------------
  const targets: RaidTarget[] = []
  if (colony && myCompactId) {
    const origin = await homeCoords(colony)

    // Compacts at war with mine.
    const otherCompacts = (await db.select().from(compacts)).filter((c) => c.id !== myCompactId)
    const atWarCompactIds: string[] = []
    for (const c of otherCompacts) {
      if (await areCompactsAtWar(myCompactId, c.id)) atWarCompactIds.push(c.id)
    }

    if (atWarCompactIds.length > 0) {
      const enemyMembers = await db
        .select()
        .from(compactMembers)
        .where(inArray(compactMembers.compactId, atWarCompactIds))
      const enemyUserIds = enemyMembers.map((m) => m.userId).filter((id) => id !== userId)

      if (enemyUserIds.length > 0) {
        const enemyColonies = await db
          .select()
          .from(colonies)
          .where(inArray(colonies.userId, enemyUserIds))
        const enemyGovs = await db
          .select()
          .from(governors)
          .where(inArray(governors.userId, enemyUserIds))
        const tagByCompact = new Map(otherCompacts.map((c) => [c.id, c.tag]))
        const compactByUser = new Map(enemyMembers.map((m) => [m.userId, m.compactId]))

        // Home colony per enemy user (lowest-id colony = their capital).
        const homeByUser = new Map<string, typeof colonies.$inferSelect>()
        for (const ec of enemyColonies) {
          const prev = homeByUser.get(ec.userId)
          if (!prev || ec.id < prev.id) homeByUser.set(ec.userId, ec)
        }

        for (const [enemyId, ec] of homeByUser) {
          const gov = enemyGovs.find((g) => g.userId === enemyId)
          const coords = await homeCoords(ec)
          const distance = galaxyDistance(origin, coords) + 1
          const defRows = await db.select().from(ships).where(eq(ships.colonyId, ec.id))
          const [defShield] = await db
            .select()
            .from(buildings)
            .where(
              and(eq(buildings.colonyId, ec.id), eq(buildings.buildingType, 'shield-generator')),
            )
            .limit(1)
          const shielded = isRaidShielded(ec.raidShieldUntil, now)
          targets.push({
            defenderUserId: enemyId,
            callsign: gov?.callsign ?? 'Unknown Governor',
            colonyId: ec.id,
            colonyName: ec.name,
            compactTag: tagByCompact.get(compactByUser.get(enemyId) ?? '') ?? '???',
            distance,
            etaSec: Math.round(distance * SECTOR_DISTANCE_SPEED_SEC_PER_UNIT),
            defensePower: Math.round(stationedDefensePower(shipMap(defRows), defShield?.level ?? 0)),
            shielded,
            shieldUntil: shielded ? new Date(ec.raidShieldUntil as Date).toISOString() : null,
          })
        }
        targets.sort((a, b) => a.distance - b.distance)
      }
    }
  }

  // --- Active raid fleets (mine outgoing + incoming at me) ----------------
  const raidFleets: RaidFleetView[] = []
  const outgoing = await db
    .select()
    .from(fleets)
    .where(and(eq(fleets.userId, userId), eq(fleets.mission, 'pvp_raid'), eq(fleets.resolved, false)))
  for (const f of outgoing) {
    const cs = f.defenderUserId ? await callsign(f.defenderUserId) : 'Unknown'
    raidFleets.push({
      id: f.id,
      direction: 'outgoing',
      otherCallsign: cs,
      shipCounts: f.shipCounts as Record<string, number>,
      arrivesAt: f.arrivesAt.toISOString(),
    })
  }
  const incoming = await db
    .select()
    .from(fleets)
    .where(
      and(
        eq(fleets.defenderUserId, userId),
        eq(fleets.mission, 'pvp_raid'),
        eq(fleets.resolved, false),
      ),
    )
  for (const f of incoming) {
    raidFleets.push({
      id: f.id,
      direction: 'incoming',
      otherCallsign: await callsign(f.userId),
      shipCounts: f.shipCounts as Record<string, number>,
      arrivesAt: f.arrivesAt.toISOString(),
    })
  }
  raidFleets.sort((a, b) => new Date(a.arrivesAt).getTime() - new Date(b.arrivesAt).getTime())

  // --- Recent raid combat logs (player-faction only) ----------------------
  const logs = await db
    .select()
    .from(combatLogs)
    .where(and(eq(combatLogs.userId, userId), eq(combatLogs.faction, 'player')))
    .orderBy(desc(combatLogs.createdAt))
    .limit(15)
  const raidLogs: RaidLogView[] = logs.map((l) => ({
    id: l.id,
    sectorName: l.sectorName,
    outcome: l.outcome,
    attackerPower: l.attackerPower,
    defenderPower: l.defenderPower,
    energyLooted: l.energyLooted,
    alloyLooted: l.alloyLooted,
    crystalLooted: l.crystalLooted,
    createdAt: l.createdAt.toISOString(),
  }))

  return {
    inCompact: !!myCompactId,
    stationed: myStationed,
    defensePower: myDefensePower,
    shieldLevel: myShieldLevel,
    raidShieldUntil: myRaidShieldUntil,
    attackPower: Math.round(fleetAttackPower(myStationed)),
    targets,
    raidFleets,
    raidLogs,
  }
}

async function callsign(userId: string) {
  const [g] = await db
    .select({ callsign: governors.callsign })
    .from(governors)
    .where(eq(governors.userId, userId))
    .limit(1)
  return g?.callsign ?? 'Unknown Governor'
}

export async function launchRaid(defenderUserId: string, shipCounts: Record<string, number>) {
  const userId = await getUserId()
  await runTick()
  const { colony } = await ensurePlayerBootstrapped(userId)
  if (!colony) throw new Error('No colony found')
  if (defenderUserId === userId) throw new Error('You cannot raid yourself')

  const totalShips = Object.values(shipCounts).reduce((a, b) => a + (b > 0 ? b : 0), 0)
  if (totalShips < 1) throw new Error('Select at least one ship')
  if (fleetAttackPower(shipCounts) <= 0) throw new Error('Raiding fleet has no offensive power')

  // War gating: both must be in compacts, and those compacts must be at war.
  const myCompactId = await getUserCompactId(userId)
  const theirCompactId = await getUserCompactId(defenderUserId)
  if (!myCompactId) throw new Error('You must belong to a Compact to raid')
  if (!theirCompactId) throw new Error('Target is not in a Compact')
  if (!(await areCompactsAtWar(myCompactId, theirCompactId))) {
    throw new Error('You can only raid players whose Compact is at war with yours')
  }

  // Target's home colony (their lowest-id colony = capital).
  const theirColonies = await db
    .select()
    .from(colonies)
    .where(eq(colonies.userId, defenderUserId))
  if (theirColonies.length === 0) throw new Error('Target has no colony')
  const target = theirColonies.reduce((a, b) => (a.id <= b.id ? a : b))

  if (isRaidShielded(target.raidShieldUntil, Date.now())) {
    throw new Error('Target colony is protected by a raid shield right now')
  }

  // Deduct ships from the raider's hangar.
  for (const [shipType, count] of Object.entries(shipCounts)) {
    if (count <= 0) continue
    const [row] = await db
      .select()
      .from(ships)
      .where(and(eq(ships.colonyId, colony.id), eq(ships.shipType, shipType)))
      .limit(1)
    if (!row || row.count < count) throw new Error(`Not enough ${shipType} in hangar`)
    await db.update(ships).set({ count: row.count - count }).where(eq(ships.id, row.id))
  }

  // Travel time from my home system to theirs.
  const origin = await homeCoords(colony)
  const dest = await homeCoords(target)
  const distance = galaxyDistance(origin, dest) + 1
  const travelSec = distance * SECTOR_DISTANCE_SPEED_SEC_PER_UNIT
  const now = new Date()

  const cleanCounts: Record<string, number> = {}
  for (const [k, v] of Object.entries(shipCounts)) if (v > 0) cleanCounts[k] = v

  await db.insert(fleets).values({
    id: newId('fleet'),
    userId,
    colonyId: colony.id,
    sectorId: null,
    mission: 'pvp_raid',
    shipCounts: cleanCounts,
    targetColonyId: target.id,
    defenderUserId,
    departedAt: now,
    arrivesAt: new Date(now.getTime() + travelSec * 1000),
    status: 'en_route',
    resolved: false,
  })

  revalidatePath('/play/war')
  return { ok: true, etaSec: travelSec }
}
