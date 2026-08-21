'use server'

import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { colonies, buildings, research } from '@/lib/db/schema'
import { getUserId } from '@/lib/game/session'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { runTick } from '@/lib/game/tick'
import {
  RESEARCH_DEFS,
  getResearchDef,
  researchCostAtLevel,
  researchTimeAtLevel,
} from '@/lib/game/definitions'
import { canAfford, subtractCost, projectColonyResources } from '@/lib/game/resources'
import { revalidatePath } from 'next/cache'

export async function getResearchState() {
  const userId = await getUserId()
  await runTick()
  const { governor } = await ensurePlayerBootstrapped(userId)

  const [colony] = await db.select().from(colonies).where(eq(colonies.userId, userId)).limit(1)
  const buildingRows = colony
    ? await db.select().from(buildings).where(eq(buildings.colonyId, colony.id))
    : []
  const researchRows = await db.select().from(research).where(eq(research.governorId, governor.id))

  const projected = colony ? projectColonyResources(colony) : null

  const researchDefs = RESEARCH_DEFS.map((def) => {
    const row = researchRows.find((r) => r.techId === def.id)
    const reqBuilding = buildingRows.find((b) => b.buildingType === def.requiresBuilding.id)
    const unlocked = (reqBuilding?.level ?? 0) >= def.requiresBuilding.level
    return { def, row, unlocked }
  })

  return { colony, projected, researchDefs, governor, researchRows, buildingRows }
}

export async function upgradeResearch(techId: string) {
  const userId = await getUserId()
  await runTick()
  const { governor } = await ensurePlayerBootstrapped(userId)

  const [colony] = await db.select().from(colonies).where(eq(colonies.userId, userId)).limit(1)
  if (!colony) throw new Error('No colony found')

  const def = getResearchDef(techId)
  const buildingRows = await db.select().from(buildings).where(eq(buildings.colonyId, colony.id))
  const reqBuilding = buildingRows.find((b) => b.buildingType === def.requiresBuilding.id)
  if ((reqBuilding?.level ?? 0) < def.requiresBuilding.level) {
    throw new Error('Prerequisite building level not met')
  }

  let [row] = await db
    .select()
    .from(research)
    .where(and(eq(research.governorId, governor.id), eq(research.techId, techId)))
    .limit(1)

  if (!row) {
    ;[row] = await db
      .insert(research)
      .values({ id: `res_${crypto.randomUUID()}`, userId, governorId: governor.id, techId, level: 0 })
      .returning()
  }

  if (row.queuedLevel != null) throw new Error('Queue already occupied')
  const targetLevel = row.level + 1
  if (targetLevel > def.maxLevel) throw new Error('Maximum level reached')

  const cost = researchCostAtLevel(def, targetLevel)
  const projected = projectColonyResources(colony)
  if (!canAfford(projected, cost)) throw new Error('Insufficient resources')

  const remaining = subtractCost(projected, cost)
  await db
    .update(colonies)
    .set({ ...remaining, lastTickAt: new Date() })
    .where(eq(colonies.id, colony.id))

  const now = new Date()
  const etaMs = researchTimeAtLevel(def, targetLevel) * 1000
  await db
    .update(research)
    .set({
      queuedLevel: targetLevel,
      queueStartedAt: now,
      queueEtaAt: new Date(now.getTime() + etaMs),
    })
    .where(eq(research.id, row.id))

  revalidatePath('/play/research')
  return { ok: true }
}
