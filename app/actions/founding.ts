'use server'

import { getUserId } from '@/lib/game/session'
import { foundColony, type PlanetType } from '@/lib/game/bootstrap'

const CALLSIGN_ADJECTIVES = ['Iron', 'Void', 'Solar', 'Ashen', 'Nova', 'Grim', 'Silent', 'Rift']
const CALLSIGN_NOUNS = ['Warden', 'Drifter', 'Sentinel', 'Wayfinder', 'Marshal', 'Envoy', 'Ranger']

/** Suggests a random callsign for display in the founding form before signup. */
export async function suggestCallsign() {
  const a = CALLSIGN_ADJECTIVES[Math.floor(Math.random() * CALLSIGN_ADJECTIVES.length)]
  const n = CALLSIGN_NOUNS[Math.floor(Math.random() * CALLSIGN_NOUNS.length)]
  return `${a} ${n}`
}

/**
 * Called immediately after account creation, before the player is routed
 * into /play, so their chosen colony name / callsign / planet type win
 * the (idempotent) founding race against the layout's default bootstrap.
 */
export async function foundNewColony(options: {
  callsign: string
  colonyName: string
  planetType: PlanetType
}) {
  const userId = await getUserId()
  const { governor, colony } = await foundColony(userId, options)
  return { governor, colony }
}
