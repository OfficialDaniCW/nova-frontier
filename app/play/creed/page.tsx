import { getCreedState } from '@/app/actions/creed'
import { CreedPanel } from '@/components/game/creed-panel'

export default async function CreedPage() {
  const state = await getCreedState()

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
          Faith · Doctrine · Allegiance
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-wide text-text">Creed</h1>
      </div>

      <CreedPanel state={state} />
    </div>
  )
}
