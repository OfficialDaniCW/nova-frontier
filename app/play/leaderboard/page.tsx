import { getLeaderboard } from '@/app/actions/comms'
import { getCompactLeaderboard, getCompactState } from '@/app/actions/compact'
import { getUserId } from '@/lib/game/session'
import { LeaderboardTabs } from '@/components/game/leaderboard-tabs'
import { Trophy } from 'lucide-react'

export default async function LeaderboardPage() {
  const [governors, compacts, userId, compactState] = await Promise.all([
    getLeaderboard(),
    getCompactLeaderboard(),
    getUserId(),
    getCompactState(),
  ])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Trophy className="size-5 text-primary" />
        <h1 className="font-display text-lg uppercase tracking-wide text-foreground">Leaderboard</h1>
      </div>

      <LeaderboardTabs
        governors={governors}
        compacts={compacts}
        userId={userId}
        myCompactId={compactState.compact?.id ?? null}
      />
    </div>
  )
}
