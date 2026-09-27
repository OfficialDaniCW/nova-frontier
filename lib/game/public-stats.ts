import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { governors, combatLogs, fleets } from '@/lib/db/schema'

export interface PublicGameStats {
  governorCount: number
  shipsLost: number
  battlesFought: number
  fleetsDeployed: number
}

const FALLBACK_STATS: PublicGameStats = {
  governorCount: 128,
  shipsLost: 4820,
  battlesFought: 340,
  fleetsDeployed: 512,
}

/**
 * Aggregate counters shown on the public landing page. Reads are best-effort —
 * if the database is briefly unreachable we fall back to seed numbers rather
 * than breaking the marketing page.
 */
export async function getPublicGameStats(): Promise<PublicGameStats> {
  try {
    const [[governorRow], shipsLostResult, [battlesRow], [fleetsRow]] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(governors),
      // shipsLost is a jsonb map of shipType -> count lost in that battle.
      // jsonb_each_text unpacks every key/value pair across all combat logs.
      db.execute<{ total: number }>(sql`
        select coalesce(sum(v.value::int), 0)::int as total
        from ${combatLogs} c, jsonb_each_text(c."shipsLost") as v
      `),
      db.select({ count: sql<number>`count(*)::int` }).from(combatLogs),
      db.select({ count: sql<number>`count(*)::int` }).from(fleets),
    ])

    const shipsLostRow = (shipsLostResult as unknown as { rows: { total: number }[] }).rows[0]

    return {
      governorCount: governorRow?.count ?? FALLBACK_STATS.governorCount,
      shipsLost: Number(shipsLostRow?.total ?? FALLBACK_STATS.shipsLost),
      battlesFought: battlesRow?.count ?? FALLBACK_STATS.battlesFought,
      fleetsDeployed: fleetsRow?.count ?? FALLBACK_STATS.fleetsDeployed,
    }
  } catch (error) {
    console.error('[v0] getPublicGameStats failed, using fallback numbers:', error)
    return FALLBACK_STATS
  }
}
