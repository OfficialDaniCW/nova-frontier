import { db } from '@/lib/db'
import { sectors, starSystems } from '@/lib/db/schema'
import type { Faction } from '@/lib/faction-meta'
import {
  QUADRANTS,
  STAR_TYPES,
  GALAXY_PLANET_TYPES,
  PLANET_TRAITS,
  GALAXY_CENTER,
  getStarType,
  type GalaxyPlanetType,
  type SiteType,
} from '@/lib/game/galaxy'

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

// Deterministic RNG so the galaxy is stable across regenerations.
function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const GALAXY_SEED = 0x4e6f7661 // "Nova"

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

function pickWeighted<T extends string>(rng: () => number, weights: Partial<Record<T, number>>): T {
  const entries = Object.entries(weights) as [T, number][]
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let r = rng() * total
  for (const [key, w] of entries) {
    r -= w
    if (r <= 0) return key
  }
  return entries[0][0]
}

function randInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min
}

// Curated names reused as the player's starting cluster flavor.
const CORE_NAMES = [
  'Ashwreck Drift',
  'Cindergate',
  'Static Choir Relay',
  'Hollowmere',
  'Ironline Bastion',
  'Chorus Wellspring',
  'Rimfall Anchorage',
  'Kessler Anchor',
]

const NAME_PREFIX = [
  'Vela',
  'Corvus',
  'Dracon',
  'Myrr',
  'Zeph',
  'Talon',
  'Ossa',
  'Neph',
  'Karn',
  'Sable',
  'Volt',
  'Ryn',
  'Hex',
  'Quill',
  'Umbr',
  'Cael',
]
const NAME_SUFFIX = ['is', 'ex', 'ora', 'un', 'ax', 'eth', 'ova', 'ir', 'us', 'yn', 'ar', 'ol']
const DESIGNATIONS = ['Prime', 'Reach', 'Gate', 'Cluster', 'Deep', 'Hollow', 'Verge', 'Node', 'Span', 'Drift']

function systemName(rng: () => number, coreName: string | null) {
  if (coreName) return `${coreName} System`
  const base = pick(rng, NAME_PREFIX) + pick(rng, NAME_SUFFIX)
  const desig = pick(rng, DESIGNATIONS)
  const num = randInt(rng, 1, 99)
  return rng() < 0.4 ? `${base} ${desig}` : `${base}-${num}`
}

// Planet type weighting by owning faction hint for flavor.
function planetTypeFor(rng: () => number, faction: Faction): GalaxyPlanetType {
  if (faction === 'bloom') return pick(rng, ['toxic', 'ocean', 'gaia', 'ice'] as GalaxyPlanetType[])
  if (faction === 'obsidian') return pick(rng, ['volcanic', 'rocky', 'desert', 'gas_giant'] as GalaxyPlanetType[])
  if (faction === 'hollow') return pick(rng, ['ice', 'rocky', 'gas_giant', 'desert'] as GalaxyPlanetType[])
  return pick(rng, GALAXY_PLANET_TYPES.map((p) => p.id))
}

function traitsFor(rng: () => number, planetType: GalaxyPlanetType, faction: Faction, siteType: SiteType | null): string[] {
  const traits: string[] = []
  if (siteType === 'derelict' && rng() < 0.8) traits.push('ancient_ruins')
  if (siteType === 'anomaly' && rng() < 0.8) traits.push('ancient_ruins')
  if (faction === 'bloom' && rng() < 0.7) traits.push('bloom_tainted')
  if (planetType === 'volcanic' && rng() < 0.6) traits.push('alloy_veins')
  if (planetType === 'ocean' && rng() < 0.6) traits.push('crystal_seas')
  if (planetType === 'desert' && rng() < 0.6) traits.push('solar_flush')
  if (planetType === 'gaia') traits.push('fertile')
  if (traits.length === 0) {
    const roll = rng()
    if (roll < 0.18) traits.push('barren')
    else if (roll < 0.5) traits.push(pick(rng, PLANET_TRAITS.filter((t) => t.id !== 'ancient_ruins' && t.id !== 'bloom_tainted').map((t) => t.id)))
  }
  // De-dupe.
  return Array.from(new Set(traits)).slice(0, 2)
}

/**
 * Generate the full galaxy: ~64 star systems across 4 quadrants, each holding
 * 1-5 planets (rows in `sectors`). Deterministic and idempotent.
 */
export async function generateGalaxy() {
  const rng = mulberry32(GALAXY_SEED)

  const systemRows: (typeof starSystems.$inferInsert)[] = []
  const planetRows: (typeof sectors.$inferInsert)[] = []

  let coreNameIdx = 0

  for (const quadrant of QUADRANTS) {
    const used = new Set<string>()
    const { x0, x1, y0, y1 } = quadrant.coordRange

    for (let i = 0; i < quadrant.systemCount; i++) {
      // Find a non-overlapping coordinate (min spacing enforced by rounding to a grid step).
      let x = 0
      let y = 0
      let attempts = 0
      do {
        x = randInt(rng, x0 + 2, x1 - 2)
        y = randInt(rng, y0 + 2, y1 - 2)
        attempts++
      } while (used.has(`${Math.round(x / 4)}:${Math.round(y / 4)}`) && attempts < 30)
      used.add(`${Math.round(x / 4)}:${Math.round(y / 4)}`)

      const faction = pickWeighted<Faction>(rng, quadrant.factionBias)
      const starType = pick(rng, STAR_TYPES)

      // Site type: a few special systems per quadrant.
      let siteType: SiteType | null = null
      const siteRoll = rng()
      if (siteRoll < 0.1) siteType = 'trade_hub'
      else if (siteRoll < 0.18) siteType = 'derelict'
      else if (siteRoll < 0.24) siteType = 'anomaly'

      // Reuse a curated name for the first system of the Auric quadrant cluster.
      const useCore = quadrant.id === 'auric' && coreNameIdx < CORE_NAMES.length && rng() < 0.6
      const coreName = useCore ? CORE_NAMES[coreNameIdx++] : null

      const systemId = newId('sys')
      systemRows.push({
        id: systemId,
        name: systemName(rng, coreName),
        quadrant: quadrant.id,
        positionX: x,
        positionY: y,
        starType: starType.id,
        siteType,
        factionHint: faction,
      })

      // Distance from galaxy center drives difficulty & reward richness.
      const dist = Math.max(Math.abs(x - GALAXY_CENTER), Math.abs(y - GALAXY_CENTER))
      const outer = Math.min(1, dist / GALAXY_CENTER) // 0 (center) .. 1 (rim)

      const [minP, maxP] = getStarType(starType.id).planetCountRange
      const planetCount = randInt(rng, minP, maxP)

      for (let slot = 0; slot < planetCount; slot++) {
        // Planets closer to their star's faction identity; unclaimed outer worlds are wilder.
        const planetFaction: Faction =
          rng() < 0.55 ? faction : pick(rng, ['unclaimed', 'kessler', faction] as Faction[])
        const planetType = planetTypeFor(rng, planetFaction)
        const traits = traitsFor(rng, planetType, planetFaction, siteType)

        const isBloom = planetFaction === 'bloom'
        const baseGarrison =
          planetFaction === 'unclaimed'
            ? randInt(rng, 0, 12)
            : planetFaction === 'kessler'
              ? randInt(rng, 8, 30)
              : randInt(rng, 25, 70)
        const garrison = Math.round(baseGarrison * (1 + outer * 0.8))

        // Reward richness scales outward; type nudges which resource dominates.
        const richness = 400 + outer * 3200
        const energyReward = Math.round(richness * (planetType === 'desert' ? 1.4 : 0.6) * rng())
        const alloyReward = Math.round(richness * (planetType === 'volcanic' || planetType === 'rocky' ? 1.4 : 0.6) * rng())
        const crystalReward = Math.round(richness * (planetType === 'ocean' || planetType === 'ice' ? 1.4 : 0.5) * rng())

        planetRows.push({
          id: newId('sec'),
          name: `Planet ${String.fromCharCode(65 + slot)}`,
          faction: planetFaction,
          sectorType: 'planet',
          systemId,
          planetType,
          traits,
          slot,
          garrisonStrength: garrison,
          bloomIntensity: isBloom ? randInt(rng, 20, 55) : 0,
          ownerColonyId: null,
          ownerUserId: null,
          energyReward,
          alloyReward,
          crystalReward,
          positionX: x,
          positionY: y,
        })
      }
    }
  }

  // Batch insert (chunked to keep statements reasonable).
  for (let i = 0; i < systemRows.length; i += 50) {
    await db.insert(starSystems).values(systemRows.slice(i, i + 50))
  }
  for (let i = 0; i < planetRows.length; i += 50) {
    await db.insert(sectors).values(planetRows.slice(i, i + 50))
  }

  return { systems: systemRows.length, planets: planetRows.length }
}
