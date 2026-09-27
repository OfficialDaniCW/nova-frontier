import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { commLog, compactMembers, governors, seasonBaselines, seasonResults, seasons } from '@/lib/db/schema'
import { scoreForUser } from '@/app/actions/compact'

// One season lasts 7 days before standings snapshot and a fresh season begins.
const SEASON_LENGTH_MS = 7 * 24 * 60 * 60 * 1000

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

const RANK_TITLES: Record<number, string> = {
  1: 'Sovereign of the Frontier',
  2: 'High Warden',
  3: 'Voidbreaker',
}
const ELITE_TITLE_CUTOFF = 10
const ELITE_TITLE = 'Frontier Elite'

export async function getOrCreateCurrentSeason() {
  const [current] = await db
    .select()
    .from(seasons)
    .where(isNull(seasons.endedAt))
    .orderBy(desc(seasons.number))
    .limit(1)
  if (current) return current

  const [created] = await db
    .insert(seasons)
    .values({ id: newId('season'), number: 1, startedAt: new Date() })
    .returning()
  return created
}

async function ensureBaseline(seasonId: string, userId: string, governorId: string) {
  const [existing] = await db
    .select()
    .from(seasonBaselines)
    .where(and(eq(seasonBaselines.seasonId, seasonId), eq(seasonBaselines.userId, userId)))
    .limit(1)
  if (existing) return existing.baselineScore

  const score = await scoreForUser(userId, governorId)
  await db.insert(seasonBaselines).values({
    id: newId('sbase'),
    seasonId,
    userId,
    governorId,
    baselineScore: Math.round(score),
  })
  return Math.round(score)
}

/** Score earned since the current season started (never negative). */
export async function getSeasonScore(seasonId: string, userId: string, governorId: string) {
  const absolute = await scoreForUser(userId, governorId)
  const baseline = await ensureBaseline(seasonId, userId, governorId)
  return Math.max(0, Math.round(absolute) - baseline)
}

export async function getPastSeasons(limit = 10) {
  return db.select().from(seasons).where(isNotNull(seasons.endedAt)).orderBy(desc(seasons.number)).limit(limit)
}

export async function getSeasonResults(seasonId: string) {
  return db
    .select()
    .from(seasonResults)
    .where(eq(seasonResults.seasonId, seasonId))
    .orderBy(seasonResults.rank)
}

/** Closes the current season if its 7-day window has elapsed, snapshotting standings and starting the next one. */
export async function closeSeasonIfDue() {
  const current = await getOrCreateCurrentSeason()
  const dueAt = current.startedAt.getTime() + SEASON_LENGTH_MS
  if (Date.now() < dueAt) return { closed: false as const }

  const allGovernors = await db.select().from(governors)
  const memberships = await db.select().from(compactMembers)

  const standings = await Promise.all(
    allGovernors.map(async (gov) => {
      const absoluteScore = await scoreForUser(gov.userId, gov.id)
      const seasonScore = await getSeasonScore(current.id, gov.userId, gov.id)
      const membership = memberships.find((m) => m.userId === gov.userId)
      return { gov, absoluteScore: Math.round(absoluteScore), seasonScore, compactId: membership?.compactId ?? null }
    }),
  )

  standings.sort((a, b) => b.seasonScore - a.seasonScore)

  await Promise.all(
    standings.map(async (standing, index) => {
      const rank = index + 1
      const title = RANK_TITLES[rank] ?? (rank <= ELITE_TITLE_CUTOFF ? ELITE_TITLE : null)

      await db.insert(seasonResults).values({
        id: newId('sres'),
        seasonId: current.id,
        userId: standing.gov.userId,
        governorId: standing.gov.id,
        callsign: standing.gov.callsign,
        score: standing.absoluteScore,
        seasonScore: standing.seasonScore,
        rank,
        compactId: standing.compactId,
        titleAwarded: title,
      })

      if (title) {
        await db.update(governors).set({ title }).where(eq(governors.id, standing.gov.id))
      }

      await db.insert(commLog).values({
        id: newId('comm'),
        userId: standing.gov.userId,
        category: 'season',
        severity: rank <= 3 ? 'success' : 'info',
        message: title
          ? `Season ${current.number} has concluded. You placed #${rank} with ${standing.seasonScore} points, earning the title "${title}".`
          : `Season ${current.number} has concluded. You placed #${rank} with ${standing.seasonScore} points.`,
      })
    }),
  )

  await db.update(seasons).set({ endedAt: new Date() }).where(eq(seasons.id, current.id))

  const [nextSeason] = await db
    .insert(seasons)
    .values({ id: newId('season'), number: current.number + 1, startedAt: new Date() })
    .returning()

  // Seed the next season's baselines at each governor's current absolute score, so everyone starts the new season at 0.
  await Promise.all(
    standings.map((standing) =>
      db.insert(seasonBaselines).values({
        id: newId('sbase'),
        seasonId: nextSeason.id,
        userId: standing.gov.userId,
        governorId: standing.gov.id,
        baselineScore: standing.absoluteScore,
      }),
    ),
  )

  return { closed: true as const, endedSeason: current, nextSeason }
}
