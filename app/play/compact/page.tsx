import { getCompactState } from '@/app/actions/compact'
import { CompactPanel } from '@/components/game/compact-panel'

export default async function CompactPage() {
  const state = await getCompactState()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
          Diplomacy · Shared Vision · Mutual Defense
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-wide text-text">Compact</h1>
      </div>

      <CompactPanel state={state} />
    </div>
  )
}
