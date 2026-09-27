'use server'

import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { commLog, governors, research, combatLogs, sectors, buildings } from '@/lib/db/schema'
import { getUserId } from '@/lib/game/session'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { runTick } from '@/lib/game/tick'
import { scoreForUser } from '@/app/actions/compact'

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

const DIGEST_WINDOW_HOURS = 12
const SEVERITY_RANK: Record<string, number> = { danger: 3, warning: 2, success: 1, info: 0 }

export async function getCommDigest() {
  const userId = await getUserId()
  await runTick()
  await ensurePlayerBootstrapped(userId)

  const [governor] = await db.select().from(governors).where(eq(governors.userId, userId)).limit(1)
  const since = new Date(Date.now() - DIGEST_WINDOW_HOURS * 60 * 60 * 1000)

  const entries = await db
    .select()
    .from(commLog)
    .where(and(eq(commLog.userId, userId), sql`${commLog.createdAt} >= ${since}`))
    .orderBy(desc(commLog.createdAt))

  const byCategory = new Map<string, { count: number; mostSevere: (typeof entries)[number] }>()
  for (const entry of entries) {
    const existing = byCategory.get(entry.category)
    if (!existing) {
      byCategory.set(entry.category, { count: 1, mostSevere: entry })
      continue
    }
    existing.count += 1
    if (SEVERITY_RANK[entry.severity] > SEVERITY_RANK[existing.mostSevere.severity]) {
      existing.mostSevere = entry
    }
  }

  const groups = Array.from(byCategory.entries())
    .map(([category, data]) => ({ category, count: data.count, mostSevere: data.mostSevere }))
    .sort((a, b) => SEVERITY_RANK[b.mostSevere.severity] - SEVERITY_RANK[a.mostSevere.severity])

  const lastViewed = governor?.lastDigestViewedAt ?? null
  const unreadCount = lastViewed
    ? entries.filter((e) => e.createdAt > lastViewed).length
    : entries.length

  return { groups, totalCount: entries.length, unreadCount, windowHours: DIGEST_WINDOW_HOURS }
}

export async function markDigestViewed() {
  const userId = await getUserId()
  await db.update(governors).set({ lastDigestViewedAt: new Date() }).where(eq(governors.userId, userId))
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

      const [monument] = await db
        .select()
        .from(buildings)
        .where(and(eq(buildings.userId, gov.userId), eq(buildings.buildingType, 'monument')))
        .limit(1)

      const score = await scoreForUser(gov.userId, gov.id)
      return {
        governor: gov,
        sectorsClaimed,
        combatWins: winsCount,
        researchLevels,
        monumentLevel: monument?.level ?? 0,
        score,
      }
    }),
  )

  results.sort((a, b) => b.score - a.score)
  return results
}
