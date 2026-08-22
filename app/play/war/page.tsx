import { getRaidState } from '@/app/actions/raid'
import { WarRoom } from '@/components/game/war-room'

export default async function WarPage() {
  const state = await getRaidState()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
          Active Defense · Raiding · Spoils of War
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-wide text-text">War Room</h1>
      </div>

      <WarRoom state={state} />
    </div>
  )
}
