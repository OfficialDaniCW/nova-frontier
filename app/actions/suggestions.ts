'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { and, desc, eq, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { featureSuggestions, featureVotes, governors } from '@/lib/db/schema'

const TITLE_MAX = 80
const DESCRIPTION_MAX = 600
const MAX_OPEN_SUGGESTIONS_PER_USER = 10

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session
}

export type SuggestionRow = {
  id: string
  title: string
  description: string
  authorName: string
  status: string
  createdAt: Date
  voteCount: number
  hasVoted: boolean
}

/** Suggestions with vote counts, ordered by votes desc then newest first. Auth required. */
export async function listSuggestions(): Promise<SuggestionRow[]> {
  const session = await requireSession()
  const userId = session.user.id

  const rows = await db
    .select({
      id: featureSuggestions.id,
      title: featureSuggestions.title,
      description: featureSuggestions.description,
      authorName: featureSuggestions.authorName,
      status: featureSuggestions.status,
      createdAt: featureSuggestions.createdAt,
      voteCount: sql<number>`count(${featureVotes.id})`.mapWith(Number),
      hasVoted: sql<boolean>`bool_or(${featureVotes.userId} = ${userId})`.mapWith(Boolean),
    })
    .from(featureSuggestions)
    .leftJoin(featureVotes, eq(featureVotes.suggestionId, featureSuggestions.id))
    .groupBy(
      featureSuggestions.id,
      featureSuggestions.title,
      featureSuggestions.description,
      featureSuggestions.authorName,
      featureSuggestions.status,
      featureSuggestions.createdAt,
    )
    .orderBy(desc(sql`count(${featureVotes.id})`), desc(featureSuggestions.createdAt))

  return rows
}

export async function createSuggestion(input: { title: string; description: string }) {
  const session = await requireSession()
  const userId = session.user.id

  const title = input.title.trim().slice(0, TITLE_MAX)
  const description = input.description.trim().slice(0, DESCRIPTION_MAX)
  if (!title || !description) throw new Error('Title and description are required')

  const [{ count: openCount }] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(featureSuggestions)
    .where(and(eq(featureSuggestions.userId, userId), eq(featureSuggestions.status, 'pending')))
  if (openCount >= MAX_OPEN_SUGGESTIONS_PER_USER) {
    throw new Error('You have reached the limit of pending suggestions. Wait for a review.')
  }

  const [governor] = await db
    .select({ callsign: governors.callsign })
    .from(governors)
    .where(eq(governors.userId, userId))
    .limit(1)

  const suggestionId = `sug_${crypto.randomUUID()}`
  await db.insert(featureSuggestions).values({
    id: suggestionId,
    userId,
    authorName: governor?.callsign ?? session.user.name ?? 'Governor',
    title,
    description,
    status: 'pending',
  })

  // Auto-upvote your own idea.
  await db.insert(featureVotes).values({
    id: `vote_${crypto.randomUUID()}`,
    suggestionId,
    userId,
  })

  revalidatePath('/play/settings')
  revalidatePath('/')
}

export async function toggleVote(suggestionId: string) {
  const session = await requireSession()
  const userId = session.user.id

  const [existing] = await db
    .select({ id: featureVotes.id })
    .from(featureVotes)
    .where(and(eq(featureVotes.suggestionId, suggestionId), eq(featureVotes.userId, userId)))
    .limit(1)

  if (existing) {
    await db.delete(featureVotes).where(eq(featureVotes.id, existing.id))
  } else {
    await db.insert(featureVotes).values({
      id: `vote_${crypto.randomUUID()}`,
      suggestionId,
      userId,
    })
  }

  revalidatePath('/play/settings')
  revalidatePath('/')
}

export type PublicSuggestionRow = {
  id: string
  title: string
  status: string
  voteCount: number
}

/** Public, unauthenticated: top voted, non-declined ideas for the landing page. */
export async function listPublicPendingUpdates(limit = 5): Promise<PublicSuggestionRow[]> {
  const rows = await db
    .select({
      id: featureSuggestions.id,
      title: featureSuggestions.title,
      status: featureSuggestions.status,
      voteCount: sql<number>`count(${featureVotes.id})`.mapWith(Number),
    })
    .from(featureSuggestions)
    .leftJoin(featureVotes, eq(featureVotes.suggestionId, featureSuggestions.id))
    .where(sql`${featureSuggestions.status} <> 'declined'`)
    .groupBy(featureSuggestions.id, featureSuggestions.title, featureSuggestions.status)
    .orderBy(desc(sql`count(${featureVotes.id})`), desc(featureSuggestions.createdAt))
    .limit(limit)

  return rows
}
