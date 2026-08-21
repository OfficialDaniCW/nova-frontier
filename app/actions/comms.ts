'use server'

import { desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { commLog, governors, research, combatLogs, sectors } from '@/lib/db/schema'
import { getUserId } from '@/lib/game/session'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { runTick } from '@/lib/game/tick'

export async function getCommLog() {
  const userId = await getUserId()
  await runTick()
  await ensurePlayerBootstrapped(userId)

  const entries = await db
    .select()
    .from(commLog)
    .where(eq(commLog.userId, userId))
    .orderBy(desc(commLog.createdAt))
    .limit(100)

  return { entries }
}

export async function getLeaderboard() {
  await runTick()

  const allGovernors = await db.select().from(governors)

  const results = await Promise.all(
    allGovernors.map(async (gov) => {
      const [{ count: winsCount }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(combatLogs)
        .where(eq(combatLogs.userId, gov.userId))

      const researchRows = await db.select().from(research).where(eq(research.governorId, gov.id))
      const researchLevels = researchRows.reduce((sum, r) => sum + r.level, 0)

      const [{ count: sectorsClaimed }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(sectors)
        .where(eq(sectors.ownerUserId, gov.userId))

      const score = sectorsClaimed * 100 + winsCount * 25 + researchLevels * 10
      return {
        governor: gov,
        sectorsClaimed,
        combatWins: winsCount,
        researchLevels,
        score,
      }
    }),
  )

  results.sort((a, b) => b.score - a.score)
  return results
}
