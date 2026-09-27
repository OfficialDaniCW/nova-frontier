'use client'

import { useEffect, useState } from 'react'
import { Crown, History, Medal } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { cn } from '@/lib/utils'
import type { SeasonState } from '@/app/actions/seasons'

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000))
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function Countdown({ endsAtMs }: { endsAtMs: number }) {
  const [remaining, setRemaining] = useState(() => endsAtMs - Date.now())
  useEffect(() => {
    const t = setInterval(() => setRemaining(endsAtMs - Date.now()), 1000)
    return () => clearInterval(t)
  }, [endsAtMs])
  return <span className="font-mono tabular-nums">{formatCountdown(remaining)}</span>
}

const RANK_ACCENT: Record<number, string> = {
  1: 'text-crystal',
  2: 'text-text-dim',
  3: 'text-obsidian',
}

export function SeasonPanel({ state, userId }: { state: SeasonState; userId: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-text-faint">
            <Crown className="size-4" /> Season {state.season.number}
          </h2>
          <span className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
            Resets in <Countdown endsAtMs={state.endsAtMs} />
          </span>
        </div>

        <Panel grid className="grid grid-cols-2 gap-px overflow-hidden sm:grid-cols-3">
          <div className="flex flex-col gap-1 bg-slate-950/40 p-4">
            <span className="font-mono text-[0.6rem] uppercase tracking-wide text-text-faint">
              Season Score
            </span>
            <span className="font-display text-lg tabular-nums text-crystal">{state.myScore}</span>
          </div>
          <div className="flex flex-col gap-1 bg-slate-950/40 p-4">
            <span className="font-mono text-[0.6rem] uppercase tracking-wide text-text-faint">Rank</span>
            <span className="font-display text-lg tabular-nums text-foreground">
              {state.myRank ? `#${state.myRank}` : '—'}
            </span>
          </div>
          <div className="flex flex-col gap-1 bg-slate-950/40 p-4">
            <span className="font-mono text-[0.6rem] uppercase tracking-wide text-text-faint">Title</span>
            <span className="truncate font-display text-sm text-concord">
              {state.myTitle ?? 'Unranked'}
            </span>
          </div>
        </Panel>
        <p className="mt-2 font-mono text-[0.65rem] leading-relaxed text-text-faint">
          Season score tracks points earned since this season began. Standings reset every 7 days —
          the top governors are awarded a lasting title.
        </p>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-text-faint">
          <Medal className="size-4" /> Season Standings
        </h2>
        <Panel grid className="p-2 sm:p-3">
          {state.standings.length === 0 ? (
            <p className="p-3 font-mono text-xs text-text-faint">No governors ranked yet.</p>
          ) : (
            <ul className="flex flex-col">
              {state.standings.map((s, i) => {
                const rank = i + 1
                return (
                  <li
                    key={s.userId}
                    className={cn(
                      'flex items-center justify-between gap-2 border-b border-panel-border/40 px-2 py-2 last:border-b-0',
                      s.userId === userId && 'bg-crystal/5',
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={cn(
                          'w-5 shrink-0 font-mono text-xs tabular-nums',
                          RANK_ACCENT[rank] ?? 'text-text-faint',
                        )}
                      >
                        #{rank}
                      </span>
                      <span className="font-mono text-xs text-foreground">{s.callsign}</span>
                      {s.title && (
                        <span className="font-mono text-[0.6rem] uppercase tracking-wide text-concord">
                          {s.title}
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-text-dim">
                      {s.seasonScore}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>

      {state.history.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-text-faint">
            <History className="size-4" /> Past Seasons
          </h2>
          <Panel grid className="p-2 sm:p-3">
            <ul className="flex flex-col gap-3">
              {state.history.map(({ season, results }) => (
                <li key={season.id} className="border-l-2 border-l-panel-border px-3 py-1">
                  <span className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
                    Season {season.number}
                  </span>
                  <div className="mt-1 flex flex-wrap gap-4">
                    {results.map((r) => (
                      <span key={r.id} className="font-mono text-xs text-text-dim">
                        #{r.rank} {r.callsign}
                        {r.titleAwarded && (
                          <span className="ml-1 text-concord">({r.titleAwarded})</span>
                        )}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </div>
  )
}
