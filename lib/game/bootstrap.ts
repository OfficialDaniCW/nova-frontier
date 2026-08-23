import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { governors, colonies, buildings, ships } from '@/lib/db/schema'
import { BUILDING_DEFS } from '@/lib/game/definitions'
import { planetModifiers, type PlanetType } from '@/lib/game/planets'

export type { PlanetType } from '@/lib/game/planets'
export { PLANET_TYPES } from '@/lib/game/planets'

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

export const STARTER_BUILDING_LEVELS: Record<string, number> = {
  'command-spire': 1,
  'fusion-reactor': 1,
  'alloy-foundry': 1,
  'crystal-extractor': 1,
  'storage-depot': 1,
  'research-lab': 0,
  'fabrication-bay': 1,
  shipyard: 1,
  'shield-generator': 0,
  'sensor-array': 1,
  sanctum: 1,
  monument: 0,
}

export const STARTER_SHIP_COUNTS: Record<string, number> = {
  'scout-probe': 2,
  interceptor: 3,
}

const CALLSIGN_ADJECTIVES = ['Iron', 'Void', 'Solar', 'Ashen', 'Nova', 'Grim', 'Silent', 'Rift']
const CALLSIGN_NOUNS = ['Warden', 'Drifter', 'Sentinel', 'Wayfinder', 'Marshal', 'Envoy', 'Ranger']

function randomCallsign() {
  const a = CALLSIGN_ADJECTIVES[Math.floor(Math.random() * CALLSIGN_ADJECTIVES.length)]
  const n = CALLSIGN_NOUNS[Math.floor(Math.random() * CALLSIGN_NOUNS.length)]
  return `${a} ${n}`
}

export type FoundingOptions = {
  callsign?: string
  colonyName?: string
  planetType?: PlanetType
}

/**
 * Creates the governor, home colony, starter buildings, and starter fleet
 * for a brand-new user, honoring the founding choices made at sign-up
 * (colony name, callsign, planet type). If the user already has a
 * governor, returns the existing rows untouched — this makes it safe to
 * call once at sign-up time and again idempotently from every /play load.
 */
export async function foundColony(userId: string, options: FoundingOptions = {}) {
  const [existingGovernor] = await db
    .select()
    .from(governors)
    .where(eq(governors.userId, userId))
    .limit(1)

  if (existingGovernor) {
    const [colony] = await db
      .select()
      .from(colonies)
      .where(eq(colonies.userId, userId))
      .limit(1)
    return { governor: existingGovernor, colony }
  }

  const governorId = newId('gov')
  const [governor] = await db
    .insert(governors)
    .values({ id: governorId, userId, callsign: options.callsign?.trim() || randomCallsign() })
    .returning()

  const planetType: PlanetType = options.planetType ?? 'temperate'
  const modifiers = planetModifiers(planetType)

  const colonyId = newId('col')
  const [colony] = await db
    .insert(colonies)
    .values({
      id: colonyId,
      userId,
      governorId,
      name: options.colonyName?.trim() || 'Kepler-11c',
      planetType,
      energyRate: 12 * (modifiers.energyRate ?? 1),
      alloyRate: 8 * (modifiers.alloyRate ?? 1),
      crystalRate: 2 * (modifiers.crystalRate ?? 1),
    })
    .returning()

  for (const def of BUILDING_DEFS) {
    await db.insert(buildings).values({
      id: newId('bld'),
      userId,
      colonyId,
      buildingType: def.id,
      level: STARTER_BUILDING_LEVELS[def.id] ?? 0,
    })
  }

  for (const [shipType, count] of Object.entries(STARTER_SHIP_COUNTS)) {
    await db.insert(ships).values({
      id: newId('shp'),
      userId,
      colonyId,
      shipType,
      count,
    })
  }

  return { governor, colony }
}

/**
 * Idempotent: ensures the given user has a governor, a home colony, starter
 * buildings, and a starter fleet. Safe to call on every /play load. Also
 * self-heals colonies that predate newer buildings (e.g. the Sanctum) by
 * inserting any missing building rows at level 0.
 */
export async function ensurePlayerBootstrapped(userId: string) {
  const result = await foundColony(userId)
  const colony = result.colony
  if (colony) {
    const existing = await db
      .select({ buildingType: buildings.buildingType })
      .from(buildings)
      .where(eq(buildings.colonyId, colony.id))
    const have = new Set(existing.map((b) => b.buildingType))
    for (const def of BUILDING_DEFS) {
      if (!have.has(def.id)) {
        await db.insert(buildings).values({
          id: newId('bld'),
          userId,
          colonyId: colony.id,
          buildingType: def.id,
          level: 0,
        })
      }
    }
  }
  return result
}
