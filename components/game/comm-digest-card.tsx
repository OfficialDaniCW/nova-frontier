'use client'

import { useEffect } from 'react'
import { Hammer, FlaskConical, Rocket, Swords, Coins, Radio, MessageSquare, Handshake, AlertTriangle, Compass } from 'lucide-react'
import { cn } from '@/lib/utils'
import { markDigestViewed } from '@/app/actions/comms'

const CATEGORY_ICON: Record<string, typeof Hammer> = {
  construction: Hammer,
  research: FlaskConical,
  fleet: Rocket,
  combat: Swords,
  trade: Coins,
  system: Radio,
  relay: MessageSquare,
  diplomacy: Handshake,
  disaster: AlertTriangle,
  event: Compass,
}

const SEVERITY_STYLE: Record<string, string> = {
  danger: 'border-l-destructive text-destructive',
  warning: 'border-l-amber-500 text-amber-400',
  success: 'border-l-emerald-500 text-emerald-400',
  info: 'border-l-panel-border text-text-dim',
}

type DigestGroup = {
  category: string
  count: number
  mostSevere: { message: string; severity: string; createdAt: string | Date }
}

export function CommDigestCard({
  groups,
  totalCount,
  unreadCount,
  windowHours,
}: {
  groups: DigestGroup[]
  totalCount: number
  unreadCount: number
  windowHours: number
}) {
  useEffect(() => {
    markDigestViewed()
  }, [])

  if (totalCount === 0) {
    return (
      <div className="border-l-2 border-l-panel-border bg-slate-950/40 px-4 py-3 font-mono text-xs text-text-dim">
        No transmissions in the last {windowHours}h.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 border-l-2 border-l-crystal bg-slate-950/40 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-xs uppercase tracking-wide text-foreground">
          Digest — last {windowHours}h
        </span>
        {unreadCount > 0 && (
          <span className="rounded-full bg-crystal/20 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wide text-crystal">
            {unreadCount} new
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {groups.map(({ category, count, mostSevere }) => {
          const Icon = CATEGORY_ICON[category] ?? Radio
          return (
            <div
              key={category}
              className={cn('flex items-start gap-2 border-l-2 pl-3 font-mono text-[0.7rem] leading-relaxed', SEVERITY_STYLE[mostSevere.severity] ?? SEVERITY_STYLE.info)}
            >
              <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <div className="flex flex-col gap-0.5">
                <span className="uppercase tracking-wide text-text-faint">
                  {category} {count > 1 && `(${count})`}
                </span>
                <span className="text-text-dim">{mostSevere.message}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
