import { getLeaderboard } from '@/app/actions/comms'
import { getUserId } from '@/lib/game/session'
import { Panel } from '@/components/game/panel'
import { Trophy, Swords, FlaskConical, Flag, Landmark } from 'lucide-react'
import { cn } from '@/lib/utils'

const RANK_STYLES = [
  'text-amber-400 border-amber-400/50',
  'text-slate-300 border-slate-300/40',
  'text-orange-400/90 border-orange-400/40',
]

export default async function LeaderboardPage() {
  const [results, userId] = await Promise.all([getLeaderboard(), getUserId()])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Trophy className="size-5 text-primary" />
        <h1 className="font-display text-lg uppercase tracking-wide text-foreground">
          Governor Leaderboard
        </h1>
      </div>

      <Panel grid className="p-2 sm:p-4">
        <ol className="flex flex-col gap-2">
          {results.map((row, i) => {
            const isMe = row.governor.userId === userId
            const rankClass = RANK_STYLES[i] ?? 'text-text-dim border-panel-border'
            return (
              <li
                key={row.governor.id}
                className={cn(
                  'flex items-center gap-3 border-l-2 bg-slate-950/40 px-3 py-3',
                  isMe ? 'border-l-primary bg-primary/5' : 'border-l-panel-border',
                )}
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center border font-display text-sm',
                    rankClass,
                  )}
                >
                  {i + 1}
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <span className="font-display text-sm uppercase tracking-wide text-foreground">
                    {row.governor.callsign}
                    {isMe && <span className="ml-2 text-[0.65rem] text-primary">(you)</span>}
                  </span>
                  <div className="flex items-center gap-3 font-mono text-[0.65rem] uppercase tracking-wide text-text-dim">
                    <span className="flex items-center gap-1">
                      <Flag className="size-3" /> {row.sectorsClaimed} claimed
                    </span>
                    <span className="flex items-center gap-1">
                      <Swords className="size-3" /> {row.combatWins} wins
                    </span>
                    <span className="flex items-center gap-1">
                      <FlaskConical className="size-3" /> {row.researchLevels} research
                    </span>
                    {row.monumentLevel > 0 && (
                      <span className="flex items-center gap-1">
                        <Landmark className="size-3" /> Monument L{row.monumentLevel}
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-mono text-lg font-medium tabular-nums text-foreground">
                  {row.score}
                </span>
              </li>
            )
          })}
        </ol>
      </Panel>
    </div>
  )
}
