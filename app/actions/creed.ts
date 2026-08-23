'use server'

import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { colonies, governors, doctrines } from '@/lib/db/schema'
import { getUserId } from '@/lib/game/session'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { runTick, recomputeColonyRates } from '@/lib/game/tick'
import { logComm } from '@/lib/game/tick'
import { projectColonyResources } from '@/lib/game/resources'
import {
  getCreed,
  getDoctrine,
  doctrineCostAtLevel,
  creedModifiers,
  PLEDGEABLE_FACTIONS,
  ALLEGIANCE_SIGNATURE,
} from '@/lib/game/creed'
import { revalidatePath } from 'next/cache'

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

export async function getCreedState() {
  const userId = await getUserId()
  await runTick()
  const { governor } = await ensurePlayerBootstrapped(userId)

  const [colony] = await db.select().from(colonies).where(eq(colonies.userId, userId)).limit(1)
  const projected = colony ? projectColonyResources(colony) : null
  const doctrineRows = await db
    .select()
    .from(doctrines)
    .where(eq(doctrines.governorId, governor.id))

  const mods = creedModifiers(
    governor.creedId,
    doctrineRows.map((d) => ({ doctrineId: d.doctrineId, level: d.level })),
    governor.allegiance,
  )

  return {
    governor,
    colony,
    projected,
    doctrineRows,
    modifiers: mods,
  }
}

export async function pledgeAllegiance(faction: string) {
  const userId = await getUserId()
  await runTick()
  const { governor } = await ensurePlayerBootstrapped(userId)

  if (!PLEDGEABLE_FACTIONS.includes(faction as never)) {
    throw new Error('Unknown faction')
  }

  await db
    .update(governors)
    .set({ allegiance: faction, allegianceSetAt: new Date() })
    .where(eq(governors.id, governor.id))

  // Allegiance signature feeds passive rates — recompute.
  const [colony] = await db.select().from(colonies).where(eq(colonies.userId, userId)).limit(1)
  if (colony) await recomputeColonyRates(colony.id)

  const sig = ALLEGIANCE_SIGNATURE[faction]
  await logComm(
    userId,
    'diplomacy',
    'info',
    `Allegiance pledged to ${faction.charAt(0).toUpperCase() + faction.slice(1)}. ${sig ? sig.label + '.' : ''} Zeal now favors strikes against their rival.`,
  )

  revalidatePath('/play/creed')
  return { ok: true }
}

export async function adoptCreed(creedId: string) {
  const userId = await getUserId()
  await runTick()
  const { governor } = await ensurePlayerBootstrapped(userId)

  const creed = getCreed(creedId)
  if (!creed) throw new Error('Unknown creed')

  await db
    .update(governors)
    .set({ creedId, creedSetAt: new Date() })
    .where(eq(governors.id, governor.id))

  const [colony] = await db.select().from(colonies).where(eq(colonies.userId, userId)).limit(1)
  if (colony) await recomputeColonyRates(colony.id)

  await logComm(
    userId,
    'faith',
    'success',
    `The colony has embraced the ${creed.name}. ${creed.signatureLabel} granted.`,
  )

  revalidatePath('/play/creed')
  return { ok: true }
}

export async function unlockDoctrine(doctrineId: string) {
  const userId = await getUserId()
  await runTick()
  const { governor } = await ensurePlayerBootstrapped(userId)

  const found = getDoctrine(doctrineId)
  if (!found) throw new Error('Unknown doctrine')
  const { creed, doctrine } = found

  if (governor.creedId !== creed.id) {
    throw new Error('Doctrine belongs to a different creed')
  }

  const [colony] = await db.select().from(colonies).where(eq(colonies.userId, userId)).limit(1)
  if (!colony) throw new Error('No colony found')

  let [row] = await db
    .select()
    .from(doctrines)
    .where(and(eq(doctrines.governorId, governor.id), eq(doctrines.doctrineId, doctrineId)))
    .limit(1)

  const currentLevel = row?.level ?? 0
  const targetLevel = currentLevel + 1
  if (targetLevel > doctrine.maxLevel) throw new Error('Doctrine already at maximum level')

  const cost = doctrineCostAtLevel(doctrine, targetLevel)
  const projected = projectColonyResources(colony)
  if (projected.devotion < cost) throw new Error('Insufficient Devotion')

  // Spend Devotion (settle first so we don't clobber accrual).
  await db
    .update(colonies)
    .set({ devotion: projected.devotion - cost, lastTickAt: new Date() })
    .where(eq(colonies.id, colony.id))

  if (row) {
    await db
      .update(doctrines)
      .set({ level: targetLevel, updatedAt: new Date() })
      .where(eq(doctrines.id, row.id))
  } else {
    await db.insert(doctrines).values({
      id: newId('doc'),
      userId,
      governorId: governor.id,
      doctrineId,
      level: targetLevel,
    })
  }

  // Apply new doctrine multipliers to production rates.
  await recomputeColonyRates(colony.id)

  await logComm(
    userId,
    'faith',
    'success',
    `Doctrine consecrated: ${doctrine.name} (level ${targetLevel}). ${cost} Devotion spent.`,
  )

  revalidatePath('/play/creed')
  return { ok: true }
}
