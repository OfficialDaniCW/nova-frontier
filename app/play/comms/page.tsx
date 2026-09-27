import { getCommLog, getCommDigest } from '@/app/actions/comms'
import { CommLogList } from '@/components/game/comm-log-list'
import { CommDigestCard } from '@/components/game/comm-digest-card'
import { Radio } from 'lucide-react'

export default async function CommsPage() {
  const [{ entries }, digest] = await Promise.all([getCommLog(), getCommDigest()])
  const serialized = entries.map((entry) => ({
    ...entry,
    createdAt: entry.createdAt.toISOString(),
  }))
  const serializedDigest = {
    ...digest,
    groups: digest.groups.map((g) => ({
      ...g,
      mostSevere: { ...g.mostSevere, createdAt: g.mostSevere.createdAt.toISOString() },
    })),
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Radio className="size-5 text-primary" />
        <h1 className="font-display text-lg uppercase tracking-wide text-foreground">Comm Log</h1>
      </div>

      <CommDigestCard
        groups={serializedDigest.groups}
        totalCount={serializedDigest.totalCount}
        unreadCount={serializedDigest.unreadCount}
        windowHours={serializedDigest.windowHours}
      />

      <CommLogList entries={serialized} />
    </div>
  )
}
