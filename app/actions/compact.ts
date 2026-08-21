'use server'

import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { compacts, compactMembers, governors, sectors, combatLogs, research, buildings } from '@/lib/db/schema'
import { getUserId } from '@/lib/game/session'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { getBuildingDef } from '@/lib/game/definitions'
import { logComm } from '@/lib/game/tick'
import { revalidatePath } from 'next/cache'

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

/** Returns the compactId the given user belongs to, or null if unaffiliated. */
async function getUserCompactId(userId: string) {
  const [membership] = await db
    .select()
    .from(compactMembers)
    .where(eq(compactMembers.userId, userId))
    .limit(1)
  return membership?.compactId ?? null
}

/**
 * Returns the set of userIds sharing a Compact with the given user (including
 * the user themself), or just [userId] if they are unaffiliated. Used to grant
 * "shared vision" of compact-mate sectors on the Star Chart.
 */
export async function getCompactMateUserIds(userId: string) {
  const compactId = await getUserCompactId(userId)
  if (!compactId) return [userId]
  const members = await db
    .select()
    .from(compactMembers)
    .where(eq(compactMembers.compactId, compactId))
  return members.map((m) => m.userId)
}

export async function scoreForUser(userId: string, governorId: string) {
  const [{ count: winsCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(combatLogs)
    .where(eq(combatLogs.userId, userId))

  const researchRows = await db.select().from(research).where(eq(research.governorId, governorId))
  const researchLevels = researchRows.reduce((sum, r) => sum + r.level, 0)

  const [{ count: sectorsClaimed }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sectors)
    .where(eq(sectors.ownerUserId, userId))

  const [monument] = await db
    .select()
    .from(buildings)
    .where(and(eq(buildings.userId, userId), eq(buildings.buildingType, 'monument')))
    .limit(1)
  const monumentScore = monument ? (getBuildingDef('monument').scorePerLevel ?? 0) * monument.level : 0

  return sectorsClaimed * 100 + winsCount * 25 + researchLevels * 10 + monumentScore
}

export async function getCompactState() {
  const userId = await getUserId()
  await ensurePlayerBootstrapped(userId)

  const compactId = await getUserCompactId(userId)

  if (!compactId) {
    const openCompacts = await db.select().from(compacts)
    const rosterCounts = await db.select().from(compactMembers)
    const browsable = await Promise.all(
      openCompacts.map(async (c) => {
        const memberCount = rosterCounts.filter((m) => m.compactId === c.id).length
        return { compact: c, memberCount }
      }),
    )
    return { compact: null as (typeof compacts.$inferSelect) | null, members: [], isLeader: false, browsable }
  }

  const [compact] = await db.select().from(compacts).where(eq(compacts.id, compactId)).limit(1)
  const memberRows = await db
    .select()
    .from(compactMembers)
    .where(eq(compactMembers.compactId, compactId))

  const memberUserIds = memberRows.map((m) => m.userId)
  const memberGovernors = memberUserIds.length
    ? await db.select().from(governors).where(inArray(governors.userId, memberUserIds))
    : []

  const members = await Promise.all(
    memberRows.map(async (m) => {
      const gov = memberGovernors.find((g) => g.userId === m.userId)
      const score = gov ? await scoreForUser(m.userId, gov.id) : 0
      return {
        userId: m.userId,
        callsign: gov?.callsign ?? 'Unknown Governor',
        joinedAt: m.joinedAt,
        score,
        isLeader: compact?.leaderUserId === m.userId,
      }
    }),
  )
  members.sort((a, b) => b.score - a.score)

  return { compact, members, isLeader: compact?.leaderUserId === userId, browsable: [] }
}

export async function createCompact(name: string, tag: string) {
  const userId = await getUserId()
  await ensurePlayerBootstrapped(userId)

  const trimmedName = name.trim()
  const trimmedTag = tag.trim().toUpperCase()
  if (trimmedName.length < 3 || trimmedName.length > 40) {
    throw new Error('Compact name must be 3-40 characters')
  }
  if (trimmedTag.length < 2 || trimmedTag.length > 5) {
    throw new Error('Compact tag must be 2-5 characters')
  }

  const existing = await getUserCompactId(userId)
  if (existing) throw new Error('You are already in a Compact — leave it first')

  const compactId = newId('cpt')
  await db.insert(compacts).values({ id: compactId, name: trimmedName, tag: trimmedTag, leaderUserId: userId })
  await db.insert(compactMembers).values({ id: newId('cptm'), compactId, userId })

  await logComm(userId, 'system', 'success', `Founded the ${trimmedTag} Compact — "${trimmedName}".`)
  revalidatePath('/play/compact')
  return { ok: true, compactId }
}

export async function joinCompact(compactId: string) {
  const userId = await getUserId()
  await ensurePlayerBootstrapped(userId)

  const existing = await getUserCompactId(userId)
  if (existing) throw new Error('You are already in a Compact — leave it first')

  const [compact] = await db.select().from(compacts).where(eq(compacts.id, compactId)).limit(1)
  if (!compact) throw new Error('Compact not found')

  await db.insert(compactMembers).values({ id: newId('cptm'), compactId, userId })
  await logComm(userId, 'system', 'success', `Joined the ${compact.tag} Compact — "${compact.name}".`)
  revalidatePath('/play/compact')
  return { ok: true }
}

export async function leaveCompact() {
  const userId = await getUserId()
  await ensurePlayerBootstrapped(userId)

  const compactId = await getUserCompactId(userId)
  if (!compactId) throw new Error('You are not in a Compact')

  const [compact] = await db.select().from(compacts).where(eq(compacts.id, compactId)).limit(1)
  await db
    .delete(compactMembers)
    .where(and(eq(compactMembers.compactId, compactId), eq(compactMembers.userId, userId)))

  const remaining = await db
    .select()
    .from(compactMembers)
    .where(eq(compactMembers.compactId, compactId))
    .orderBy(compactMembers.joinedAt)

  if (remaining.length === 0) {
    // Last member out — the Compact dissolves.
    await db.delete(compacts).where(eq(compacts.id, compactId))
  } else if (compact?.leaderUserId === userId) {
    // Leadership passes to whoever joined earliest.
    await db
      .update(compacts)
      .set({ leaderUserId: remaining[0].userId })
      .where(eq(compacts.id, compactId))
    await logComm(
      remaining[0].userId,
      'system',
      'info',
      `You are now the leader of the ${compact?.tag} Compact.`,
    )
  }

  if (compact) {
    await logComm(userId, 'system', 'info', `Left the ${compact.tag} Compact.`)
  }
  revalidatePath('/play/compact')
  return { ok: true }
}

export async function getCompactLeaderboard() {
  const allCompacts = await db.select().from(compacts)
  const allMembers = await db.select().from(compactMembers)
  const allGovernors = await db.select().from(governors)

  const results = await Promise.all(
    allCompacts.map(async (c) => {
      const memberRows = allMembers.filter((m) => m.compactId === c.id)
      const scores = await Promise.all(
        memberRows.map(async (m) => {
          const gov = allGovernors.find((g) => g.userId === m.userId)
          return gov ? scoreForUser(m.userId, gov.id) : 0
        }),
      )
      const totalScore = scores.reduce((a, b) => a + b, 0)
      return { compact: c, memberCount: memberRows.length, totalScore }
    }),
  )

  results.sort((a, b) => b.totalScore - a.totalScore)
  return results
}
