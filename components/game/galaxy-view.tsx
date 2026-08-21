'use client'

import { useState } from 'react'
import { Panel } from '@/components/game/panel'
import { SectorCard, type SectorView } from '@/components/game/sector-card'
import { SectorDetailPanel } from '@/components/game/sector-detail-panel'
import { formatDuration, useCountdown } from '@/hooks/use-countdown'
import { SHIP_DEFS } from '@/lib/game/definitions'

interface ShipRow {
  shipType: string
  count: number
}

interface FleetView {
  id: string
  sectorId: string
  sectorName: string
  mission: string
  arrivesAt: string
  shipCounts: Record<string, number>
}

interface GalaxyViewProps {
  sectors: SectorView[]
  resourceCaches: Record<string, { energy?: number; alloy?: number; crystal?: number }>
  shipRows: ShipRow[]
  fleets: FleetView[]
}

function FleetRow({ fleet }: { fleet: FleetView }) {
  const remaining = useCountdown(new Date(fleet.arrivesAt).getTime())
  const shipSummary = Object.entries(fleet.shipCounts)
    .map(([id, count]) => `${count}x ${SHIP_DEFS.find((d) => d.id === id)?.name ?? id}`)
    .join(', ')

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-panel-border/40 py-2 last:border-0">
      <div>
        <p className="font-display text-xs uppercase tracking-wide text-text">
          {fleet.mission} → {fleet.sectorName}
        </p>
        <p className="font-mono text-[0.65rem] text-text-faint">{shipSummary || 'No ships'}</p>
      </div>
      <span className="font-mono text-xs tabular-nums text-concord">
        {remaining === null ? '--:--' : formatDuration(remaining)}
      </span>
    </li>
  )
}

export function GalaxyView({ sectors, resourceCaches, shipRows, fleets }: GalaxyViewProps) {
  const [selectedId, setSelectedId] = useState<string>(sectors[0]?.id ?? '')
  const selected = sectors.find((s) => s.id === selectedId) ?? sectors[0]

  const hasScoutProbe = (shipRows.find((r) => r.shipType === 'scout-probe')?.count ?? 0) > 0
  const hasHauler = (shipRows.find((r) => r.shipType === 'hauler')?.count ?? 0) > 0

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sectors.map((sector) => (
            <SectorCard
              key={sector.id}
              sector={sector}
              selected={sector.id === selectedId}
              onSelect={setSelectedId}
            />
          ))}
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

      {fleets.length > 0 && (
        <Panel grid className="p-5">
          <h2 className="mb-3 font-display text-xs uppercase tracking-wide text-text-faint">
            Fleets in transit
          </h2>
          <ul className="flex flex-col">
            {fleets.map((fleet) => (
              <FleetRow key={fleet.id} fleet={fleet} />
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}
