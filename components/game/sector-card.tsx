'use client'

import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SectorDef } from '@/lib/game-data'
import { FACTION_META } from '@/lib/faction-meta'

interface SectorCardProps {
  sector: SectorDef
  selected?: boolean
  onSelect: (id: string) => void
}

export function SectorCard({ sector, selected, onSelect }: SectorCardProps) {
  const meta = FACTION_META[sector.faction]
  const Icon = meta.icon
  const isBloom = sector.faction === 'bloom'

  return (
    <button
      type="button"
      onClick={() => onSelect(sector.id)}
      className={cn(
        'group relative flex flex-col gap-3 border p-4 text-left transition-all',
        isBloom ? 'clip-bloom bloom-pulse' : 'clip-panel',
        meta.borderClass,
        meta.bgClass,
        selected ? 'ring-1 ring-concord/60' : 'hover:brightness-125',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <Icon className={cn('size-4 shrink-0', meta.textClass)} aria-hidden="true" />
          <span className={cn('font-display text-xs font-semibold uppercase tracking-wide', meta.textClass)}>
            {meta.label}
          </span>
        </span>
        {sector.cleared && (
          <CheckCircle2 className="size-4 shrink-0 text-concord" aria-hidden="true" />
        )}
      </div>

      <div>
        <h3 className="font-display text-sm font-semibold text-text">{sector.name}</h3>
        <p className="font-mono text-[0.65rem] text-text-faint">
          SEC {sector.x.toString().padStart(2, '0')}.{sector.y.toString().padStart(2, '0')}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-display text-[0.6rem] uppercase tracking-wide text-text-faint">
          Defence
        </span>
        <span className={cn('font-mono text-xs tabular-nums', meta.textClass)}>
          {sector.scanned ? sector.defense : `~${Math.round(sector.defense / 10) * 10}`}
        </span>
      </div>
    </button>
  )
}
