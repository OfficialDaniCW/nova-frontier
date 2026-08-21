'use client'

import { useState } from 'react'
import { Trophy, Swords, FlaskConical, Flag, Landmark, Users, Shield } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { cn } from '@/lib/utils'
import type { getLeaderboard } from '@/app/actions/comms'
import type { getCompactLeaderboard } from '@/app/actions/compact'

type GovernorRows = Awaited<ReturnType<typeof getLeaderboard>>
type CompactRows = Awaited<ReturnType<typeof getCompactLeaderboard>>

const RANK_STYLES = [
  'text-amber-400 border-amber-400/50',
  'text-slate-300 border-slate-300/40',
  'text-orange-400/90 border-orange-400/40',
]

interface LeaderboardTabsProps {
  governors: GovernorRows
  compacts: CompactRows
  userId: string
  myCompactId: string | null
}

export function LeaderboardTabs({ governors, compacts, userId, myCompactId }: LeaderboardTabsProps) {
  const [tab, setTab] = useState<'governors' | 'compacts'>('governors')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setTab('governors')}
          className={cn(
            'clip-chevron-sm flex items-center gap-1.5 border px-3 py-1.5 font-display text-[0.7rem] uppercase tracking-wide transition-colors',
            tab === 'governors'
              ? 'border-primary/50 bg-primary/10 text-primary'
              : 'border-panel-border text-text-dim hover:text-foreground',
          )}
        >
          <Trophy className="size-3.5" /> Governors
        </button>
        <button
          type="button"
          onClick={() => setTab('compacts')}
          className={cn(
            'clip-chevron-sm flex items-center gap-1.5 border px-3 py-1.5 font-display text-[0.7rem] uppercase tracking-wide transition-colors',
            tab === 'compacts'
              ? 'border-primary/50 bg-primary/10 text-primary'
              : 'border-panel-border text-text-dim hover:text-foreground',
          )}
        >
          <Shield className="size-3.5" /> Compacts
        </button>
      </div>

      {tab === 'governors' ? (
        <Panel grid className="p-2 sm:p-4">
          <ol className="flex flex-col gap-2">
            {governors.map((row, i) => {
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
      ) : compacts.length === 0 ? (
        <Panel grid className="p-5">
          <p className="font-mono text-xs text-text-dim">
            No Compacts have been founded yet. Visit the Compact screen to found one.
          </p>
        </Panel>
      ) : (
        <Panel grid className="p-2 sm:p-4">
          <ol className="flex flex-col gap-2">
            {compacts.map((row, i) => {
              const isMine = row.compact.id === myCompactId
              const rankClass = RANK_STYLES[i] ?? 'text-text-dim border-panel-border'
              return (
                <li
                  key={row.compact.id}
                  className={cn(
                    'flex items-center gap-3 border-l-2 bg-slate-950/40 px-3 py-3',
                    isMine ? 'border-l-primary bg-primary/5' : 'border-l-panel-border',
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
                      {row.compact.name}
                      {isMine && <span className="ml-2 text-[0.65rem] text-primary">(yours)</span>}
                    </span>
                    <div className="flex items-center gap-3 font-mono text-[0.65rem] uppercase tracking-wide text-text-dim">
                      <span className="font-mono text-[0.65rem] text-text-faint">[{row.compact.tag}]</span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3" /> {row.memberCount} members
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-lg font-medium tabular-nums text-foreground">
                    {row.totalScore}
                  </span>
                </li>
              )
            })}
          </ol>
        </Panel>
      )}
    </div>
  )
}
