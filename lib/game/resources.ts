import type { colonies } from '@/lib/db/schema'
import type { Cost } from './definitions'

type Colony = typeof colonies.$inferSelect

/**
 * A colony recovering from a natural disaster produces at a reduced rate
 * until `disasterDebuffUntil` passes. Applied at read time (rather than
 * baked into the stored rate columns) so it never goes stale.
 */
export function activeDisasterDebuffPct(colony: Colony, atMs: number = Date.now()): number {
  if (!colony.disasterDebuffUntil) return 0
  if (new Date(colony.disasterDebuffUntil).getTime() <= atMs) return 0
  return colony.disasterDebuffPct
}

/** Compute a colony's current resource totals, projecting production since lastTickAt. */
export function projectColonyResources(colony: Colony, atMs: number = Date.now()) {
  const elapsedSec = Math.max(0, (atMs - new Date(colony.lastTickAt).getTime()) / 1000)
  const debuff = 1 - activeDisasterDebuffPct(colony, atMs)
  const energy = Math.min(colony.energyCap, colony.energy + colony.energyRate * debuff * elapsedSec)
  const alloy = Math.min(colony.alloyCap, colony.alloy + colony.alloyRate * debuff * elapsedSec)
  const crystal = Math.min(colony.crystalCap, colony.crystal + colony.crystalRate * debuff * elapsedSec)
  const devotion = Math.min(colony.devotionCap, colony.devotion + colony.devotionRate * elapsedSec)
  return { energy, alloy, crystal, devotion }
}

export function canAfford(
  available: { energy: number; alloy: number; crystal: number },
  cost: Cost,
): boolean {
  return (
    (cost.energy ?? 0) <= available.energy &&
    (cost.alloy ?? 0) <= available.alloy &&
    (cost.crystal ?? 0) <= available.crystal
  )
}

export function subtractCost(
  available: { energy: number; alloy: number; crystal: number },
  cost: Cost,
) {
  return {
    energy: available.energy - (cost.energy ?? 0),
    alloy: available.alloy - (cost.alloy ?? 0),
    crystal: available.crystal - (cost.crystal ?? 0),
  }
}
