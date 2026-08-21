import { getGalaxyState } from '@/app/actions/fleet'
import { getUserId } from '@/lib/game/session'
import { GalaxyView } from '@/components/game/galaxy-view'
import type { Faction } from '@/lib/faction-meta'

export default async function GalaxyPage() {
  const userId = await getUserId()
  const { sectors, shipRows, activeFleets, compactMateUserIds } = await getGalaxyState()

  const sectorViews = sectors.map((s) => ({
    id: s.id,
    name: s.name,
    faction: s.faction as Faction,
    garrisonStrength: s.garrisonStrength,
    positionX: s.positionX,
    positionY: s.positionY,
    ownerUserId: s.ownerUserId,
    isMine: s.ownerUserId === userId,
    isCompactMate: !!s.ownerUserId && s.ownerUserId !== userId && compactMateUserIds.includes(s.ownerUserId),
  }))

  const resourceCaches = Object.fromEntries(
    sectors.map((s) => [
      s.id,
      { energy: s.energyReward, alloy: s.alloyReward, crystal: s.crystalReward },
    ]),
  )

  const fleetViews = activeFleets.map((f) => ({
    id: f.id,
    sectorId: f.sectorId,
    sectorName: sectors.find((s) => s.id === f.sectorId)?.name ?? 'Unknown sector',
    mission: f.mission,
    arrivesAt: f.arrivesAt.toISOString(),
    shipCounts: f.shipCounts as Record<string, number>,
  }))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
          Halcyon Verge · Sector Survey
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-wide text-text">Star Chart</h1>
      </div>

      <GalaxyView
        sectors={sectorViews}
        resourceCaches={resourceCaches}
        shipRows={shipRows}
        fleets={fleetViews}
      />
    </div>
  )
}
