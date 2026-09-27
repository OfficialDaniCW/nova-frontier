'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { GALAXY_SIZE, QUADRANTS, getStarType, type QuadrantId } from '@/lib/game/galaxy'
import type { VisibleSystem } from '@/lib/game/discovery'
import { FleetBlip, type FleetMapView } from '@/components/game/galaxy-fleet-blip'

interface GalaxyOverviewMapProps {
  systems: VisibleSystem[]
  fleets: FleetMapView[]
  selectedSystemId: string | null
  onSelect: (systemId: string, quadrant: QuadrantId) => void
}

/**
 * Zoomed-out view of the entire galaxy at true relative scale — every
 * discovered system plotted by its absolute (x, y) coordinate across all
 * four quadrants at once, so players can read overall sprawl, chokepoints,
 * and fleet movement before drilling into a single quadrant.
 */
export function GalaxyOverviewMap({
  systems,
  fleets,
  selectedSystemId,
  onSelect,
}: GalaxyOverviewMapProps) {
  const span = GALAXY_SIZE - 1

  const toPercent = (x: number, y: number) => ({
    left: (x / span) * 100,
    top: (y / span) * 100,
  })

  const nodes = useMemo(
    () => systems.map((s) => ({ system: s, ...toPercent(s.positionX, s.positionY) })),
    [systems],
  )

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-wide text-text">
          Galaxy Overview
        </h2>
        <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
          {systems.length} systems charted across four quadrants
        </p>
      </div>

      <div
        className="control-grid relative aspect-square w-full overflow-hidden border border-panel-border bg-slate-950/50"
        role="group"
        aria-label="Galaxy overview map"
      >
        {/* Quadrant quarter dividers */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-0 h-full w-px bg-panel-border/60" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-panel-border/60" />
        </div>

        {/* Quadrant labels, one per quarter */}
        {QUADRANTS.map((q) => {
          const cx = (q.coordRange.x0 + q.coordRange.x1) / 2
          const cy = q.coordRange.y0
          const { left } = toPercent(cx, 0)
          return (
            <span
              key={q.id}
              style={{ left: `${left}%`, top: '2%' }}
              className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap font-mono text-[0.55rem] uppercase tracking-wide text-text-faint/70"
            >
              {q.name}
            </span>
          )
        })}

        {nodes.map(({ system, left, top }) => {
          const star = getStarType(system.starType)
          const selected = system.id === selectedSystemId
          const surveyed = system.discovery === 'surveyed'
          return (
            <button
              key={system.id}
              type="button"
              onClick={() => onSelect(system.id, system.quadrant as QuadrantId)}
              style={{ left: `${left}%`, top: `${top}%` }}
              className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
              aria-label={surveyed ? system.name : 'Uncharted system'}
            >
              <span
                className={cn(
                  'block rounded-full transition-transform group-hover:scale-150',
                  selected ? 'size-3 ring-2 ring-offset-1 ring-offset-slate-950' : 'size-1.5',
                  surveyed ? 'opacity-100' : 'opacity-50',
                )}
                style={{
                  backgroundColor: star.color,
                  boxShadow: `0 0 ${selected ? 10 : 5}px ${star.color}`,
                  // @ts-expect-error CSS custom ring color
                  '--tw-ring-color': star.color,
                }}
              />
              {system.isHome && (
                <span className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-concord/70" />
              )}
            </button>
          )
        })}

        {fleets.map((fleet) => (
          <FleetBlip key={fleet.id} fleet={fleet} toPercent={toPercent} size="sm" />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.55rem] uppercase tracking-wide text-text-faint">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full border border-concord/70" /> Home
        </span>
        <span className="flex items-center gap-1">
          <svg width="10" height="10" aria-hidden="true">
            <line x1="0" y1="5" x2="10" y2="5" stroke="var(--concord)" strokeDasharray="2 2" />
          </svg>
          Fleet in transit
        </span>
        <span>Click a node to jump into its quadrant</span>
      </div>
    </div>
  )
}
