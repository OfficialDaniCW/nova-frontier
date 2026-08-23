import { getShipDef } from '@/lib/game/definitions'

/**
 * Shared PvP raid combat math. These are pure functions so the raid action
 * (which previews odds) and the tick resolver (which applies outcomes) always
 * agree on the numbers.
 */

/** Base defense every colony has even with an empty hangar. */
export const BASE_COLONY_DEFENSE = 15

/** Shield Generator: each level adds 4% to stationed defense power. */
export const SHIELD_DEFENSE_PER_LEVEL = 0.04

/** Shield Generator: each level mitigates 2% of looted resources, capped at 40%. */
export const SHIELD_MITIGATION_PER_LEVEL = 0.02
export const SHIELD_MITIGATION_CAP = 0.4

/** Fraction of the defender's stored resources a successful raid loots (pre-shield). */
export const RAID_LOOT_FRACTION = 0.25

/** Raid immunity granted to a colony after any resolved raid (ms). */
export const RAID_SHIELD_MS = 30 * 60 * 1000

/** Sum an attack/defense stat over a shipCounts map, skipping unknown ships. */
export function fleetStatTotal(
  shipCounts: Record<string, number>,
  stat: 'attack' | 'defense',
): number {
  let total = 0
  for (const [shipId, count] of Object.entries(shipCounts)) {
    if (!count || count <= 0) continue
    try {
      total += getShipDef(shipId)[stat] * count
    } catch {
      // unknown ship type, skip
    }
  }
  return total
}

/** Total attack power a shipCounts map projects (before creed multipliers). */
export function fleetAttackPower(shipCounts: Record<string, number>): number {
  return fleetStatTotal(shipCounts, 'attack')
}

/**
 * Defensive power of the ships sitting in a colony's hangar, boosted by the
 * colony's Shield Generator level. Ships currently in flight are NOT counted
 * (the caller passes only stationed counts).
 */
export function stationedDefensePower(
  stationedShipCounts: Record<string, number>,
  shieldLevel: number,
): number {
  const raw = BASE_COLONY_DEFENSE + fleetStatTotal(stationedShipCounts, 'defense')
  return raw * (1 + SHIELD_DEFENSE_PER_LEVEL * Math.max(0, shieldLevel))
}

/** Fraction of looted resources withheld by the defender's shield (0..cap). */
export function shieldMitigation(shieldLevel: number): number {
  return Math.min(SHIELD_MITIGATION_CAP, SHIELD_MITIGATION_PER_LEVEL * Math.max(0, shieldLevel))
}

/** Whether a colony's raid shield is currently active. */
export function isRaidShielded(raidShieldUntil: Date | string | null | undefined, nowMs: number): boolean {
  if (!raidShieldUntil) return false
  return new Date(raidShieldUntil).getTime() > nowMs
}

/**
 * Apply proportional ship losses to a shipCounts map given a loss fraction
 * (0..1). Rounds up so a real hit always removes at least one ship, but never
 * removes more than are present. Returns { survivors, lost }.
 */
export function applyLosses(
  shipCounts: Record<string, number>,
  lossFraction: number,
): { survivors: Record<string, number>; lost: Record<string, number> } {
  const frac = Math.max(0, Math.min(1, lossFraction))
  const survivors: Record<string, number> = {}
  const lost: Record<string, number> = {}
  for (const [shipId, count] of Object.entries(shipCounts)) {
    if (!count || count <= 0) continue
    const losses = frac <= 0 ? 0 : Math.min(count, Math.ceil(count * frac))
    if (losses > 0) lost[shipId] = losses
    const remaining = count - losses
    if (remaining > 0) survivors[shipId] = remaining
  }
  return { survivors, lost }
}
