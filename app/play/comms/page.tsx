import { getCommLog } from '@/app/actions/comms'
import { CommLogList } from '@/components/game/comm-log-list'
import { Radio } from 'lucide-react'

export default async function CommsPage() {
  const { entries } = await getCommLog()
  const serialized = entries.map((entry) => ({
    ...entry,
    createdAt: entry.createdAt.toISOString(),
  }))

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Radio className="size-5 text-primary" />
        <h1 className="font-display text-lg uppercase tracking-wide text-foreground">Comm Log</h1>
      </div>

      <CommLogList entries={serialized} />
    </div>
  )
}
