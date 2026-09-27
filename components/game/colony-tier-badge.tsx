import { Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ColonyTierInfo } from '@/lib/game/colony-tier'

const TIER_ACCENT = ['text-text-dim', 'text-concord', 'text-crystal', 'text-primary', 'text-obsidian']

export function ColonyTierBadge({ info }: { info: ColonyTierInfo }) {
  const accent = TIER_ACCENT[info.tier - 1] ?? 'text-text-dim'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Building2 className={cn('size-4', accent)} aria-hidden="true" />
        <span className={cn('font-display text-sm font-semibold uppercase tracking-wide', accent)}>
          Tier {info.tier} · {info.name}
        </span>
      </div>
      <div className="h-1 w-40 overflow-hidden bg-slate-950/60">
        <div
          className={cn('h-full', accent.replace('text-', 'bg-'))}
          style={{ width: `${info.progressPct}%` }}
        />
      </div>
      <span className="font-mono text-[0.6rem] uppercase tracking-wide text-text-faint">
        {info.nextTierScore === null
          ? 'Maximum tier reached'
          : `${info.score} / ${info.nextTierScore} growth`}
      </span>
    </div>
  )
}
