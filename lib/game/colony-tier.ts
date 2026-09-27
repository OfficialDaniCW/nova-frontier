export interface ColonyTierInfo {
  tier: number
  name: string
  score: number
  nextTierScore: number | null
  progressPct: number
}

const TIER_NAMES = ['Outpost', 'Settlement', 'Colony', 'City', 'Metropolis'] as const

/**
 * Tier thresholds are expressed in a composite "growth score":
 * population + (total building levels * 5). This rewards both population
 * growth and infrastructure investment without requiring new schema.
 */
const TIER_THRESHOLDS = [0, 150, 400, 900, 1800]

export function colonyTier(
  colony: { population: number },
  buildingRows: { level: number }[],
): ColonyTierInfo {
  const totalBuildingLevels = buildingRows.reduce((sum, b) => sum + b.level, 0)
  const score = colony.population + totalBuildingLevels * 5

  let tierIndex = 0
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (score >= TIER_THRESHOLDS[i]) {
      tierIndex = i
      break
    }
  }

  const nextThreshold = TIER_THRESHOLDS[tierIndex + 1] ?? null
  const currentThreshold = TIER_THRESHOLDS[tierIndex]
  const progressPct =
    nextThreshold === null
      ? 100
      : Math.min(
          100,
          Math.round(((score - currentThreshold) / (nextThreshold - currentThreshold)) * 100),
        )

  return {
    tier: tierIndex + 1,
    name: TIER_NAMES[tierIndex],
    score,
    nextTierScore: nextThreshold,
    progressPct,
  }
}
