// Galaxy constants — shared by generation (server) and map UI (client).
// No db/server imports here so it can be imported anywhere.

import type { Faction } from '@/lib/faction-meta'

export type QuadrantId = 'auric' | 'cinder' | 'verdant' | 'umbral'
export type DiscoveryLevel = 'unknown' | 'detected' | 'surveyed'
export type SiteType = 'trade_hub' | 'derelict' | 'anomaly'

// Galaxy coordinate space is 0..GALAXY_SIZE on both axes, split into 4 quadrants.
export const GALAXY_SIZE = 100
export const GALAXY_CENTER = GALAXY_SIZE / 2

export interface QuadrantDef {
  id: QuadrantId
  name: string
  tagline: string
  coordRange: { x0: number; x1: number; y0: number; y1: number }
  factionBias: Partial<Record<Faction, number>>
  systemCount: number
}

export const QUADRANTS: QuadrantDef[] = [
  {
    id: 'auric',
    name: 'Auric Reach',
    tagline: 'Concord heartland — charted lanes, dense trade.',
    coordRange: { x0: 0, x1: 49, y0: 0, y1: 49 },
    factionBias: { concord: 5, unclaimed: 4, kessler: 2, hollow: 1 },
    systemCount: 16,
  },
  {
    id: 'cinder',
    name: 'Cinder Expanse',
    tagline: 'Obsidian raider corridors and slag worlds.',
    coordRange: { x0: 50, x1: 99, y0: 0, y1: 49 },
    factionBias: { obsidian: 5, unclaimed: 3, kessler: 2, concord: 1 },
    systemCount: 16,
  },
  {
    id: 'verdant',
    name: 'Verdant Hollows',
    tagline: 'The Bloom creeps through overgrown dead stars.',
    coordRange: { x0: 0, x1: 49, y0: 50, y1: 99 },
    factionBias: { bloom: 5, unclaimed: 4, hollow: 2 },
    systemCount: 16,
  },
  {
    id: 'umbral',
    name: 'Umbral Verge',
    tagline: 'Contested dark — Hollow relics and silent ruins.',
    coordRange: { x0: 50, x1: 99, y0: 50, y1: 99 },
    factionBias: { hollow: 5, unclaimed: 4, obsidian: 2, bloom: 1 },
    systemCount: 16,
  },
]

export function getQuadrant(id: string): QuadrantDef | undefined {
  return QUADRANTS.find((q) => q.id === id)
}

export function quadrantForCoords(x: number, y: number): QuadrantId {
  const left = x < GALAXY_CENTER
  const top = y < GALAXY_CENTER
  if (top) return left ? 'auric' : 'cinder'
  return left ? 'verdant' : 'umbral'
}

export interface StarTypeDef {
  id: string
  name: string
  color: string // hex used for the map node glow
  planetCountRange: [number, number]
}

export const STAR_TYPES: StarTypeDef[] = [
  { id: 'yellow', name: 'Yellow Dwarf', color: '#fde047', planetCountRange: [2, 5] },
  { id: 'red_dwarf', name: 'Red Dwarf', color: '#f87171', planetCountRange: [1, 3] },
  { id: 'blue_giant', name: 'Blue Giant', color: '#60a5fa', planetCountRange: [3, 5] },
  { id: 'binary', name: 'Binary Pair', color: '#c4b5fd', planetCountRange: [2, 4] },
  { id: 'neutron', name: 'Neutron Star', color: '#67e8f9', planetCountRange: [1, 2] },
]

export function getStarType(id: string): StarTypeDef {
  return STAR_TYPES.find((s) => s.id === id) ?? STAR_TYPES[0]
}

// Galaxy planet types (distinct from the colony home-world set in planets.ts).
export type GalaxyPlanetType =
  | 'rocky'
  | 'gas_giant'
  | 'ocean'
  | 'volcanic'
  | 'ice'
  | 'desert'
  | 'toxic'
  | 'gaia'

export interface GalaxyPlanetDef {
  id: GalaxyPlanetType
  name: string
  blurb: string
}

export const GALAXY_PLANET_TYPES: GalaxyPlanetDef[] = [
  { id: 'rocky', name: 'Rocky', blurb: 'Cratered silicate world, easy to garrison.' },
  { id: 'gas_giant', name: 'Gas Giant', blurb: 'Vast atmosphere ringed with skimming platforms.' },
  { id: 'ocean', name: 'Ocean', blurb: 'Deep saline seas hiding crystalline shelves.' },
  { id: 'volcanic', name: 'Volcanic', blurb: 'Molten crust, foundries run white-hot.' },
  { id: 'ice', name: 'Ice', blurb: 'Frozen mantle, brittle but resource-locked.' },
  { id: 'desert', name: 'Desert', blurb: 'Endless dunes under a relentless sun.' },
  { id: 'toxic', name: 'Toxic', blurb: 'Corrosive skies — favored by the Bloom.' },
  { id: 'gaia', name: 'Gaia', blurb: 'Rare garden world, prized above all.' },
]

export function getGalaxyPlanetType(id: string): GalaxyPlanetDef {
  return GALAXY_PLANET_TYPES.find((p) => p.id === id) ?? GALAXY_PLANET_TYPES[0]
}

// Planet traits — modifiers are multiplicative rate bonuses applied to the
// owner's home colony when the planet is colonized.
export interface PlanetTraitDef {
  id: string
  name: string
  blurb: string
  modifier: Partial<Record<'energyRate' | 'alloyRate' | 'crystalRate', number>>
}

export const PLANET_TRAITS: PlanetTraitDef[] = [
  { id: 'alloy_veins', name: 'Rich Alloy Veins', blurb: '+8% Alloy output', modifier: { alloyRate: 1.08 } },
  { id: 'crystal_seas', name: 'Crystal Seas', blurb: '+8% Crystal output', modifier: { crystalRate: 1.08 } },
  { id: 'solar_flush', name: 'Solar Flush', blurb: '+8% Energy output', modifier: { energyRate: 1.08 } },
  { id: 'geothermal', name: 'Geothermal Vents', blurb: '+6% Energy, +4% Alloy', modifier: { energyRate: 1.06, alloyRate: 1.04 } },
  { id: 'ancient_ruins', name: 'Ancient Ruins', blurb: 'Xeno relics — survey bonus', modifier: {} },
  { id: 'bloom_tainted', name: 'Bloom-Tainted', blurb: 'Corruption seeps into yields', modifier: { crystalRate: 0.95 } },
  { id: 'barren', name: 'Barren', blurb: 'Little of worth here', modifier: {} },
  { id: 'fertile', name: 'Fertile Biosphere', blurb: '+5% across the board', modifier: { energyRate: 1.05, alloyRate: 1.05, crystalRate: 1.05 } },
]

export function getPlanetTrait(id: string): PlanetTraitDef | undefined {
  return PLANET_TRAITS.find((t) => t.id === id)
}

// Alias used by the tick resolver.
export function getTraitDef(id: string): PlanetTraitDef | undefined {
  return getPlanetTrait(id)
}

/**
 * Combined multiplicative rate bonus a set of owned planets grants the owner's
 * home colony. Returns 1-based multipliers per resource rate.
 */
export function planetTraitBonus(
  planets: { traits: unknown }[],
): { energyRate: number; alloyRate: number; crystalRate: number } {
  const bonus = { energyRate: 1, alloyRate: 1, crystalRate: 1 }
  for (const planet of planets) {
    const traitIds = Array.isArray(planet.traits) ? (planet.traits as string[]) : []
    for (const id of traitIds) {
      const def = getPlanetTrait(id)
      if (!def) continue
      if (def.modifier.energyRate) bonus.energyRate *= def.modifier.energyRate
      if (def.modifier.alloyRate) bonus.alloyRate *= def.modifier.alloyRate
      if (def.modifier.crystalRate) bonus.crystalRate *= def.modifier.crystalRate
    }
  }
  return bonus
}

export interface SiteTypeDef {
  id: SiteType
  name: string
  blurb: string
}

export const SITE_TYPES: SiteTypeDef[] = [
  { id: 'trade_hub', name: 'Trade Hub', blurb: 'Neutral market station — improved exchange rates.' },
  { id: 'derelict', name: 'Derelict Fleet', blurb: 'Abandoned hulls — salvage caches on survey.' },
  { id: 'anomaly', name: 'Spatial Anomaly', blurb: 'Unstable phenomenon — research data on survey.' },
]

export function getSiteType(id: string | null | undefined): SiteTypeDef | undefined {
  if (!id) return undefined
  return SITE_TYPES.find((s) => s.id === id)
}

/**
 * One-off cache awarded for surveying a special site. Trade hubs give nothing
 * on survey (their value is ongoing trade); derelicts drop alloy/energy salvage;
 * anomalies drop crystal/energy research yields. `mult` scales with the player's
 * Xeno-Archaeology research level.
 */
export function rollSurveyReward(
  siteType: string | null | undefined,
  mult = 1,
): { energy?: number; alloy?: number; crystal?: number } | null {
  const rnd = (min: number, max: number) => Math.round((min + Math.random() * (max - min)) * mult)
  switch (siteType) {
    case 'derelict':
      return { alloy: rnd(220, 520), energy: rnd(120, 300) }
    case 'anomaly':
      return { crystal: rnd(160, 380), energy: rnd(120, 260) }
    case 'ruin':
      return { crystal: rnd(120, 300), alloy: rnd(120, 300) }
    default:
      return null
  }
}

// Chebyshev distance on galaxy coords (matches the sector distance model).
export function galaxyDistance(
  a: { positionX: number; positionY: number },
  b: { positionX: number; positionY: number },
) {
  return Math.max(Math.abs(a.positionX - b.positionX), Math.abs(a.positionY - b.positionY))
}
