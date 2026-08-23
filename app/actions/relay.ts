'use server'

import { and, desc, eq, or, sql, ilike, ne } from 'drizzle-orm'
import { db } from '@/lib/db'
import { messages, governors, compactMembers, compacts } from '@/lib/db/schema'
import { getUserId } from '@/lib/game/session'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { logComm } from '@/lib/game/tick'
import { revalidatePath } from 'next/cache'

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

const MAX_BODY = 1000

/** The caller's compact id + name, or null if not in a compact. */
async function getMyCompact(userId: string) {
  const [membership] = await db
    .select()
    .from(compactMembers)
    .where(eq(compactMembers.userId, userId))
    .limit(1)
  if (!membership) return null
  const [compact] = await db
    .select()
    .from(compacts)
    .where(eq(compacts.id, membership.compactId))
    .limit(1)
  return compact ?? null
}

export type DirectConversation = {
  partnerUserId: string
  partnerCallsign: string
  lastMessage: string
  lastAt: Date
  unread: number
}

/**
 * Relay overview: grouped direct conversations (with unread counts), the
 * caller's compact channel messages, and compact membership metadata.
 */
export async function getRelayState() {
  const userId = await getUserId()
  await ensurePlayerBootstrapped(userId)

  const [me] = await db.select().from(governors).where(eq(governors.userId, userId)).limit(1)

  // All direct messages the caller is part of, newest first.
  const directRows = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.channel, 'direct'),
        or(eq(messages.senderUserId, userId), eq(messages.recipientUserId, userId)),
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(400)

  // Group into conversations by the "other" party.
  const convoMap = new Map<string, DirectConversation>()
  for (const m of directRows) {
    const isSender = m.senderUserId === userId
    const partnerUserId = isSender ? (m.recipientUserId ?? '') : m.senderUserId
    if (!partnerUserId) continue
    const partnerCallsign = isSender ? '' : m.senderCallsign
    let convo = convoMap.get(partnerUserId)
    if (!convo) {
      convo = {
        partnerUserId,
        partnerCallsign: partnerCallsign || 'Unknown',
        lastMessage: m.body,
        lastAt: m.createdAt,
        unread: 0,
      }
      convoMap.set(partnerUserId, convo)
    }
    // Fill partner callsign from any inbound message if we only had a placeholder.
    if (!isSender && partnerCallsign) convo.partnerCallsign = partnerCallsign
    // Count unread inbound messages.
    if (!isSender && !m.readAt) convo.unread += 1
  }

  // Resolve callsigns for partners we've only ever sent to.
  const missing = [...convoMap.values()].filter((c) => c.partnerCallsign === 'Unknown')
  if (missing.length > 0) {
    const govs = await db.select().from(governors)
    const byUser = new Map(govs.map((g) => [g.userId, g.callsign]))
    for (const c of missing) {
      c.partnerCallsign = byUser.get(c.partnerUserId) ?? 'Unknown Governor'
    }
  }

  const conversations = [...convoMap.values()].sort(
    (a, b) => b.lastAt.getTime() - a.lastAt.getTime(),
  )

  // Compact channel.
  const compact = await getMyCompact(userId)
  let compactMessages: {
    id: string
    senderUserId: string
    senderCallsign: string
    body: string
    createdAt: Date
    isMine: boolean
  }[] = []
  if (compact) {
    const rows = await db
      .select()
      .from(messages)
      .where(and(eq(messages.channel, 'compact'), eq(messages.compactId, compact.id)))
      .orderBy(desc(messages.createdAt))
      .limit(100)
    compactMessages = rows
      .map((m) => ({
        id: m.id,
        senderUserId: m.senderUserId,
        senderCallsign: m.senderCallsign,
        body: m.body,
        createdAt: m.createdAt,
        isMine: m.senderUserId === userId,
      }))
      .reverse()
  }

  return {
    myUserId: userId,
    myCallsign: me?.callsign ?? 'Governor',
    conversations,
    compact: compact ? { id: compact.id, name: compact.name, tag: compact.tag } : null,
    compactMessages,
  }
}

/** Find other governors by callsign for starting a new direct conversation. */
export async function searchGovernors(query: string) {
  const userId = await getUserId()
  const q = query.trim()
  if (q.length < 2) return { results: [] as { userId: string; callsign: string }[] }

  const rows = await db
    .select({ userId: governors.userId, callsign: governors.callsign })
    .from(governors)
    .where(and(ne(governors.userId, userId), ilike(governors.callsign, `%${q}%`)))
    .limit(10)

  return { results: rows }
}

/** Full direct thread with a partner. Marks inbound messages as read. */
export async function getThread(partnerUserId: string) {
  const userId = await getUserId()

  const rows = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.channel, 'direct'),
        or(
          and(eq(messages.senderUserId, userId), eq(messages.recipientUserId, partnerUserId)),
          and(eq(messages.senderUserId, partnerUserId), eq(messages.recipientUserId, userId)),
        ),
      ),
    )
    .orderBy(messages.createdAt)
    .limit(200)

  // Mark inbound as read.
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messages.channel, 'direct'),
        eq(messages.senderUserId, partnerUserId),
        eq(messages.recipientUserId, userId),
        sql`${messages.readAt} is null`,
      ),
    )

  const [partner] = await db
    .select({ callsign: governors.callsign })
    .from(governors)
    .where(eq(governors.userId, partnerUserId))
    .limit(1)

  revalidatePath('/play/relay')
  return {
    partnerUserId,
    partnerCallsign: partner?.callsign ?? 'Unknown Governor',
    messages: rows.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt,
      isMine: m.senderUserId === userId,
    })),
  }
}

export async function sendDirectMessage(recipientUserId: string, body: string) {
  const userId = await getUserId()
  const trimmed = body.trim()
  if (!trimmed) return { ok: false, error: 'Message is empty.' }
  if (trimmed.length > MAX_BODY) return { ok: false, error: 'Message too long.' }
  if (recipientUserId === userId) return { ok: false, error: 'You cannot message yourself.' }

  const [me] = await db.select().from(governors).where(eq(governors.userId, userId)).limit(1)
  const [recipient] = await db
    .select()
    .from(governors)
    .where(eq(governors.userId, recipientUserId))
    .limit(1)
  if (!recipient) return { ok: false, error: 'Recipient not found.' }

  await db.insert(messages).values({
    id: newId('msg'),
    channel: 'direct',
    senderUserId: userId,
    senderCallsign: me?.callsign ?? 'Governor',
    recipientUserId,
    body: trimmed,
  })

  await logComm(
    recipientUserId,
    'relay',
    'info',
    `Incoming transmission from ${me?.callsign ?? 'a governor'}.`,
  )

  revalidatePath('/play/relay')
  return { ok: true }
}

export async function sendCompactMessage(body: string) {
  const userId = await getUserId()
  const trimmed = body.trim()
  if (!trimmed) return { ok: false, error: 'Message is empty.' }
  if (trimmed.length > MAX_BODY) return { ok: false, error: 'Message too long.' }

  const compact = await getMyCompact(userId)
  if (!compact) return { ok: false, error: 'You are not in a Compact.' }

  const [me] = await db.select().from(governors).where(eq(governors.userId, userId)).limit(1)

  await db.insert(messages).values({
    id: newId('msg'),
    channel: 'compact',
    senderUserId: userId,
    senderCallsign: me?.callsign ?? 'Governor',
    compactId: compact.id,
    body: trimmed,
  })

  revalidatePath('/play/relay')
  return { ok: true }
}
