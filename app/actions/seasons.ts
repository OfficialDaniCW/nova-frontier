'use server'

import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { governors } from '@/lib/db/schema'
import { getUserId } from '@/lib/game/session'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { getOrCreateCurrentSeason, getPastSeasons, getSeasonResults, getSeasonScore } from '@/lib/game/seasons'
import { scoreForUser } from '@/app/actions/compact'

export async function getSeasonState() {
  const userId = await getUserId()
  await ensurePlayerBootstrapped(userId)

  const season = await getOrCreateCurrentSeason()
  const allGovernors = await db.select().from(governors)

  const standings = await Promise.all(
    allGovernors.map(async (gov) => {
      const seasonScore = await getSeasonScore(season.id, gov.userId, gov.id)
      return { callsign: gov.callsign, userId: gov.userId, title: gov.title, seasonScore }
    }),
  )
  standings.sort((a, b) => b.seasonScore - a.seasonScore)

  const [myGovernor] = await db.select().from(governors).where(eq(governors.userId, userId)).limit(1)
  const myScore = myGovernor ? await getSeasonScore(season.id, userId, myGovernor.id) : 0
  const myRank = standings.findIndex((s) => s.userId === userId) + 1

  const startedAtMs = season.startedAt.getTime()
  const endsAtMs = startedAtMs + 7 * 24 * 60 * 60 * 1000

  const pastSeasons = await getPastSeasons(5)
  const history = await Promise.all(
    pastSeasons.map(async (past) => ({
      season: past,
      results: (await getSeasonResults(past.id)).slice(0, 3),
    })),
  )

  return {
    season,
    endsAtMs,
    standings: standings.slice(0, 10),
    myRank: myRank || null,
    myScore: Math.round(myScore),
    myTitle: myGovernor?.title ?? null,
    history,
  }
}

export type SeasonState = Awaited<ReturnType<typeof getSeasonState>>
