'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Swords, Handshake, ShieldCheck, Flag, Users, Check, X } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { ChevronButton } from '@/components/game/chevron-button'
import {
  declareWar,
  proposePeace,
  proposePact,
  respondToProposal,
  type getDiplomacy,
  type DiplomacyEntry,
} from '@/app/actions/diplomacy'
import { cn } from '@/lib/utils'

type DiplomacyState = Awaited<ReturnType<typeof getDiplomacy>>

interface DiplomacyPanelProps {
  state: DiplomacyState
}

const STATUS_META: Record<
  DiplomacyEntry['status'],
  { label: string; className: string; Icon: typeof Swords }
> = {
  war: {
    label: 'At War',
    className: 'border-obsidian/50 bg-obsidian/10 text-obsidian',
    Icon: Swords,
  },
  pact: {
    label: 'Pact',
    className: 'border-crystal/50 bg-crystal/10 text-crystal',
    Icon: ShieldCheck,
  },
  neutral: {
    label: 'Neutral',
    className: 'border-panel-border bg-slate-950/50 text-text-faint',
    Icon: Flag,
  },
}

export function DiplomacyPanel({ state }: DiplomacyPanelProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)

  if (!state.inCompact) return null

  const { isLeader, entries } = state

  async function run(action: () => Promise<unknown>, successMsg: string) {
    setBusy(true)
    try {
      await action()
      toast.success(successMsg)
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Diplomacy action failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-text-faint">
        <Swords className="size-4" /> Diplomacy
      </h2>

      {entries.length === 0 ? (
        <Panel grid className="p-5">
          <p className="font-mono text-xs text-text-dim">
            No rival Compacts have been founded yet. Diplomacy unlocks once other alliances exist.
          </p>
        </Panel>
      ) : (
        <Panel grid className="p-2 sm:p-3">
          {!isLeader && (
            <p className="mb-2 px-2 font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
              Read-only — only your Compact leader may conduct diplomacy.
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {entries.map((e) => {
              const meta = STATUS_META[e.status]
              const incomingProposal = e.pendingProposal && !e.proposalFromUs
              const outgoingProposal = e.pendingProposal && e.proposalFromUs
              return (
                <li
                  key={e.compactId}
                  className="flex flex-col gap-3 border-l-2 border-l-panel-border bg-slate-950/40 px-3 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-display text-sm uppercase tracking-wide text-foreground">
                        [{e.tag}] {e.name}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
                        <Users className="size-3" aria-hidden="true" /> {e.memberCount}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-wide clip-chevron-sm',
                        meta.className,
                      )}
                    >
                      <meta.Icon className="size-3.5" aria-hidden="true" />
                      {meta.label}
                    </span>
                  </div>

                  {/* Pending proposal banners */}
                  {outgoingProposal && (
                    <p className="font-mono text-[0.65rem] uppercase tracking-wide text-crystal">
                      {e.pendingProposal === 'peace' ? 'Ceasefire' : 'Pact'} proposed — awaiting their
                      reply.
                    </p>
                  )}

                  {/* Leader actions */}
                  {isLeader && (
                    <div className="flex flex-wrap gap-2">
                      {incomingProposal ? (
                        <>
                          <span className="w-full font-mono text-[0.65rem] uppercase tracking-wide text-crystal">
                            Incoming {e.pendingProposal === 'peace' ? 'ceasefire' : 'pact'} offer
                          </span>
                          <ChevronButton
                            variant="crystal"
                            size="sm"
                            locked={busy}
                            onClick={() =>
                              run(() => respondToProposal(e.compactId, true), 'Proposal accepted')
                            }
                          >
                            <Check className="size-3.5" aria-hidden="true" />
                            Accept
                          </ChevronButton>
                          <ChevronButton
                            variant="obsidian"
                            size="sm"
                            locked={busy}
                            onClick={() =>
                              run(() => respondToProposal(e.compactId, false), 'Proposal declined')
                            }
                          >
                            <X className="size-3.5" aria-hidden="true" />
                            Decline
                          </ChevronButton>
                        </>
                      ) : (
                        <>
                          {e.status !== 'war' && (
                            <ChevronButton
                              variant="obsidian"
                              size="sm"
                              locked={busy}
                              onClick={() =>
                                run(() => declareWar(e.compactId), `War declared on ${e.tag}`)
                              }
                            >
                              <Swords className="size-3.5" aria-hidden="true" />
                              Declare War
                            </ChevronButton>
                          )}
                          {e.status === 'war' && !outgoingProposal && (
                            <ChevronButton
                              variant="concord"
                              size="sm"
                              locked={busy}
                              onClick={() =>
                                run(() => proposePeace(e.compactId), `Ceasefire proposed to ${e.tag}`)
                              }
                            >
                              <Handshake className="size-3.5" aria-hidden="true" />
                              Propose Peace
                            </ChevronButton>
                          )}
                          {e.status === 'neutral' && !outgoingProposal && (
                            <ChevronButton
                              variant="crystal"
                              size="sm"
                              locked={busy}
                              onClick={() =>
                                run(() => proposePact(e.compactId), `Pact proposed to ${e.tag}`)
                              }
                            >
                              <ShieldCheck className="size-3.5" aria-hidden="true" />
                              Propose Pact
                            </ChevronButton>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </Panel>
      )}
    </div>
  )
}
