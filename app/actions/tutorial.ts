'use server'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { governors } from '@/lib/db/schema'
import { getUserId } from '@/lib/game/session'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { getTutorialProgress } from '@/lib/game/tutorial'
import { revalidatePath } from 'next/cache'

export async function getTutorialState() {
  const userId = await getUserId()
  const { governor, colony } = await ensurePlayerBootstrapped(userId)
  if (!colony) return { dismissed: true, progress: null }

  const progress = await getTutorialProgress(userId, colony.id)
  return { dismissed: governor.tutorialDismissedAt != null, progress }
}

export async function dismissTutorial() {
  const userId = await getUserId()
  const { governor } = await ensurePlayerBootstrapped(userId)
  await db.update(governors).set({ tutorialDismissedAt: new Date() }).where(eq(governors.id, governor.id))
  revalidatePath('/play/colony')
}
