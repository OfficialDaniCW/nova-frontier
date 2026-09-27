import { getLeaderboard } from '@/app/actions/comms'
import { getCompactLeaderboard, getCompactState } from '@/app/actions/compact'
import { getSeasonState } from '@/app/actions/seasons'
import { getUserId } from '@/lib/game/session'
import { LeaderboardTabs } from '@/components/game/leaderboard-tabs'
import { SeasonPanel } from '@/components/game/season-panel'
import { Trophy } from 'lucide-react'

export default async function LeaderboardPage() {
  const [governors, compacts, userId, compactState, seasonState] = await Promise.all([
    getLeaderboard(),
    getCompactLeaderboard(),
    getUserId(),
    getCompactState(),
    getSeasonState(),
  ])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-2">
        <Trophy className="size-5 text-primary" />
        <h1 className="font-display text-lg uppercase tracking-wide text-foreground">Leaderboard</h1>
      </div>

      <SeasonPanel state={seasonState} userId={userId} />

      <LeaderboardTabs
        governors={governors}
        compacts={compacts}
        userId={userId}
        myCompactId={compactState.compact?.id ?? null}
      />
    </div>
  )
}
