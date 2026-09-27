import type { LucideIcon } from 'lucide-react'
import { Sun, Mountain, Bug, Orbit } from 'lucide-react'

/**
 * Natural disasters are a colony-level survival threat, separate from the
 * galaxy-wide Bloom faction. They strike automatically on a throttled sweep
 * (see resolveDisasters in tick.ts) and are mitigated preventatively by the
 * Contingency Bunker building, Disaster Forecasting research, and — for
 * disasters with a building affinity — Shield Generator / Sensor Array.
 */

export type DisasterKind = 'solar-flare' | 'tectonic-quake' | 'xeno-plague' | 'meteor-strike'

export interface DisasterDamageProfile {
  energyPct?: number // fraction of stored energy lost, before mitigation
  alloyPct?: number
  crystalPct?: number
  populationPct?: number // fraction of current population lost
}

export interface DisasterDef {
  id: DisasterKind
  name: string
  blurb: string
  icon: LucideIcon
  weight: number // relative chance among disasters when one strikes
  damage: DisasterDamageProfile
  /** Building whose level gives bonus mitigation against this specific disaster. */
  affinityBuildingId: 'shield-generator' | 'sensor-array' | null
  affinityLabel: string
}

export const DISASTER_DEFS: DisasterDef[] = [
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    blurb: 'A power-grid overload drains stored Energy reserves across the colony.',
    icon: Sun,
    weight: 3,
    damage: { energyPct: 0.35 },
    affinityBuildingId: 'shield-generator',
    affinityLabel: 'Shield Generator dampens the grid surge',
  },
  {
    id: 'tectonic-quake',
    name: 'Tectonic Quake',
    blurb: 'Structural collapse destroys stored Alloy and injures colonists.',
    icon: Mountain,
    weight: 3,
    damage: { alloyPct: 0.3, populationPct: 0.04 },
    affinityBuildingId: null,
    affinityLabel: 'No structural affinity — bunker mitigation only',
  },
  {
    id: 'xeno-plague',
    name: 'Xeno Plague',
    blurb: 'A biological outbreak sweeps the colony, with minor Crystal spoilage.',
    icon: Bug,
    weight: 2,
    damage: { populationPct: 0.12, crystalPct: 0.08 },
    affinityBuildingId: null,
    affinityLabel: 'No structural affinity — bunker mitigation only',
  },
  {
    id: 'meteor-strike',
    name: 'Meteor Strike',
    blurb: 'Kinetic impact spreads damage across all stored resources and population.',
    icon: Orbit,
    weight: 1,
    damage: { energyPct: 0.18, alloyPct: 0.18, crystalPct: 0.18, populationPct: 0.06 },
    affinityBuildingId: 'sensor-array',
    affinityLabel: 'Sensor Array gives early warning, softening impact',
  },
]

export function getDisasterDef(id: string): DisasterDef {
  const def = DISASTER_DEFS.find((d) => d.id === id)
  if (!def) throw new Error(`Unknown disaster: ${id}`)
  return def
}

/** Weighted random pick among all disaster types. */
export function rollDisasterKind(): DisasterDef {
  const total = DISASTER_DEFS.reduce((sum, d) => sum + d.weight, 0)
  let roll = Math.random() * total
  for (const def of DISASTER_DEFS) {
    roll -= def.weight
    if (roll <= 0) return def
  }
  return DISASTER_DEFS[0]
}

// --- Throttle / cadence constants ----------------------------------------

/** Global sweep runs at most this often. */
export const DISASTER_SWEEP_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

/** Minimum time between disasters striking the same colony. */
export const DISASTER_COOLDOWN_MS = 20 * 60 * 1000 // 20 minutes

/** Base chance a given eligible colony is struck on each sweep pass. */
export const DISASTER_BASE_CHANCE = 0.35

/** Absolute floor on strike chance, however much Forecasting is researched. */
export const DISASTER_MIN_CHANCE = 0.05

/** Per-level reduction in strike chance from Disaster Forecasting research. */
export const FORECASTING_CHANCE_REDUCTION_PER_LEVEL = 0.03

/** Per-level flat damage reduction from the Contingency Bunker. */
export const BUNKER_MITIGATION_PER_LEVEL = 0.03

/** Per-level flat damage reduction from an affinity building (Shield/Sensor). */
export const AFFINITY_MITIGATION_PER_LEVEL = 0.025

/** Hard cap so disasters stay lossy even at max investment. */
export const DISASTER_MAX_MITIGATION = 0.7

/**
 * Total damage mitigation fraction for a disaster, combining bunker
 * (universal) and affinity building (type-specific) levels. Capped so the
 * game never becomes damage-immune.
 */
export function disasterMitigationPct(bunkerLevel: number, affinityLevel: number): number {
  const pct = bunkerLevel * BUNKER_MITIGATION_PER_LEVEL + affinityLevel * AFFINITY_MITIGATION_PER_LEVEL
  return Math.min(DISASTER_MAX_MITIGATION, pct)
}

/** Effective per-sweep strike chance after Disaster Forecasting research. */
export function disasterStrikeChance(forecastingLevel: number): number {
  const chance = DISASTER_BASE_CHANCE - forecastingLevel * FORECASTING_CHANCE_REDUCTION_PER_LEVEL
  return Math.max(DISASTER_MIN_CHANCE, chance)
}

export function severityForMitigatedLoss(totalLossFraction: number): 'minor' | 'moderate' | 'severe' {
  if (totalLossFraction >= 0.22) return 'severe'
  if (totalLossFraction >= 0.1) return 'moderate'
  return 'minor'
}

// --- Recovery arc (post-strike production debuff) ------------------------

/** Base recovery-debuff window before any bunker mitigation. */
export const DISASTER_DEBUFF_BASE_DURATION_MS = 2 * 60 * 60 * 1000 // 2 hours

/** Base fraction shaved off all resource rates while recovering, by severity. */
export const DISASTER_DEBUFF_BASE_PCT: Record<'minor' | 'moderate' | 'severe', number> = {
  minor: 0.1,
  moderate: 0.15,
  severe: 0.2,
}

/**
 * A well-stocked Contingency Bunker shortens and softens the recovery arc —
 * on top of the upfront damage mitigation it already provides. Scales with
 * the same mitigation fraction so a maxed bunker nearly halves the debuff.
 */
export function disasterDebuffForStrike(
  severity: 'minor' | 'moderate' | 'severe',
  mitigationPct: number,
) {
  const softenFactor = 1 - mitigationPct * 0.5
  const pct = DISASTER_DEBUFF_BASE_PCT[severity] * softenFactor
  const durationMs = DISASTER_DEBUFF_BASE_DURATION_MS * softenFactor
  return { pct, durationMs }
}
