import { BuildingCard } from '@/components/game/building-card'
import { QueuePanel } from '@/components/game/queue-panel'
import { activeConstruction, buildings, colonyInfo } from '@/lib/game-data'

export default async function ColonyPage({
  params,
}: {
  params: Promise<{ planetId: string }>
}) {
  const { planetId } = await params
  const queueActive = Boolean(activeConstruction)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
            Colony Systems · {planetId}
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-wide text-text">
            {colonyInfo.name}
          </h1>
        </div>
      </div>

      {queueActive && (
        <QueuePanel
          label="Construction queue"
          itemName={`${activeConstruction.buildingName} → LVL ${activeConstruction.targetLevel}`}
          etaMs={activeConstruction.etaMs}
          startedAtMs={activeConstruction.startedAtMs}
          accent="concord"
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {buildings.map((building) => (
          <BuildingCard key={building.id} building={building} queueActive={queueActive} />
        ))}
      </div>
    </div>
  )
}
