import { db } from '@/lib/db'
import { starSystems } from '@/lib/db/schema'
import { generateGalaxy } from '@/lib/game/galaxy-gen'

/**
 * Idempotent: procedurally generates the shared galaxy (star systems + planets)
 * the first time it's needed. Keyed on `star_systems` being empty so a fresh
 * deployment builds the map exactly once.
 */
export async function ensureGalaxySeeded() {
  const existing = await db.select({ id: starSystems.id }).from(starSystems).limit(1)
  if (existing.length > 0) return
  await generateGalaxy()
}
