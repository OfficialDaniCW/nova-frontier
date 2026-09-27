'use client'

import { useState } from 'react'
import { Compass } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { FrontierEventDialog } from '@/components/game/frontier-event-dialog'
import { resolveFrontierEvent } from '@/app/actions/frontier-events'
import type { PendingFrontierEvent, ResolvedFrontierEvent } from '@/app/actions/frontier-events'

function timeAgo(date: Date) {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function FrontierEventsSection({
  pendingEvents,
  resolvedEvents,
}: {
  pendingEvents: PendingFrontierEvent[]
  resolvedEvents: ResolvedFrontierEvent[]
}) {
  const [pending, setPending] = useState(pendingEvents)
  const [history, setHistory] = useState(resolvedEvents)

  async function handleResolve(pendingId: string, choiceId: string) {
    const res = await resolveFrontierEvent(pendingId, choiceId)
    const resolvedEvent = pending.find((e) => e.id === pendingId)
    setPending((prev) => prev.filter((e) => e.id !== pendingId))
    if (resolvedEvent) {
      const choice = resolvedEvent.choices.find((c) => c.id === choiceId)
      setHistory((prev) => [
        {
          id: resolvedEvent.id,
          title: resolvedEvent.title,
          choiceLabel: choice?.label ?? 'Unknown',
          outcomeSummary: res.summary,
          resolvedAt: new Date().toISOString(),
        },
        ...prev,
      ])
    }
    return res
  }

  return (
    <div className="flex flex-col gap-3">
      {pending.map((event) => (
        <FrontierEventDialog key={event.id} event={event} onResolve={handleResolve} />
      ))}

      <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-text-faint">
        <Compass className="size-4" /> Frontier Transmissions
      </h2>
      <Panel grid className="p-2 sm:p-3">
        {history.length === 0 ? (
          <p className="p-3 font-mono text-xs text-text-faint">
            No transmissions on record. Frontier events surface periodically as your colony grows.
          </p>
        ) : (
          <ul className="flex flex-col">
            {history.map((ev) => (
              <li
                key={ev.id}
                className="flex flex-col gap-1 border-b border-panel-border/40 px-2 py-2.5 last:border-b-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-xs uppercase tracking-wide text-foreground">
                    {ev.title}
                  </span>
                  <span className="font-mono text-[0.6rem] uppercase tracking-wide text-text-faint">
                    {timeAgo(new Date(ev.resolvedAt))}
                  </span>
                </div>
                <span className="font-mono text-[0.65rem] leading-relaxed text-text-dim">
                  Chose &ldquo;{ev.choiceLabel}&rdquo; — {ev.outcomeSummary}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
