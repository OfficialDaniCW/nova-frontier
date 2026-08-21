'use server'

import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { colonies, buildings, ships } from '@/lib/db/schema'
import { getUserId } from '@/lib/game/session'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { runTick } from '@/lib/game/tick'
import { SHIP_DEFS, getShipDef } from '@/lib/game/definitions'
import { canAfford, subtractCost, projectColonyResources } from '@/lib/game/resources'
import { revalidatePath } from 'next/cache'

export async function getShipyardState() {
  const userId = await getUserId()
  await runTick()
  await ensurePlayerBootstrapped(userId)

  const [colony] = await db.select().from(colonies).where(eq(colonies.userId, userId)).limit(1)
  if (!colony) throw new Error('No colony found')

  const buildingRows = await db.select().from(buildings).where(eq(buildings.colonyId, colony.id))
  const shipRows = await db.select().from(ships).where(eq(ships.colonyId, colony.id))
  const projected = projectColonyResources(colony)

  const shipDefs = SHIP_DEFS.map((def) => {
    const row = shipRows.find((s) => s.shipType === def.id)
    const reqBuilding = buildingRows.find((b) => b.buildingType === def.requiresBuilding.id)
    const unlocked = (reqBuilding?.level ?? 0) >= def.requiresBuilding.level
    return { def, row, unlocked }
  })

  return { colony, projected, shipDefs, shipRows }
}

export async function fabricateShip(shipType: string, quantity: number) {
  const userId = await getUserId()
  await runTick()
  await ensurePlayerBootstrapped(userId)

  if (quantity < 1 || quantity > 50) throw new Error('Invalid quantity')

  const [colony] = await db.select().from(colonies).where(eq(colonies.userId, userId)).limit(1)
  if (!colony) throw new Error('No colony found')

  const def = getShipDef(shipType)
  const buildingRows = await db.select().from(buildings).where(eq(buildings.colonyId, colony.id))
  const reqBuilding = buildingRows.find((b) => b.buildingType === def.requiresBuilding.id)
  if ((reqBuilding?.level ?? 0) < def.requiresBuilding.level) {
    throw new Error('Shipyard level too low')
  }

  let [row] = await db
    .select()
    .from(ships)
    .where(and(eq(ships.colonyId, colony.id), eq(ships.shipType, shipType)))
    .limit(1)

  if (!row) {
    ;[row] = await db
      .insert(ships)
      .values({ id: `shp_${crypto.randomUUID()}`, userId, colonyId: colony.id, shipType, count: 0 })
      .returning()
  }

  if (row.queuedCount != null) throw new Error('Fabrication queue already occupied')

  const totalCost = {
    energy: (def.cost.energy ?? 0) * quantity,
    alloy: (def.cost.alloy ?? 0) * quantity,
    crystal: (def.cost.crystal ?? 0) * quantity,
  }
  const projected = projectColonyResources(colony)
  if (!canAfford(projected, totalCost)) throw new Error('Insufficient resources')

  const remaining = subtractCost(projected, totalCost)
  await db
    .update(colonies)
    .set({ ...remaining, lastTickAt: new Date() })
    .where(eq(colonies.id, colony.id))

  const now = new Date()
  const etaMs = def.buildTimeSec * quantity * 1000
  await db
    .update(ships)
    .set({
      queuedCount: quantity,
      queueStartedAt: now,
      queueEtaAt: new Date(now.getTime() + etaMs),
    })
    .where(eq(ships.id, row.id))

  revalidatePath('/play/shipyard')
  return { ok: true }
}
