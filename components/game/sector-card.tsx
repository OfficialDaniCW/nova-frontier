'use client'

import { CheckCircle2, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FACTION_META, type Faction } from '@/lib/faction-meta'

export interface SectorView {
  id: string
  name: string
  faction: Faction
  garrisonStrength: number
  bloomIntensity: number
  positionX: number
  positionY: number
  ownerUserId: string | null
  isMine: boolean
  isCompactMate?: boolean
}

interface SectorCardProps {
  sector: SectorView
  selected?: boolean
  onSelect: (id: string) => void
}

export function SectorCard({ sector, selected, onSelect }: SectorCardProps) {
  const meta = FACTION_META[sector.faction]
  const Icon = meta.icon
  const isBloom = sector.faction === 'bloom'
  const cleared = sector.garrisonStrength <= 0

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
        {sector.ownerUserId ? (
          <span
            title={sector.isMine ? 'Your territory' : sector.isCompactMate ? 'Compact territory' : undefined}
          >
            <Flag
              className={cn(
                'size-4 shrink-0',
                sector.isMine
                  ? 'text-concord'
                  : sector.isCompactMate
                    ? 'text-primary'
                    : 'text-text-faint',
              )}
              aria-hidden="true"
            />
          </span>
        ) : (
          cleared && <CheckCircle2 className="size-4 shrink-0 text-concord" aria-hidden="true" />
        )}
      </div>

      <div>
        <h3 className="font-display text-sm font-semibold text-text">{sector.name}</h3>
        <p className="font-mono text-[0.65rem] text-text-faint">
          SEC {sector.positionX.toString().padStart(2, '0')}.{sector.positionY.toString().padStart(2, '0')}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-display text-[0.6rem] uppercase tracking-wide text-text-faint">
          Garrison
        </span>
        <span className={cn('font-mono text-xs tabular-nums', meta.textClass)}>
          {sector.garrisonStrength}
        </span>
      </div>

      {isBloom && (
        <div className="flex items-center justify-between">
          <span className="font-display text-[0.6rem] uppercase tracking-wide text-text-faint">
            Bloom intensity
          </span>
          <span className="font-mono text-xs tabular-nums text-bloom">{sector.bloomIntensity}%</span>
        </div>
      )}
    </button>
  )
}
