'use server'

import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { colonies, ships, sectors, fleets, combatLogs } from '@/lib/db/schema'
import { getUserId } from '@/lib/game/session'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { runTick } from '@/lib/game/tick'
import { SECTOR_DISTANCE_SPEED_SEC_PER_UNIT } from '@/lib/game/definitions'
import { revalidatePath } from 'next/cache'

export async function getGalaxyState() {
  const userId = await getUserId()
  await runTick()
  const { colony } = await ensurePlayerBootstrapped(userId)

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

  return { sectors: sectorRows, shipRows, activeFleets, recentCombat, colony }
}

function distanceBetween(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
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

  const distance = distanceBetween(0, 0, sector.positionX, sector.positionY) + 1
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

  const [haulerRow] = await db
    .select()
    .from(ships)
    .where(and(eq(ships.colonyId, colony.id), eq(ships.shipType, 'hauler')))
    .limit(1)
  const haulerCount = Math.min(1, haulerRow?.count ?? 0)
  if (haulerCount < 1) throw new Error('No haulers available')

  return launchFleet(userId, colony.id, sectorId, 'salvage', { hauler: 1 })
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
