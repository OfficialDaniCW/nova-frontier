'use client'

import { useState } from 'react'
import { Compass, Zap, Gem, Boxes } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChevronButton } from '@/components/game/chevron-button'
import { cn } from '@/lib/utils'
import type { PendingFrontierEvent } from '@/app/actions/frontier-events'

function CostTag({ cost }: { cost: { energy?: number; alloy?: number; crystal?: number } }) {
  const parts: { icon: typeof Zap; value: number; className: string }[] = []
  if (cost.energy) parts.push({ icon: Zap, value: cost.energy, className: 'text-crystal' })
  if (cost.alloy) parts.push({ icon: Boxes, value: cost.alloy, className: 'text-text-dim' })
  if (cost.crystal) parts.push({ icon: Gem, value: cost.crystal, className: 'text-concord' })
  if (parts.length === 0) return <span className="font-mono text-[0.65rem] text-emerald-400">No cost</span>
  return (
    <div className="flex items-center gap-2">
      {parts.map(({ icon: Icon, value, className }, i) => (
        <span key={i} className={cn('flex items-center gap-1 font-mono text-[0.65rem]', className)}>
          <Icon className="size-3" aria-hidden="true" />
          {value}
        </span>
      ))}
    </div>
  )
}

export function FrontierEventDialog({
  event,
  onResolve,
}: {
  event: PendingFrontierEvent
  onResolve: (pendingId: string, choiceId: string) => Promise<{ succeeded: boolean; summary: string }>
}) {
  const [open, setOpen] = useState(true)
  const [submittingChoice, setSubmittingChoice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ succeeded: boolean; summary: string } | null>(null)

  async function handleChoice(choiceId: string) {
    setSubmittingChoice(choiceId)
    setError(null)
    try {
      const res = await onResolve(event.id, choiceId)
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmittingChoice(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={result ? setOpen : undefined}>
      <DialogContent className="border-panel-border bg-slate-950 font-sans" showCloseButton={!!result}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display uppercase tracking-wide text-text">
            <Compass className="size-4 text-crystal" aria-hidden="true" />
            {event.title}
          </DialogTitle>
          <DialogDescription className="text-text-dim">{event.flavor}</DialogDescription>
        </DialogHeader>

        {result ? (
          <div
            className={cn(
              'border-l-2 px-4 py-3 font-mono text-sm leading-relaxed',
              result.succeeded ? 'border-l-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-l-amber-500 bg-amber-500/10 text-amber-300',
            )}
          >
            {result.summary}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {error && <p className="font-mono text-xs text-destructive">{error}</p>}
            {event.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                disabled={!choice.affordable || submittingChoice !== null}
                onClick={() => handleChoice(choice.id)}
                className={cn(
                  'flex flex-col gap-1.5 border-l-2 border-l-panel-border bg-slate-950/40 px-4 py-3 text-left transition-colors',
                  choice.affordable
                    ? 'hover:border-l-crystal hover:bg-slate-900/60'
                    : 'cursor-not-allowed opacity-50',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-sm uppercase tracking-wide text-foreground">
                    {choice.label}
                  </span>
                  <span className="whitespace-nowrap font-mono text-[0.6rem] uppercase tracking-wide text-text-faint">
                    {submittingChoice === choice.id ? 'Committing…' : choice.riskLabel}
                  </span>
                </div>
                <p className="font-mono text-[0.7rem] leading-relaxed text-text-dim">{choice.description}</p>
                <CostTag cost={choice.cost} />
                {!choice.affordable && (
                  <span className="font-mono text-[0.6rem] uppercase tracking-wide text-destructive">
                    Insufficient resources
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {result && (
          <DialogFooter>
            <ChevronButton variant="crystal" onClick={() => setOpen(false)}>
              Acknowledge
            </ChevronButton>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
