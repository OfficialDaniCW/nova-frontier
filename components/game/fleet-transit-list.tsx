'use client'

import { Rocket } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { formatDuration, useCountdown } from '@/hooks/use-countdown'
import { SHIP_DEFS } from '@/lib/game/definitions'

export interface FleetTransitView {
  id: string
  sectorId: string
  sectorName: string
  mission: string
  arrivesAt: string
  shipCounts: Record<string, number>
}

function TransitRow({ fleet }: { fleet: FleetTransitView }) {
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

/** Panel listing fleets currently in transit, with a live countdown to arrival. */
export function FleetTransitList({ fleets }: { fleets: FleetTransitView[] }) {
  return (
    <Panel grid className="flex flex-col gap-3 p-5">
      <h2 className="flex items-center gap-1.5 font-display text-xs uppercase tracking-wide text-text-faint">
        <Rocket className="size-3.5" aria-hidden="true" />
        Fleets in transit
      </h2>
      {fleets.length === 0 ? (
        <p className="font-mono text-xs text-text-faint">No fleets currently deployed.</p>
      ) : (
        <ul className="flex flex-col">
          {fleets.map((fleet) => (
            <TransitRow key={fleet.id} fleet={fleet} />
          ))}
        </ul>
      )}
    </Panel>
  )
}
