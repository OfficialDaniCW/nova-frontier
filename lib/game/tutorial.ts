import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { buildings, research, ships, fleets, marketOrders } from '@/lib/db/schema'
import { STARTER_BUILDING_LEVELS, STARTER_SHIP_COUNTS } from '@/lib/game/bootstrap'

export interface TutorialProgress {
  upgradedBuilding: boolean
  queuedResearch: boolean
  fabricatedShip: boolean
  launchedFleet: boolean
  postedTrade: boolean
}

/**
 * Derives first-login checklist completion directly from existing game
 * state (no separate tracking table needed) — each item is true once the
 * player has gone past what `foundColony` grants for free.
 */
export async function getTutorialProgress(userId: string, colonyId: string): Promise<TutorialProgress> {
  const [buildingRows, researchRows, shipRows, fleetRows, orderRows] = await Promise.all([
    db.select().from(buildings).where(eq(buildings.colonyId, colonyId)),
    db.select().from(research).where(eq(research.userId, userId)),
    db.select().from(ships).where(eq(ships.colonyId, colonyId)),
    db.select().from(fleets).where(eq(fleets.userId, userId)).limit(1),
    db.select().from(marketOrders).where(eq(marketOrders.userId, userId)).limit(1),
  ])

  const upgradedBuilding = buildingRows.some(
    (b) => b.level > (STARTER_BUILDING_LEVELS[b.buildingType] ?? 0) || b.queuedLevel != null,
  )
  const queuedResearch = researchRows.some((r) => r.level > 0 || r.queuedLevel != null)
  const fabricatedShip = shipRows.some(
    (s) => s.count > (STARTER_SHIP_COUNTS[s.shipType] ?? 0) || (s.queuedCount ?? 0) > 0,
  )
  const launchedFleet = fleetRows.length > 0
  const postedTrade = orderRows.length > 0

  return { upgradedBuilding, queuedResearch, fabricatedShip, launchedFleet, postedTrade }
}
