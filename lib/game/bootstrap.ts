import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { governors, colonies, buildings, ships } from '@/lib/db/schema'
import { BUILDING_DEFS } from '@/lib/game/definitions'

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

const STARTER_BUILDING_LEVELS: Record<string, number> = {
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
}

const STARTER_SHIP_COUNTS: Record<string, number> = {
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

/**
 * Idempotent: ensures the given user has a governor, a home colony, starter
 * buildings, and a starter fleet. Safe to call on every /play load.
 */
export async function ensurePlayerBootstrapped(userId: string) {
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
    .values({ id: governorId, userId, callsign: randomCallsign() })
    .returning()

  const colonyId = newId('col')
  const [colony] = await db
    .insert(colonies)
    .values({
      id: colonyId,
      userId,
      governorId,
      name: 'Kepler-11c',
      planetType: 'temperate',
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
