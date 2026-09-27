import { redirect } from 'next/navigation'
import { getColonyState } from '@/app/actions/colony'
import { getTutorialState } from '@/app/actions/tutorial'
import { getHazardsState } from '@/app/actions/disasters'
import { getPendingEvents, getResolvedEvents } from '@/app/actions/frontier-events'
import { ColonyBuildingsGrid } from '@/components/game/colony-buildings-grid'
import { TutorialChecklist } from '@/components/game/tutorial-checklist'
import { ResourcePriorityDial } from '@/components/game/resource-priority-dial'
import { HazardsPanel } from '@/components/game/hazards-panel'
import { FrontierEventsSection } from '@/components/game/frontier-events-section'
import { ColonyTierBadge } from '@/components/game/colony-tier-badge'
import { colonyTier } from '@/lib/game/colony-tier'
import type { ResourcePriority } from '@/lib/game/definitions'

export default async function ColonyPage({
  params,
}: {
  params: Promise<{ planetId: string }>
}) {
  const { planetId } = await params
  const { colony, projected, buildingRows } = await getColonyState()
  const { dismissed, progress } = await getTutorialState()
  const hazards = await getHazardsState()
  const pendingEvents = await getPendingEvents()
  const resolvedEvents = await getResolvedEvents()

  if (colony.id !== planetId) redirect(`/play/colony/${colony.id}`)

  const tierInfo = colonyTier(colony, buildingRows)

  const serializedRows = buildingRows.map((row) => ({
    id: row.id,
    buildingType: row.buildingType,
    level: row.level,
    queuedLevel: row.queuedLevel,
    queueStartedAt: row.queueStartedAt ? row.queueStartedAt.toISOString() : null,
    queueEtaAt: row.queueEtaAt ? row.queueEtaAt.toISOString() : null,
  }))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
            Colony Systems · {planetId}
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-wide text-text">
            {colony.name}
          </h1>
        </div>
        <ColonyTierBadge info={tierInfo} />
      </div>

      {!dismissed && progress && <TutorialChecklist progress={progress} />}

      <ResourcePriorityDial current={(colony.resourcePriority as ResourcePriority) ?? 'balanced'} />

      <ColonyBuildingsGrid buildingRows={serializedRows} resources={projected} />

      <div>
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-text-faint">
          Hazards
        </h2>
        <HazardsPanel state={hazards} />
      </div>

      <FrontierEventsSection pendingEvents={pendingEvents} resolvedEvents={resolvedEvents} />
    </div>
  )
}
