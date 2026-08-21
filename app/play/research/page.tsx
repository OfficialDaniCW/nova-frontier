import { redirect } from 'next/navigation'
import { getResearchState } from '@/app/actions/research'
import { ResearchGrid } from '@/components/game/research-grid'

export default async function ResearchPage() {
  const { colony, projected, researchRows, buildingRows } = await getResearchState()
  if (!colony || !projected) redirect('/sign-in')

  const serializedResearchRows = researchRows.map((r) => ({
    techId: r.techId,
    level: r.level,
    queuedLevel: r.queuedLevel,
    queueStartedAt: r.queueStartedAt ? r.queueStartedAt.toISOString() : null,
    queueEtaAt: r.queueEtaAt ? r.queueEtaAt.toISOString() : null,
  }))

  const serializedBuildingRows = buildingRows.map((b) => ({
    buildingType: b.buildingType,
    level: b.level,
  }))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
          Research Lab · {colony.name}
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-wide text-text">Technology Tree</h1>
      </div>

      <ResearchGrid
        researchRows={serializedResearchRows}
        buildingRows={serializedBuildingRows}
        resources={projected}
      />
    </div>
  )
}
