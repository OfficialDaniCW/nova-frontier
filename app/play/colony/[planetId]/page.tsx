import { redirect } from 'next/navigation'
import { getColonyState } from '@/app/actions/colony'
import { ColonyBuildingsGrid } from '@/components/game/colony-buildings-grid'

export default async function ColonyPage({
  params,
}: {
  params: Promise<{ planetId: string }>
}) {
  const { planetId } = await params
  const { colony, projected, buildingRows } = await getColonyState()

  if (colony.id !== planetId) redirect(`/play/colony/${colony.id}`)

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
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
            Colony Systems · {planetId}
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-wide text-text">
            {colony.name}
          </h1>
        </div>
      </div>

      <ColonyBuildingsGrid buildingRows={serializedRows} resources={projected} />
    </div>
  )
}
