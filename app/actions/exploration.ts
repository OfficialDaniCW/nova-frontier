'use server'

import { getUserId } from '@/lib/game/session'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { ensureGalaxySeeded } from '@/lib/game/galaxy-seed'
import { runTick } from '@/lib/game/tick'
import {
  ensurePlayerDiscoveryBootstrapped,
  getVisibleSystems,
  getSystemDetail,
  getSensorRange,
  type VisibleSystem,
  type SystemDetail,
} from '@/lib/game/discovery'

export interface GalaxyMapState {
  systems: VisibleSystem[]
  quadrantTotals: Record<string, number>
  homeSystemId: string | null
  sensorRange: number
}

/** Full discovered-map state for the star chart. */
export async function getGalaxyMap(): Promise<GalaxyMapState> {
  const userId = await getUserId()
  await ensureGalaxySeeded()
  await runTick()
  const { colony } = await ensurePlayerBootstrapped(userId)
  await ensurePlayerDiscoveryBootstrapped(userId)

  const { systems, quadrantTotals } = await getVisibleSystems(userId)
  const range = await getSensorRange(userId)

  return {
    systems,
    quadrantTotals,
    homeSystemId: colony?.homeSystemId ?? null,
    sensorRange: range,
  }
}

/** Detail for a single system (respects fog-of-war). */
export async function getSystem(systemId: string): Promise<SystemDetail | null> {
  const userId = await getUserId()
  await runTick()
  await ensurePlayerDiscoveryBootstrapped(userId)
  return getSystemDetail(userId, systemId)
}
