'use server'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { colonies, buildings } from '@/lib/db/schema'
import { getUserId } from '@/lib/game/session'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { runTick, recomputeColonyRates } from '@/lib/game/tick'
import {
  BUILDING_DEFS,
  getBuildingDef,
  buildingCostAtLevel,
  buildingTimeAtLevel,
  RESOURCE_PRIORITY_DEFS,
  type ResourcePriority,
} from '@/lib/game/definitions'
import { canAfford, subtractCost, projectColonyResources } from '@/lib/game/resources'
import { revalidatePath } from 'next/cache'

export async function getColonyState() {
  const userId = await getUserId()
  await runTick()
  await ensurePlayerBootstrapped(userId)

  const [colony] = await db.select().from(colonies).where(eq(colonies.userId, userId)).limit(1)
  if (!colony) throw new Error('No colony found')

  const buildingRows = await db.select().from(buildings).where(eq(buildings.colonyId, colony.id))
  const projected = projectColonyResources(colony)

  const buildingDefs = BUILDING_DEFS.map((def) => {
    const row = buildingRows.find((b) => b.buildingType === def.id)
    return { def, row }
  })

  return { colony, projected, buildingDefs, buildingRows }
}

export async function upgradeBuilding(buildingType: string) {
  const userId = await getUserId()
  await runTick()

  const [colony] = await db.select().from(colonies).where(eq(colonies.userId, userId)).limit(1)
  if (!colony) throw new Error('No colony found')

  const buildingRows = await db.select().from(buildings).where(eq(buildings.colonyId, colony.id))
  const row = buildingRows.find((b) => b.buildingType === buildingType)
  if (!row) throw new Error('Building not found')
  if (buildingRows.some((b) => b.queuedLevel != null)) throw new Error('Queue already occupied')

  const def = getBuildingDef(buildingType)
  const targetLevel = row.level + 1
  if (targetLevel > def.maxLevel) throw new Error('Maximum level reached')

  const cost = buildingCostAtLevel(def, targetLevel)
  const projected = projectColonyResources(colony)
  if (!canAfford(projected, cost)) throw new Error('Insufficient resources')

  const remaining = subtractCost(projected, cost)
  await db
    .update(colonies)
    .set({ ...remaining, lastTickAt: new Date() })
    .where(eq(colonies.id, colony.id))

  const now = new Date()
  const etaMs = buildingTimeAtLevel(def, targetLevel) * 1000
  await db
    .update(buildings)
    .set({
      queuedLevel: targetLevel,
      queueStartedAt: now,
      queueEtaAt: new Date(now.getTime() + etaMs),
    })
    .where(eq(buildings.id, row.id))

  revalidatePath('/play/colony')
  return { ok: true }
}

export async function setResourcePriority(priority: ResourcePriority) {
  const userId = await getUserId()
  await runTick()

  const valid = RESOURCE_PRIORITY_DEFS.some((p) => p.id === priority)
  if (!valid) throw new Error('Invalid resource priority')

  const [colony] = await db.select().from(colonies).where(eq(colonies.userId, userId)).limit(1)
  if (!colony) throw new Error('No colony found')

  await db.update(colonies).set({ resourcePriority: priority }).where(eq(colonies.id, colony.id))
  await recomputeColonyRates(colony.id)

  revalidatePath('/play/colony')
  return { ok: true }
}
