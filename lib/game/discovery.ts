import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  starSystems,
  systemDiscoveries,
  colonies,
  buildings,
  research,
  sectors,
  governors,
} from '@/lib/db/schema'
import { sensorRange } from '@/lib/game/definitions'
import { galaxyDistance, type DiscoveryLevel } from '@/lib/game/galaxy'

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

export type SystemRow = typeof starSystems.$inferSelect

/** Sensor range in galaxy units for a user, from Sensor Array + Deep Space Sensors. */
export async function getSensorRange(userId: string): Promise<number> {
  const [sensorArray] = await db
    .select({ level: buildings.level })
    .from(buildings)
    .where(and(eq(buildings.userId, userId), eq(buildings.buildingType, 'sensor-array')))
    .limit(1)
  const [deepSensors] = await db
    .select({ level: research.level })
    .from(research)
    .where(and(eq(research.userId, userId), eq(research.techId, 'deep-space-sensors')))
    .limit(1)
  return sensorRange(sensorArray?.level ?? 0, deepSensors?.level ?? 0)
}

/**
 * Detects (fog level 'detected') every system within `range` of `origin` that
 * the user hasn't already discovered. Returns the number of newly detected
 * systems. Never downgrades an existing 'surveyed' row.
 */
export async function detectSystemsInRange(
  userId: string,
  origin: { positionX: number; positionY: number },
  range: number,
): Promise<number> {
  const all = await db.select().from(starSystems)
  const existing = await db
    .select({ systemId: systemDiscoveries.systemId })
    .from(systemDiscoveries)
    .where(eq(systemDiscoveries.userId, userId))
  const known = new Set(existing.map((e) => e.systemId))

  const toDetect = all.filter((s) => !known.has(s.id) && galaxyDistance(origin, s) <= range)
  if (toDetect.length === 0) return 0

  await db.insert(systemDiscoveries).values(
    toDetect.map((s) => ({
      id: newId('disc'),
      userId,
      systemId: s.id,
      level: 'detected' as DiscoveryLevel,
    })),
  )
  return toDetect.length
}

/**
 * Ensures the player has a surveyed home system and passive detection around it.
 * Idempotent — safe to call on every galaxy load.
 */
export async function ensurePlayerDiscoveryBootstrapped(userId: string) {
  const [colony] = await db.select().from(colonies).where(eq(colonies.userId, userId)).limit(1)
  if (!colony) return

  let homeSystemId = colony.homeSystemId

  if (!homeSystemId) {
    // Choose a home system: prefer an Auric Reach system not already claimed as
    // another colony's home, biased toward concord/unclaimed hints.
    const taken = await db
      .select({ id: colonies.homeSystemId })
      .from(colonies)
      .where(sql`${colonies.homeSystemId} is not null`)
    const takenSet = new Set(taken.map((t) => t.id).filter(Boolean) as string[])

    const auric = await db.select().from(starSystems).where(eq(starSystems.quadrant, 'auric'))
    const candidates = auric
      .filter((s) => !takenSet.has(s.id))
      .sort((a, b) => {
        const rank = (s: SystemRow) =>
          (s.factionHint === 'concord' ? 0 : s.factionHint === 'unclaimed' ? 1 : 2)
        return rank(a) - rank(b)
      })

    let home = candidates[0]
    if (!home) {
      // Fallback: any unclaimed system anywhere.
      const anySystems = await db.select().from(starSystems)
      home = anySystems.find((s) => !takenSet.has(s.id)) ?? anySystems[0]
    }
    if (!home) return // galaxy not generated yet

    homeSystemId = home.id
    await db.update(colonies).set({ homeSystemId }).where(eq(colonies.id, colony.id))
  }

  // Ensure the home system is surveyed.
  const [homeDisc] = await db
    .select()
    .from(systemDiscoveries)
    .where(and(eq(systemDiscoveries.userId, userId), eq(systemDiscoveries.systemId, homeSystemId)))
    .limit(1)
  if (!homeDisc) {
    await db.insert(systemDiscoveries).values({
      id: newId('disc'),
      userId,
      systemId: homeSystemId,
      level: 'surveyed',
    })
  } else if (homeDisc.level !== 'surveyed') {
    await db
      .update(systemDiscoveries)
      .set({ level: 'surveyed' })
      .where(eq(systemDiscoveries.id, homeDisc.id))
  }

  // Passive detection around the home system.
  const [home] = await db.select().from(starSystems).where(eq(starSystems.id, homeSystemId)).limit(1)
  if (home) {
    const range = await getSensorRange(userId)
    await detectSystemsInRange(userId, home, range)
  }

  return { homeSystemId }
}

export interface VisibleSystem extends SystemRow {
  discovery: DiscoveryLevel
  isHome: boolean
  planetCount: number
  ownedByOthers: number
  ownedByMe: number
}

/** All systems the player has discovered, with per-system summary counts. */
export async function getVisibleSystems(userId: string): Promise<{
  systems: VisibleSystem[]
  quadrantTotals: Record<string, number>
}> {
  const [colony] = await db.select().from(colonies).where(eq(colonies.userId, userId)).limit(1)

  const discoveries = await db
    .select()
    .from(systemDiscoveries)
    .where(eq(systemDiscoveries.userId, userId))
  const levelBySystem = new Map(discoveries.map((d) => [d.systemId, d.level as DiscoveryLevel]))
  const systemIds = discoveries.map((d) => d.systemId)

  const allSystems = await db.select().from(starSystems)
  const quadrantTotals: Record<string, number> = {}
  for (const s of allSystems) quadrantTotals[s.quadrant] = (quadrantTotals[s.quadrant] ?? 0) + 1

  if (systemIds.length === 0) return { systems: [], quadrantTotals }

  const systemRows = allSystems.filter((s) => systemIds.includes(s.id))

  // Planet summary per known system.
  const planets = await db
    .select({
      systemId: sectors.systemId,
      ownerUserId: sectors.ownerUserId,
    })
    .from(sectors)
    .where(inArray(sectors.systemId, systemIds))

  const summary = new Map<string, { count: number; mine: number; others: number }>()
  for (const p of planets) {
    if (!p.systemId) continue
    const s = summary.get(p.systemId) ?? { count: 0, mine: 0, others: 0 }
    s.count++
    if (p.ownerUserId === userId) s.mine++
    else if (p.ownerUserId) s.others++
    summary.set(p.systemId, s)
  }

  const systems: VisibleSystem[] = systemRows.map((s) => {
    const sum = summary.get(s.id) ?? { count: 0, mine: 0, others: 0 }
    return {
      ...s,
      discovery: levelBySystem.get(s.id) ?? 'detected',
      isHome: colony?.homeSystemId === s.id,
      planetCount: sum.count,
      ownedByOthers: sum.others,
      ownedByMe: sum.mine,
    }
  })

  return { systems, quadrantTotals }
}

export interface SystemPlanet {
  id: string
  name: string
  faction: string
  planetType: string
  traits: string[]
  slot: number
  garrisonStrength: number
  bloomIntensity: number
  energyReward: number
  alloyReward: number
  crystalReward: number
  ownerUserId: string | null
  ownerCallsign: string | null
  isMine: boolean
}

export interface SystemDetail {
  system: SystemRow
  discovery: DiscoveryLevel
  isHome: boolean
  planets: SystemPlanet[]
}

/**
 * Full detail for one system. `detected` returns metadata + planet count but
 * hides the planet roster; `surveyed` returns the full planet list with owners.
 */
export async function getSystemDetail(userId: string, systemId: string): Promise<SystemDetail | null> {
  const [system] = await db.select().from(starSystems).where(eq(starSystems.id, systemId)).limit(1)
  if (!system) return null

  const [disc] = await db
    .select()
    .from(systemDiscoveries)
    .where(and(eq(systemDiscoveries.userId, userId), eq(systemDiscoveries.systemId, systemId)))
    .limit(1)
  if (!disc) return null // not discovered — hidden

  const [colony] = await db.select().from(colonies).where(eq(colonies.userId, userId)).limit(1)
  const level = disc.level as DiscoveryLevel

  if (level !== 'surveyed') {
    // Detected only: return a stub so the UI can show "survey to reveal".
    const stubs = await db
      .select({ id: sectors.id })
      .from(sectors)
      .where(eq(sectors.systemId, systemId))
    return {
      system,
      discovery: level,
      isHome: colony?.homeSystemId === systemId,
      planets: stubs.map((_, i) => ({
        id: `hidden-${i}`,
        name: 'Uncharted body',
        faction: 'unknown',
        planetType: 'unknown',
        traits: [],
        slot: i,
        garrisonStrength: 0,
        bloomIntensity: 0,
        energyReward: 0,
        alloyReward: 0,
        crystalReward: 0,
        ownerUserId: null,
        ownerCallsign: null,
        isMine: false,
      })),
    }
  }

  const planetRows = await db
    .select()
    .from(sectors)
    .where(eq(sectors.systemId, systemId))

  // Resolve owner callsigns.
  const ownerIds = Array.from(
    new Set(planetRows.map((p) => p.ownerUserId).filter(Boolean) as string[]),
  )
  const owners =
    ownerIds.length > 0
      ? await db
          .select({ userId: governors.userId, callsign: governors.callsign })
          .from(governors)
          .where(inArray(governors.userId, ownerIds))
      : []
  const callsignByUser = new Map(owners.map((o) => [o.userId, o.callsign]))

  const planets: SystemPlanet[] = planetRows
    .sort((a, b) => a.slot - b.slot)
    .map((p) => ({
      id: p.id,
      name: p.name,
      faction: p.faction,
      planetType: p.planetType,
      traits: (p.traits as string[]) ?? [],
      slot: p.slot,
      garrisonStrength: p.garrisonStrength,
      bloomIntensity: p.bloomIntensity,
      energyReward: p.energyReward,
      alloyReward: p.alloyReward,
      crystalReward: p.crystalReward,
      ownerUserId: p.ownerUserId,
      ownerCallsign: p.ownerUserId ? (callsignByUser.get(p.ownerUserId) ?? null) : null,
      isMine: p.ownerUserId === userId,
    }))

  return {
    system,
    discovery: level,
    isHome: colony?.homeSystemId === systemId,
    planets,
  }
}
