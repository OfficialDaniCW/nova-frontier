import { redirect } from 'next/navigation'
import { getShipyardState } from '@/app/actions/shipyard'
import { FabricationGrid } from '@/components/game/fabrication-grid'

export default async function FabricationPage({
  params,
}: {
  params: Promise<{ colonyId: string }>
}) {
  const { colonyId } = await params
  const { colony, projected, shipRows, buildingRows } = await getShipyardState()

  if (colony.id !== colonyId) redirect(`/play/fabrication/${colony.id}`)

  const serializedShipRows = shipRows.map((row) => ({
    shipType: row.shipType,
    count: row.count,
    queuedCount: row.queuedCount,
    queueStartedAt: row.queueStartedAt ? row.queueStartedAt.toISOString() : null,
    queueEtaAt: row.queueEtaAt ? row.queueEtaAt.toISOString() : null,
  }))

  const serializedBuildingRows = buildingRows.map((b) => ({
    buildingType: b.buildingType,
    level: b.level,
  }))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
          Fabrication Bay · {colony.name}
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-wide text-text">Shipyard</h1>
      </div>

      <FabricationGrid
        shipRows={serializedShipRows}
        buildingRows={serializedBuildingRows}
        resources={projected}
      />
    </div>
  )
}
