'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Users, Crown, Eye, LogOut, Shield } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { ChevronButton } from '@/components/game/chevron-button'
import { InfoTooltip } from '@/components/game/info-tooltip'
import { createCompact, joinCompact, leaveCompact, type getCompactState } from '@/app/actions/compact'
import { cn } from '@/lib/utils'

type CompactState = Awaited<ReturnType<typeof getCompactState>>

interface CompactPanelProps {
  state: CompactState
}

export function CompactPanel({ state }: CompactPanelProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')

  async function run(action: () => Promise<unknown>, successMsg: string) {
    setBusy(true)
    try {
      await action()
      toast.success(successMsg)
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  if (!state.compact) {
    return (
      <div className="flex flex-col gap-6">
        <Panel grid className="flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-text-faint">
              Found a Compact
            </h2>
            <InfoTooltip label="What is a Compact?">
              A Compact is a standing alliance of governors. Members share vision of each other&apos;s
              claimed sectors on the Star Chart, cannot attack or salvage each other&apos;s territory, and
              your combined score ranks on the Compact leaderboard.
            </InfoTooltip>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Compact name (e.g. Concord Vanguard)"
              maxLength={40}
              className="flex-1 border border-panel-border bg-slate-950/60 px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary"
            />
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value.toUpperCase())}
              placeholder="TAG"
              maxLength={5}
              className="w-full border border-panel-border bg-slate-950/60 px-3 py-2 font-mono text-xs uppercase text-foreground outline-none focus:border-primary sm:w-24"
            />
            <ChevronButton
              variant="concord"
              locked={busy || name.trim().length < 3 || tag.trim().length < 2}
              onClick={() => run(() => createCompact(name, tag), 'Compact founded')}
            >
              <Shield className="size-3.5" aria-hidden="true" />
              Found
            </ChevronButton>
          </div>
        </Panel>

        <div>
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-text-faint">
            Join an Existing Compact
          </h2>
          {state.browsable.length === 0 ? (
            <Panel grid className="p-5">
              <p className="font-mono text-xs text-text-dim">
                No Compacts have been founded yet. Be the first governor to found one.
              </p>
            </Panel>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {state.browsable.map(({ compact, memberCount }) => (
                <Panel key={compact.id} grid className="flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-display text-sm font-semibold uppercase tracking-wide text-text">
                        {compact.name}
                      </p>
                      <p className="font-mono text-[0.65rem] text-text-faint">[{compact.tag}]</p>
                    </div>
                    <span className="flex items-center gap-1 font-mono text-xs text-text-dim">
                      <Users className="size-3.5" /> {memberCount}
                    </span>
                  </div>
                  <ChevronButton
                    variant="concord"
                    size="sm"
                    locked={busy}
                    onClick={() => run(() => joinCompact(compact.id), `Joined ${compact.tag}`)}
                  >
                    Join
                  </ChevronButton>
                </Panel>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel grid scanline className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
              [{state.compact.tag}]
            </p>
            <h2 className="font-display text-lg font-semibold text-text">{state.compact.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 border border-primary/40 bg-primary/5 px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-wide text-primary clip-chevron-sm">
              <Eye className="size-3.5" aria-hidden="true" />
              Shared Vision
            </span>
            <ChevronButton
              variant="obsidian"
              size="sm"
              locked={busy}
              onClick={() => run(() => leaveCompact(), 'Left the Compact')}
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              Leave
            </ChevronButton>
          </div>
        </div>

        <p className="font-mono text-xs leading-relaxed text-text-dim">
          Members share vision of each other&apos;s claimed sectors on the Star Chart and cannot attack
          or salvage one another&apos;s territory. Combined member score ranks on the Compact
          leaderboard.
        </p>
      </Panel>

      <div>
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-text-faint">
          <Users className="size-4" /> Roster ({state.members.length})
        </h2>
        <Panel grid className="p-2 sm:p-3">
          <ol className="flex flex-col gap-2">
            {state.members.map((m) => (
              <li
                key={m.userId}
                className="flex items-center gap-3 border-l-2 border-l-panel-border bg-slate-950/40 px-3 py-3"
              >
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 font-display text-sm uppercase tracking-wide text-foreground">
                    {m.isLeader && <Crown className="size-3.5 text-amber-400" aria-hidden="true" />}
                    {m.callsign}
                  </span>
                  <span className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
                    {m.isLeader ? 'Leader' : 'Member'}
                  </span>
                </div>
                <span
                  className={cn(
                    'font-mono text-base font-medium tabular-nums',
                    m.isLeader ? 'text-amber-400' : 'text-foreground',
                  )}
                >
                  {m.score}
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  )
}
