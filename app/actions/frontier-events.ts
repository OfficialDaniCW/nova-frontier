'use server'

import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { colonies, frontierEvents, governors } from '@/lib/db/schema'
import { getUserId } from '@/lib/game/session'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { runTick, logComm } from '@/lib/game/tick'
import { canAfford } from '@/lib/game/resources'
import { getFrontierEventDef } from '@/lib/game/frontier-events'

export type PendingFrontierEvent = {
  id: string
  eventId: string
  title: string
  flavor: string
  iconKey: string
  createdAt: string
  choices: {
    id: string
    label: string
    description: string
    cost: { energy?: number; alloy?: number; crystal?: number }
    affordable: boolean
    riskLabel: string // e.g. "Guaranteed" or "60% favorable"
  }[]
}

export type ResolvedFrontierEvent = {
  id: string
  title: string
  choiceLabel: string
  outcomeSummary: string
  resolvedAt: string
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

export async function getPendingEvents(): Promise<PendingFrontierEvent[]> {
  const userId = await getUserId()
  await ensurePlayerBootstrapped(userId)
  await runTick()

  const [colony] = await db.select().from(colonies).where(eq(colonies.userId, userId)).limit(1)
  if (!colony) return []

  const rows = await db
    .select()
    .from(frontierEvents)
    .where(and(eq(frontierEvents.userId, userId), eq(frontierEvents.status, 'pending')))
    .orderBy(desc(frontierEvents.createdAt))

  return rows.map((row) => {
    const def = getFrontierEventDef(row.eventId)
    return {
      id: row.id,
      eventId: row.eventId,
      title: def.title,
      flavor: def.flavor,
      iconKey: def.id,
      createdAt: row.createdAt.toISOString(),
      choices: def.choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
        description: choice.description,
        cost: choice.cost,
        affordable: canAfford(colony, choice.cost),
        riskLabel: choice.successChance >= 1 ? 'Guaranteed' : `${Math.round(choice.successChance * 100)}% favorable`,
      })),
    }
  })
}

export async function getResolvedEvents(limit = 10): Promise<ResolvedFrontierEvent[]> {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(frontierEvents)
    .where(and(eq(frontierEvents.userId, userId), eq(frontierEvents.status, 'resolved')))
    .orderBy(desc(frontierEvents.resolvedAt))
    .limit(limit)

  return rows.map((row) => {
    const def = getFrontierEventDef(row.eventId)
    const choice = def.choices.find((c) => c.id === row.choiceId)
    return {
      id: row.id,
      title: def.title,
      choiceLabel: choice?.label ?? 'Unknown',
      outcomeSummary: row.outcomeSummary ?? '',
      resolvedAt: (row.resolvedAt ?? row.createdAt).toISOString(),
    }
  })
}

export async function resolveFrontierEvent(pendingId: string, choiceId: string) {
  const userId = await getUserId()
  await runTick()

  const [row] = await db
    .select()
    .from(frontierEvents)
    .where(and(eq(frontierEvents.id, pendingId), eq(frontierEvents.userId, userId), eq(frontierEvents.status, 'pending')))
    .limit(1)
  if (!row) throw new Error('This transmission has already been resolved.')

  const [colony] = await db.select().from(colonies).where(eq(colonies.id, row.colonyId)).limit(1)
  if (!colony) throw new Error('Colony not found.')

  const def = getFrontierEventDef(row.eventId)
  const choice = def.choices.find((c) => c.id === choiceId)
  if (!choice) throw new Error('Unknown choice.')

  if (!canAfford(colony, choice.cost)) {
    throw new Error('Insufficient resources to commit to this choice.')
  }

  const succeeded = Math.random() < choice.successChance
  const effect = succeeded ? choice.onSuccess : choice.onFailure ?? { summary: 'Nothing came of it.' }

  const nextEnergy = Math.max(0, Math.min(colony.energyCap, colony.energy - (choice.cost.energy ?? 0) + (effect.energy ?? 0)))
  const nextAlloy = Math.max(0, Math.min(colony.alloyCap, colony.alloy - (choice.cost.alloy ?? 0) + (effect.alloy ?? 0)))
  const nextCrystal = Math.max(0, Math.min(colony.crystalCap, colony.crystal - (choice.cost.crystal ?? 0) + (effect.crystal ?? 0)))
  const nextPopulation = Math.max(
    0,
    Math.min(colony.populationCap, colony.population + (effect.population ?? 0)),
  )

  await db
    .update(colonies)
    .set({ energy: nextEnergy, alloy: nextAlloy, crystal: nextCrystal, population: nextPopulation })
    .where(eq(colonies.id, colony.id))

  if (effect.score) {
    const [governor] = await db.select().from(governors).where(eq(governors.userId, userId)).limit(1)
    if (governor) {
      await db
        .update(governors)
        .set({ score: Math.max(0, governor.score + effect.score) })
        .where(eq(governors.id, governor.id))
    }
  }

  await db
    .update(frontierEvents)
    .set({
      status: 'resolved',
      choiceId: choice.id,
      outcomeSummary: effect.summary,
      resolvedAt: new Date(),
    })
    .where(eq(frontierEvents.id, row.id))

  await logComm(
    userId,
    'event',
    succeeded ? 'success' : 'warning',
    `${def.title}: ${effect.summary}`,
  )

  return { succeeded, summary: effect.summary }
}
