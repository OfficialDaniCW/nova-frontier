'use client'

import type { LucideIcon } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { formatDuration, useCountdown } from '@/hooks/use-countdown'
import { cn } from '@/lib/utils'

interface QueuePanelProps {
  icon?: LucideIcon
  label: string
  itemName: string
  quantity?: number
  /** Epoch ms when the queued item completes. */
  etaMs: number
  /** Epoch ms when the queue item started (for progress-bar math). */
  startedAtMs: number
  accent?: 'concord' | 'alloy' | 'crystal'
  className?: string
}

const ACCENT_TEXT: Record<string, string> = {
  concord: 'text-concord',
  alloy: 'text-alloy',
  crystal: 'text-crystal',
}

const ACCENT_BG: Record<string, string> = {
  concord: 'bg-concord',
  alloy: 'bg-alloy',
  crystal: 'bg-crystal',
}

/** Active production/construction/research queue readout with a live countdown. */
export function QueuePanel({
  icon: Icon = Loader2,
  label,
  itemName,
  quantity,
  etaMs,
  startedAtMs,
  accent = 'concord',
  className,
}: QueuePanelProps) {
  const remaining = useCountdown(etaMs)
  const total = Math.max(1, etaMs - startedAtMs)
  const elapsed = remaining === null ? 0 : Math.max(0, total - remaining)
  const pct = Math.min(100, (elapsed / total) * 100)

  return (
    <Panel grid scanline className={cn('p-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('size-4 shrink-0 animate-spin', ACCENT_TEXT[accent])} aria-hidden="true" />
          <span className="font-display text-xs uppercase tracking-wide text-text-dim">
            {label}
          </span>
          <span className="font-display text-sm font-semibold text-text">
            {itemName}
            {quantity && quantity > 1 ? ` ×${quantity}` : ''}
          </span>
        </div>
        <span className={cn('font-mono text-sm tabular-nums', ACCENT_TEXT[accent])}>
          {remaining === null ? '--:--' : formatDuration(remaining)}
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden border border-panel-border bg-slate-950/60">
        <div
          className={cn('h-full pulse-glow transition-all duration-1000', ACCENT_BG[accent])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </Panel>
  )
}
