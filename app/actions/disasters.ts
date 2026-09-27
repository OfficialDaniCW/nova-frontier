'use server'

import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { colonies, buildings, research, disasters } from '@/lib/db/schema'
import { getUserId } from '@/lib/game/session'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { runTick } from '@/lib/game/tick'
import {
  DISASTER_DEFS,
  disasterMitigationPct,
  disasterStrikeChance,
  DISASTER_COOLDOWN_MS,
} from '@/lib/game/disasters'

export type HazardAlmanacEntry = {
  id: string
  name: string
  blurb: string
  iconKey: string
  affinityLabel: string
  mitigationPct: number // this colony's current mitigation against this disaster
}

export type HazardEvent = {
  id: string
  colonyId: string
  colonyName: string
  kind: string
  severity: string
  summary: string
  energyLost: number
  alloyLost: number
  crystalLost: number
  populationLost: number
  mitigatedPct: number
  createdAt: string
}

export type HazardsState = {
  bunkerLevel: number
  forecastingLevel: number
  shieldLevel: number
  sensorLevel: number
  strikeChancePct: number
  cooldownRemainingMs: number | null
  almanac: HazardAlmanacEntry[]
  recentEvents: HazardEvent[]
}

const ICON_KEY: Record<string, string> = {
  'solar-flare': 'sun',
  'tectonic-quake': 'mountain',
  'xeno-plague': 'bug',
  'meteor-strike': 'orbit',
}

export async function getHazardsState(): Promise<HazardsState> {
  const userId = await getUserId()
  await ensurePlayerBootstrapped(userId)
  await runTick()

  const [colony] = await db.select().from(colonies).where(eq(colonies.userId, userId)).limit(1)
  if (!colony) {
    return {
      bunkerLevel: 0,
      forecastingLevel: 0,
      shieldLevel: 0,
      sensorLevel: 0,
      strikeChancePct: 0,
      cooldownRemainingMs: null,
      almanac: [],
      recentEvents: [],
    }
  }

  const buildingRows = await db.select().from(buildings).where(eq(buildings.colonyId, colony.id))
  const levelOf = (id: string) => buildingRows.find((b) => b.buildingType === id)?.level ?? 0
  const bunkerLevel = levelOf('contingency-bunker')
  const shieldLevel = levelOf('shield-generator')
  const sensorLevel = levelOf('sensor-array')

  const [forecastingRow] = await db
    .select({ level: research.level })
    .from(research)
    .where(and(eq(research.userId, userId), eq(research.techId, 'disaster-forecasting')))
    .limit(1)
  const forecastingLevel = forecastingRow?.level ?? 0

  const almanac: HazardAlmanacEntry[] = DISASTER_DEFS.map((def) => {
    const affinityLevel = def.affinityBuildingId === 'shield-generator' ? shieldLevel : def.affinityBuildingId === 'sensor-array' ? sensorLevel : 0
    return {
      id: def.id,
      name: def.name,
      blurb: def.blurb,
      iconKey: ICON_KEY[def.id] ?? 'orbit',
      affinityLabel: def.affinityLabel,
      mitigationPct: Math.round(disasterMitigationPct(bunkerLevel, affinityLevel) * 100),
    }
  })

  const eventRows = await db
    .select()
    .from(disasters)
    .where(eq(disasters.userId, userId))
    .orderBy(desc(disasters.createdAt))
    .limit(10)

  const recentEvents: HazardEvent[] = eventRows.map((r) => ({
    id: r.id,
    colonyId: r.colonyId,
    colonyName: colony.name,
    kind: r.kind,
    severity: r.severity,
    summary: r.summary,
    energyLost: r.energyLost,
    alloyLost: r.alloyLost,
    crystalLost: r.crystalLost,
    populationLost: r.populationLost,
    mitigatedPct: Math.round(r.mitigatedPct * 100),
    createdAt: r.createdAt.toISOString(),
  }))

  const cooldownRemainingMs = colony.lastDisasterAt
    ? Math.max(0, DISASTER_COOLDOWN_MS - (Date.now() - colony.lastDisasterAt.getTime()))
    : null

  return {
    bunkerLevel,
    forecastingLevel,
    shieldLevel,
    sensorLevel,
    strikeChancePct: Math.round(disasterStrikeChance(forecastingLevel) * 100),
    cooldownRemainingMs,
    almanac,
    recentEvents,
  }
}
