'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { SectorCard, type SectorView } from '@/components/game/sector-card'
import { SectorDetailPanel } from '@/components/game/sector-detail-panel'
import { FleetTransitList, type FleetTransitView } from '@/components/game/fleet-transit-list'
import { FACTION_META, type Faction } from '@/lib/faction-meta'
import { cn } from '@/lib/utils'

type FilterKey = 'all' | Faction | 'unclaimed'

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'kessler', label: 'Kessler' },
  { key: 'obsidian', label: 'Obsidian' },
  { key: 'hollow', label: 'Hollow' },
  { key: 'bloom', label: 'Bloom' },
  { key: 'unclaimed', label: 'Unclaimed' },
]

interface ShipRow {
  shipType: string
  count: number
}

interface GalaxyViewProps {
  sectors: SectorView[]
  resourceCaches: Record<string, { energy?: number; alloy?: number; crystal?: number }>
  shipRows: ShipRow[]
  fleets: FleetTransitView[]
}

export function GalaxyView({ sectors, resourceCaches, shipRows, fleets }: GalaxyViewProps) {
  const [selectedId, setSelectedId] = useState<string>(sectors[0]?.id ?? '')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [query, setQuery] = useState('')

  const filteredSectors = useMemo(() => {
    return sectors.filter((sector) => {
      if (filter === 'unclaimed') {
        if (sector.faction !== 'unclaimed') return false
      } else if (filter !== 'all' && sector.faction !== filter) {
        return false
      }
      if (query.trim() && !sector.name.toLowerCase().includes(query.trim().toLowerCase())) {
        return false
      }
      return true
    })
  }, [sectors, filter, query])

  const selected =
    filteredSectors.find((s) => s.id === selectedId) ?? filteredSectors[0] ?? sectors[0]

  const hasScoutProbe = (shipRows.find((r) => r.shipType === 'scout-probe')?.count ?? 0) > 0
  const hasHauler = (shipRows.find((r) => r.shipType === 'hauler')?.count ?? 0) > 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_OPTIONS.map((opt) => {
            const meta = opt.key !== 'all' && opt.key !== 'unclaimed' ? FACTION_META[opt.key] : null
            const active = filter === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setFilter(opt.key)}
                className={cn(
                  'clip-chevron-sm flex items-center gap-1.5 border px-2.5 py-1.5 font-display text-[0.65rem] uppercase tracking-wide transition-colors',
                  active
                    ? meta
                      ? cn(meta.borderClass, meta.bgClass, meta.textClass)
                      : 'border-primary bg-primary/10 text-primary'
                    : 'border-panel-border text-text-dim hover:text-foreground',
                )}
              >
                {meta && <meta.icon className="size-3" />}
                {opt.label}
              </button>
            )
          })}
        </div>
        <label className="relative flex items-center">
          <Search className="pointer-events-none absolute left-2.5 size-3.5 text-text-faint" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sector name..."
            className="w-full border border-panel-border bg-slate-950/60 py-1.5 pl-8 pr-3 font-mono text-xs text-foreground outline-none focus:border-primary sm:w-56"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSectors.length === 0 ? (
            <p className="col-span-full py-10 text-center font-mono text-sm text-text-dim">
              No sectors match the current filter.
            </p>
          ) : (
            filteredSectors.map((sector) => (
              <SectorCard
                key={sector.id}
                sector={sector}
                selected={sector.id === selectedId}
                onSelect={setSelectedId}
              />
            ))
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          {selected && (
            <SectorDetailPanel
              sector={selected}
              resourceCache={resourceCaches[selected.id] ?? {}}
              shipRows={shipRows}
              hasScoutProbe={hasScoutProbe}
              hasHauler={hasHauler}
            />
          )}
        </div>
      </div>

      {fleets.length > 0 && <FleetTransitList fleets={fleets} />}
    </div>
  )
}
