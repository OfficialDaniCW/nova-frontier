'use server'

import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { colonies, ships, sectors, fleets, combatLogs, starSystems, systemDiscoveries } from '@/lib/db/schema'
import { getUserId } from '@/lib/game/session'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { ensureGalaxySeeded } from '@/lib/game/galaxy-seed'
import { runTick } from '@/lib/game/tick'
import {
  SECTOR_DISTANCE_SPEED_SEC_PER_UNIT,
  DEEP_SCAN_RANGE_BONUS,
  DEEP_SCAN_ENERGY_COST,
  DEEP_SCAN_COOLDOWN_SEC,
} from '@/lib/game/definitions'
import {
  ensurePlayerDiscoveryBootstrapped,
  detectSystemsInRange,
  getSensorRange,
} from '@/lib/game/discovery'
import { galaxyDistance } from '@/lib/game/galaxy'
import { getCompactMateUserIds } from '@/app/actions/compact'
import { revalidatePath } from 'next/cache'

export async function getGalaxyState() {
  const userId = await getUserId()
  await ensureGalaxySeeded()
  await runTick()
  const { colony } = await ensurePlayerBootstrapped(userId)
  await ensurePlayerDiscoveryBootstrapped(userId)

  const sectorRows = await db.select().from(sectors)
  const shipRows = colony
    ? await db.select().from(ships).where(eq(ships.colonyId, colony.id))
    : []
  const activeFleets = await db
    .select()
    .from(fleets)
    .where(and(eq(fleets.userId, userId), eq(fleets.resolved, false)))
  const recentCombat = await db
    .select()
    .from(combatLogs)
    .where(eq(combatLogs.userId, userId))
    .limit(20)
  const compactMateUserIds = await getCompactMateUserIds(userId)

  return {
    sectors: sectorRows,
    shipRows,
    activeFleets,
    recentCombat,
    colony,
    compactMateUserIds,
    homeSystemId: colony?.homeSystemId ?? null,
  }
}

/** Resolve the galaxy coordinates a colony's fleets depart from (its home system). */
async function homeSystemCoords(colonyId: string): Promise<{ positionX: number; positionY: number }> {
  const [colony] = await db.select().from(colonies).where(eq(colonies.id, colonyId)).limit(1)
  if (colony?.homeSystemId) {
    const [home] = await db
      .select()
      .from(starSystems)
      .where(eq(starSystems.id, colony.homeSystemId))
      .limit(1)
    if (home) return { positionX: home.positionX, positionY: home.positionY }
  }
  return { positionX: 0, positionY: 0 }
}

async function launchFleet(
  userId: string,
  colonyId: string,
  sectorId: string,
  mission: string,
  shipCounts: Record<string, number>,
) {
  const [sector] = await db.select().from(sectors).where(eq(sectors.id, sectorId)).limit(1)
  if (!sector) throw new Error('Sector not found')

  // Deduct ships from hangar (they're "in flight" — represented by absence from hangar count).
  for (const [shipType, count] of Object.entries(shipCounts)) {
    if (count <= 0) continue
    const [row] = await db
      .select()
      .from(ships)
      .where(and(eq(ships.colonyId, colonyId), eq(ships.shipType, shipType)))
      .limit(1)
    if (!row || row.count < count) throw new Error(`Not enough ${shipType} in hangar`)
    await db.update(ships).set({ count: row.count - count }).where(eq(ships.id, row.id))
  }

  // Travel time = galaxy distance from the colony's home system to the target.
  const origin = await homeSystemCoords(colonyId)
  const distance = galaxyDistance(origin, sector) + 1
  const travelSec = distance * SECTOR_DISTANCE_SPEED_SEC_PER_UNIT
  const now = new Date()
  await db.insert(fleets).values({
    id: `fleet_${crypto.randomUUID()}`,
    userId,
    colonyId,
    sectorId,
    mission,
    shipCounts,
    departedAt: now,
    arrivesAt: new Date(now.getTime() + travelSec * 1000),
    status: 'en_route',
    resolved: false,
  })

  revalidatePath('/play/galaxy')
  return { ok: true, etaSec: travelSec }
}

export async function scoutSector(sectorId: string) {
  const userId = await getUserId()
  await runTick()
  const { colony } = await ensurePlayerBootstrapped(userId)
  if (!colony) throw new Error('No colony found')

  const [scoutRow] = await db
    .select()
    .from(ships)
    .where(and(eq(ships.colonyId, colony.id), eq(ships.shipType, 'scout-probe')))
    .limit(1)
  if (!scoutRow || scoutRow.count < 1) throw new Error('No scout probes available')

  return launchFleet(userId, colony.id, sectorId, 'scout', { 'scout-probe': 1 })
}

export async function attackSector(sectorId: string, shipCounts: Record<string, number>) {
  const userId = await getUserId()
  await runTick()
  const { colony } = await ensurePlayerBootstrapped(userId)
  if (!colony) throw new Error('No colony found')

  const totalShips = Object.values(shipCounts).reduce((a, b) => a + b, 0)
  if (totalShips < 1) throw new Error('Select at least one ship')

  const [sector] = await db.select().from(sectors).where(eq(sectors.id, sectorId)).limit(1)
  if (sector?.ownerUserId) {
    const compactMates = await getCompactMateUserIds(userId)
    if (compactMates.includes(sector.ownerUserId)) {
      throw new Error('Cannot attack a fellow Compact member\'s territory')
    }
  }

  return launchFleet(userId, colony.id, sectorId, 'attack', shipCounts)
}

export async function salvageSector(sectorId: string) {
  const userId = await getUserId()
  await runTick()
  const { colony } = await ensurePlayerBootstrapped(userId)
  if (!colony) throw new Error('No colony found')

  const [sector] = await db.select().from(sectors).where(eq(sectors.id, sectorId)).limit(1)
  if (!sector) throw new Error('Sector not found')
  if (sector.garrisonStrength > 0) throw new Error('Sector garrison must be cleared first')
  if (sector.ownerUserId) {
    const compactMates = await getCompactMateUserIds(userId)
    if (compactMates.includes(sector.ownerUserId)) {
      throw new Error('Cannot salvage a fellow Compact member\'s territory')
    }
  }

  const [haulerRow] = await db
    .select()
    .from(ships)
    .where(and(eq(ships.colonyId, colony.id), eq(ships.shipType, 'hauler')))
    .limit(1)
  const haulerCount = Math.min(1, haulerRow?.count ?? 0)
  if (haulerCount < 1) throw new Error('No haulers available')

  return launchFleet(userId, colony.id, sectorId, 'salvage', { hauler: 1 })
}

export async function cleanseSector(sectorId: string, shipCounts: Record<string, number>) {
  const userId = await getUserId()
  await runTick()
  const { colony } = await ensurePlayerBootstrapped(userId)
  if (!colony) throw new Error('No colony found')

  const totalShips = Object.values(shipCounts).reduce((a, b) => a + b, 0)
  if (totalShips < 1) throw new Error('Select at least one ship')

  const [sector] = await db.select().from(sectors).where(eq(sectors.id, sectorId)).limit(1)
  if (!sector) throw new Error('Sector not found')
  if (sector.faction !== 'bloom' || sector.bloomIntensity <= 0) {
    throw new Error('Only Bloom-corrupted sectors can be cleansed')
  }

  return launchFleet(userId, colony.id, sectorId, 'cleanse', shipCounts)
}

export async function colonizeSector(sectorId: string) {
  const userId = await getUserId()
  await runTick()
  const { colony } = await ensurePlayerBootstrapped(userId)
  if (!colony) throw new Error('No colony found')

  const [sector] = await db.select().from(sectors).where(eq(sectors.id, sectorId)).limit(1)
  if (!sector) throw new Error('Sector not found')
  if (sector.garrisonStrength > 0 || sector.ownerUserId) {
    throw new Error('Sector is not eligible for colonization')
  }

  const [haulerRow] = await db
    .select()
    .from(ships)
    .where(and(eq(ships.colonyId, colony.id), eq(ships.shipType, 'hauler')))
    .limit(1)
  const haulerCount = Math.min(1, haulerRow?.count ?? 0)
  if (haulerCount < 1) throw new Error('No haulers available')

  return launchFleet(userId, colony.id, sectorId, 'colonize', { hauler: 1 })
}

/**
 * Dispatch a scout probe to survey a *detected* system, revealing its planets on
 * arrival. Fleet targets the system's first planet as its coordinate anchor.
 */
export async function surveySystem(systemId: string) {
  const userId = await getUserId()
  await runTick()
  const { colony } = await ensurePlayerBootstrapped(userId)
  await ensurePlayerDiscoveryBootstrapped(userId)
  if (!colony) throw new Error('No colony found')

  const detail = await getSystemDiscoveryLevel(userId, systemId)
  if (!detail) throw new Error('System not yet detected')
  if (detail === 'surveyed') throw new Error('System already surveyed')

  const [scoutRow] = await db
    .select()
    .from(ships)
    .where(and(eq(ships.colonyId, colony.id), eq(ships.shipType, 'scout-probe')))
    .limit(1)
  if (!scoutRow || scoutRow.count < 1) throw new Error('No scout probes available')

  const [anchor] = await db
    .select()
    .from(sectors)
    .where(eq(sectors.systemId, systemId))
    .limit(1)
  if (!anchor) throw new Error('System has no charted bodies')

  return launchFleet(userId, colony.id, anchor.id, 'survey', { 'scout-probe': 1 })
}

async function getSystemDiscoveryLevel(userId: string, systemId: string) {
  const [row] = await db
    .select({ level: systemDiscoveries.level })
    .from(systemDiscoveries)
    .where(and(eq(systemDiscoveries.userId, userId), eq(systemDiscoveries.systemId, systemId)))
    .limit(1)
  return row?.level ?? null
}

/**
 * Deep Scan: spend energy on an extended sensor sweep from the home system,
 * detecting undiscovered systems in an expanded radius. Instant, on a cooldown.
 */
export async function deepScan() {
  const userId = await getUserId()
  await runTick()
  const { colony } = await ensurePlayerBootstrapped(userId)
  await ensurePlayerDiscoveryBootstrapped(userId)
  if (!colony) throw new Error('No colony found')
  if (!colony.homeSystemId) throw new Error('No home system established')

  const now = Date.now()
  if (colony.lastDeepScanAt) {
    const elapsed = (now - new Date(colony.lastDeepScanAt).getTime()) / 1000
    if (elapsed < DEEP_SCAN_COOLDOWN_SEC) {
      throw new Error(`Sensors recharging — ${Math.ceil(DEEP_SCAN_COOLDOWN_SEC - elapsed)}s left`)
    }
  }
  if (colony.energy < DEEP_SCAN_ENERGY_COST) {
    throw new Error(`Deep Scan needs ${DEEP_SCAN_ENERGY_COST} energy`)
  }

  const [home] = await db
    .select()
    .from(starSystems)
    .where(eq(starSystems.id, colony.homeSystemId))
    .limit(1)
  if (!home) throw new Error('Home system not found')

  const range = (await getSensorRange(userId)) + DEEP_SCAN_RANGE_BONUS
  const detected = await detectSystemsInRange(userId, home, range)

  await db
    .update(colonies)
    .set({ energy: colony.energy - DEEP_SCAN_ENERGY_COST, lastDeepScanAt: new Date(now) })
    .where(eq(colonies.id, colony.id))

  revalidatePath('/play/galaxy')
  return { ok: true, detected }
}
