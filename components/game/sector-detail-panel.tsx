'use client'

import { Flag, Radar, Swords } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { ChevronButton } from '@/components/game/chevron-button'
import { ResourceCostRow } from '@/components/game/resource-pill'
import { StatBar } from '@/components/game/stat-bar'
import type { SectorDef } from '@/lib/game-data'
import { FACTION_META } from '@/lib/faction-meta'
import { cn } from '@/lib/utils'

interface SectorDetailPanelProps {
  sector: SectorDef
}

export function SectorDetailPanel({ sector }: SectorDetailPanelProps) {
  const meta = FACTION_META[sector.faction]
  const Icon = meta.icon
  const isBloom = sector.faction === 'bloom'

  return (
    <Panel grid scanline className="flex flex-col gap-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
            SEC {sector.x.toString().padStart(2, '0')}.{sector.y.toString().padStart(2, '0')}
          </p>
          <h2 className="font-display text-lg font-semibold text-text">{sector.name}</h2>
        </div>
        <span
          className={cn(
            'flex items-center gap-1.5 border px-2.5 py-1 clip-chevron-sm',
            meta.borderClass,
            meta.bgClass,
            meta.textClass,
          )}
        >
          <Icon className="size-3.5" aria-hidden="true" />
          <span className="font-display text-[0.65rem] font-semibold uppercase tracking-wide">
            {meta.label}
          </span>
        </span>
      </div>

      <StatBar
        label="Defence rating"
        value={sector.defense}
        max={100}
        color={meta.statColor}
        displayValue={sector.scanned ? sector.defense : `~${Math.round(sector.defense / 10) * 10}`}
      />

      <div className="flex flex-col gap-2">
        <span className="font-display text-[0.65rem] uppercase tracking-wide text-text-faint">
          Garrison composition
        </span>
        {sector.garrison.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {sector.garrison.map((g) => (
              <li
                key={g.unit}
                className="flex items-center justify-between border-b border-panel-border/40 py-1 font-mono text-xs text-text-dim last:border-0"
              >
                <span>{g.unit}</span>
                <span className="tabular-nums text-text">×{g.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-mono text-xs text-text-faint">No garrison detected.</p>
        )}
        {!sector.scanned && (
          <p className="font-mono text-[0.65rem] text-text-faint">
            Composition approximate. Scan for exact readings.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-display text-[0.65rem] uppercase tracking-wide text-text-faint">
          Estimated cache
        </span>
        <ResourceCostRow cost={sector.resourceCache} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-panel-border/60 pt-4">
        {!sector.scanned && (
          <ChevronButton variant="concord" size="sm">
            <Radar className="size-3.5" aria-hidden="true" />
            Scan
          </ChevronButton>
        )}
        {!sector.cleared && (
          <ChevronButton
            variant={isBloom ? 'bloom' : 'obsidian'}
            size="sm"
            locked={isBloom}
            lockedReason="Scout the sector before committing an attack fleet."
          >
            <Swords className="size-3.5" aria-hidden="true" />
            Launch Attack
          </ChevronButton>
        )}
        {sector.cleared && (
          <ChevronButton variant="crystal" size="sm">
            <Flag className="size-3.5" aria-hidden="true" />
            Found Colony
          </ChevronButton>
        )}
      </div>
    </Panel>
  )
}
