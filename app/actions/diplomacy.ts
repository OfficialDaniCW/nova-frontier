'use server'

import { and, eq, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { compacts, compactMembers, diplomaticRelations } from '@/lib/db/schema'
import { getUserId } from '@/lib/game/session'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { logComm } from '@/lib/game/tick'
import { revalidatePath } from 'next/cache'

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

export type RelationStatus = 'neutral' | 'war' | 'pact'
export type ProposalKind = 'peace' | 'pact'

/** Normalize a compact pair so compactAId <= compactBId for stable storage. */
function pair(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a]
}

async function getUserCompactId(userId: string) {
  const [membership] = await db
    .select()
    .from(compactMembers)
    .where(eq(compactMembers.userId, userId))
    .limit(1)
  return membership?.compactId ?? null
}

async function getRelationRow(aId: string, bId: string) {
  const [x, y] = pair(aId, bId)
  const [row] = await db
    .select()
    .from(diplomaticRelations)
    .where(and(eq(diplomaticRelations.compactAId, x), eq(diplomaticRelations.compactBId, y)))
    .limit(1)
  return row ?? null
}

/** Broadcast a comm-log entry to every member of a compact. */
async function logToCompact(
  compactId: string,
  severity: string,
  message: string,
) {
  const members = await db
    .select()
    .from(compactMembers)
    .where(eq(compactMembers.compactId, compactId))
  await Promise.all(members.map((m) => logComm(m.userId, 'diplomacy', severity, message)))
}

/** Exported helper for future PvP raid gating. */
export async function areCompactsAtWar(aId: string, bId: string) {
  if (aId === bId) return false
  const row = await getRelationRow(aId, bId)
  return row?.status === 'war'
}

export type DiplomacyEntry = {
  compactId: string
  name: string
  tag: string
  memberCount: number
  status: RelationStatus
  pendingProposal: ProposalKind | null
  /** True when the pending proposal was sent BY the caller's compact (awaiting their reply). */
  proposalFromUs: boolean
}

export async function getDiplomacy() {
  const userId = await getUserId()
  await ensurePlayerBootstrapped(userId)

  const myCompactId = await getUserCompactId(userId)
  if (!myCompactId) {
    return { inCompact: false as const, isLeader: false, entries: [] as DiplomacyEntry[] }
  }

  const [myCompact] = await db
    .select()
    .from(compacts)
    .where(eq(compacts.id, myCompactId))
    .limit(1)
  const isLeader = myCompact?.leaderUserId === userId

  const otherCompacts = (await db.select().from(compacts)).filter((c) => c.id !== myCompactId)
  const allMembers = await db.select().from(compactMembers)

  // All relation rows touching my compact.
  const relations = await db
    .select()
    .from(diplomaticRelations)
    .where(
      or(
        eq(diplomaticRelations.compactAId, myCompactId),
        eq(diplomaticRelations.compactBId, myCompactId),
      ),
    )

  const entries: DiplomacyEntry[] = otherCompacts.map((c) => {
    const rel = relations.find(
      (r) =>
        (r.compactAId === myCompactId && r.compactBId === c.id) ||
        (r.compactAId === c.id && r.compactBId === myCompactId),
    )
    return {
      compactId: c.id,
      name: c.name,
      tag: c.tag,
      memberCount: allMembers.filter((m) => m.compactId === c.id).length,
      status: (rel?.status as RelationStatus) ?? 'neutral',
      pendingProposal: (rel?.pendingProposal as ProposalKind | null) ?? null,
      proposalFromUs: rel?.proposedByCompactId === myCompactId,
    }
  })

  // War first, then pending proposals, then by member count.
  entries.sort((a, b) => {
    const rank = (e: DiplomacyEntry) =>
      e.status === 'war' ? 0 : e.pendingProposal ? 1 : e.status === 'pact' ? 2 : 3
    return rank(a) - rank(b) || b.memberCount - a.memberCount
  })

  return { inCompact: true as const, isLeader, myCompact, entries }
}

/** Leader-only guard: returns the caller's led compact or throws. */
async function requireLeaderCompact(userId: string) {
  const compactId = await getUserCompactId(userId)
  if (!compactId) throw new Error('You are not in a Compact')
  const [compact] = await db.select().from(compacts).where(eq(compacts.id, compactId)).limit(1)
  if (!compact) throw new Error('Compact not found')
  if (compact.leaderUserId !== userId) throw new Error('Only the Compact leader may conduct diplomacy')
  return compact
}

async function upsertRelation(
  aId: string,
  bId: string,
  fields: {
    status?: RelationStatus
    pendingProposal?: ProposalKind | null
    proposedByCompactId?: string | null
  },
) {
  const [x, y] = pair(aId, bId)
  const existing = await getRelationRow(x, y)
  if (existing) {
    await db
      .update(diplomaticRelations)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(diplomaticRelations.id, existing.id))
    return
  }
  await db.insert(diplomaticRelations).values({
    id: newId('dip'),
    compactAId: x,
    compactBId: y,
    status: fields.status ?? 'neutral',
    pendingProposal: fields.pendingProposal ?? null,
    proposedByCompactId: fields.proposedByCompactId ?? null,
  })
}

export async function declareWar(targetCompactId: string) {
  const userId = await getUserId()
  const mine = await requireLeaderCompact(userId)
  if (targetCompactId === mine.id) throw new Error('You cannot declare war on your own Compact')

  const [target] = await db
    .select()
    .from(compacts)
    .where(eq(compacts.id, targetCompactId))
    .limit(1)
  if (!target) throw new Error('Target Compact not found')

  // War clears any pending proposal.
  await upsertRelation(mine.id, targetCompactId, {
    status: 'war',
    pendingProposal: null,
    proposedByCompactId: null,
  })

  await logToCompact(mine.id, 'danger', `War declared on the ${target.tag} Compact.`)
  await logToCompact(targetCompactId, 'danger', `The ${mine.tag} Compact has declared WAR on you.`)
  revalidatePath('/play/compact')
  return { ok: true }
}

async function propose(kind: ProposalKind, targetCompactId: string) {
  const userId = await getUserId()
  const mine = await requireLeaderCompact(userId)
  if (targetCompactId === mine.id) throw new Error('Invalid target')

  const [target] = await db
    .select()
    .from(compacts)
    .where(eq(compacts.id, targetCompactId))
    .limit(1)
  if (!target) throw new Error('Target Compact not found')

  const existing = await getRelationRow(mine.id, targetCompactId)
  if (kind === 'peace' && existing?.status !== 'war') {
    throw new Error('You can only propose peace while at war')
  }
  if (kind === 'pact' && existing?.status === 'war') {
    throw new Error('End the war before proposing a pact')
  }
  if (kind === 'pact' && existing?.status === 'pact') {
    throw new Error('You already have a pact with this Compact')
  }

  await upsertRelation(mine.id, targetCompactId, {
    status: (existing?.status as RelationStatus) ?? 'neutral',
    pendingProposal: kind,
    proposedByCompactId: mine.id,
  })

  const label = kind === 'peace' ? 'ceasefire' : 'a mutual pact'
  await logToCompact(mine.id, 'info', `Proposed ${label} to the ${target.tag} Compact.`)
  await logToCompact(
    targetCompactId,
    'info',
    `The ${mine.tag} Compact proposes ${label}. Your leader may respond.`,
  )
  revalidatePath('/play/compact')
  return { ok: true }
}

export async function proposePeace(targetCompactId: string) {
  return propose('peace', targetCompactId)
}

export async function proposePact(targetCompactId: string) {
  return propose('pact', targetCompactId)
}

export async function respondToProposal(targetCompactId: string, accept: boolean) {
  const userId = await getUserId()
  const mine = await requireLeaderCompact(userId)

  const rel = await getRelationRow(mine.id, targetCompactId)
  if (!rel || !rel.pendingProposal) throw new Error('No pending proposal')
  if (rel.proposedByCompactId === mine.id) {
    throw new Error('You proposed this — the other Compact must respond')
  }

  const [target] = await db
    .select()
    .from(compacts)
    .where(eq(compacts.id, targetCompactId))
    .limit(1)
  const kind = rel.pendingProposal as ProposalKind

  if (!accept) {
    // Decline: clear the proposal, keep the underlying status.
    await upsertRelation(mine.id, targetCompactId, {
      status: rel.status as RelationStatus,
      pendingProposal: null,
      proposedByCompactId: null,
    })
    await logToCompact(mine.id, 'info', `Declined the ${target?.tag ?? 'rival'} Compact\u2019s proposal.`)
    await logToCompact(targetCompactId, 'warning', `The ${mine.tag} Compact declined your proposal.`)
    revalidatePath('/play/compact')
    return { ok: true }
  }

  if (kind === 'peace') {
    await upsertRelation(mine.id, targetCompactId, {
      status: 'neutral',
      pendingProposal: null,
      proposedByCompactId: null,
    })
    await logToCompact(mine.id, 'success', `Peace accepted with the ${target?.tag ?? 'rival'} Compact.`)
    await logToCompact(targetCompactId, 'success', `The ${mine.tag} Compact accepted your ceasefire.`)
  } else {
    await upsertRelation(mine.id, targetCompactId, {
      status: 'pact',
      pendingProposal: null,
      proposedByCompactId: null,
    })
    await logToCompact(mine.id, 'success', `Pact formed with the ${target?.tag ?? 'ally'} Compact.`)
    await logToCompact(targetCompactId, 'success', `The ${mine.tag} Compact accepted your pact.`)
  }

  revalidatePath('/play/compact')
  return { ok: true }
}
