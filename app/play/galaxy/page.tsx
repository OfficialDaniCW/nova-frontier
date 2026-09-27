import { getGalaxyState } from '@/app/actions/fleet'
import { getGalaxyMap } from '@/app/actions/exploration'
import { getUserId } from '@/lib/game/session'
import { StarChart } from '@/components/game/star-chart'

export default async function GalaxyPage() {
  const userId = await getUserId()
  const [{ sectors, shipRows, activeFleets, compactMateUserIds }, map] = await Promise.all([
    getGalaxyState(),
    getGalaxyMap(),
  ])

  // Resource caches keyed by planet (sector) id, used by planet action panels.
  const resourceCaches = Object.fromEntries(
    sectors.map((s) => [
      s.id,
      { energy: s.energyReward, alloy: s.alloyReward, crystal: s.crystalReward },
    ]),
  )

  const fleetViews = activeFleets
    .filter((f) => f.sectorId != null) // PvP raids (no sector) show in the War Room
    .map((f) => ({
      id: f.id,
      sectorId: f.sectorId as string,
      sectorName: sectors.find((s) => s.id === f.sectorId)?.name ?? 'Deep space',
      mission: f.mission,
      arrivesAt: f.arrivesAt.toISOString(),
      shipCounts: f.shipCounts as Record<string, number>,
    }))

  // Absolute galaxy coordinates for the fleet-blip overlay: origin is the
  // player's home system, destination is the target sector's parent system.
  const homeSystem = map.systems.find((s) => s.id === map.homeSystemId)
  const fleetMapViews = activeFleets
    .filter((f) => f.sectorId != null && homeSystem)
    .map((f) => {
      const sector = sectors.find((s) => s.id === f.sectorId)
      const destSystem = sector?.systemId ? map.systems.find((s) => s.id === sector.systemId) : null
      if (!destSystem || !homeSystem) return null
      return {
        id: f.id,
        mission: f.mission,
        sectorName: sector?.name ?? 'Deep space',
        originX: homeSystem.positionX,
        originY: homeSystem.positionY,
        destX: destSystem.positionX,
        destY: destSystem.positionY,
        departedAt: f.departedAt.toISOString(),
        arrivesAt: f.arrivesAt.toISOString(),
      }
    })
    .filter((f): f is NonNullable<typeof f> => f !== null)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
          Galactic Cartography · Fog-of-War Survey
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-wide text-text">Star Chart</h1>
      </div>

      <StarChart
        systems={map.systems}
        quadrantTotals={map.quadrantTotals}
        homeSystemId={map.homeSystemId}
        sensorRange={map.sensorRange}
        resourceCaches={resourceCaches}
        shipRows={shipRows}
        fleets={fleetViews}
        fleetMapViews={fleetMapViews}
        currentUserId={userId}
        compactMateUserIds={compactMateUserIds}
      />
    </div>
  )
}
