'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { getStarType, type QuadrantDef } from '@/lib/game/galaxy'
import type { VisibleSystem } from '@/lib/game/discovery'

interface QuadrantMapProps {
  quadrant: QuadrantDef
  systems: VisibleSystem[]
  totalInQuadrant: number
  selectedSystemId: string | null
  onSelect: (systemId: string) => void
}

/**
 * A coordinate canvas rendering discovered systems as glowing nodes positioned
 * by their galaxy coordinates, normalized within the quadrant's coordinate box.
 */
export function QuadrantMap({
  quadrant,
  systems,
  totalInQuadrant,
  selectedSystemId,
  onSelect,
}: QuadrantMapProps) {
  const { x0, x1, y0, y1 } = quadrant.coordRange
  const spanX = x1 - x0 || 1
  const spanY = y1 - y0 || 1

  const nodes = useMemo(
    () =>
      systems.map((s) => ({
        system: s,
        left: ((s.positionX - x0) / spanX) * 100,
        top: ((s.positionY - y0) / spanY) * 100,
      })),
    [systems, x0, y0, spanX, spanY],
  )

  const discoveredCount = systems.length

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-wide text-text">
            {quadrant.name}
          </h2>
          <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
            {quadrant.tagline}
          </p>
        </div>
        <span className="font-mono text-[0.65rem] uppercase tracking-wide text-text-dim">
          {discoveredCount}/{totalInQuadrant} charted
        </span>
      </div>

      <div
        className="control-grid relative aspect-[4/3] w-full overflow-hidden border border-panel-border bg-slate-950/50"
        role="group"
        aria-label={`${quadrant.name} star map`}
      >
        {/* Coordinate crosshairs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-0 h-full w-px bg-panel-border/40" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-panel-border/40" />
        </div>

        {discoveredCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="max-w-[16rem] text-balance text-center font-mono text-xs text-text-dim">
              No systems charted in this quadrant. Run a Deep Scan or survey toward it to reveal
              stars.
            </p>
          </div>
        )}

        {nodes.map(({ system, left, top }) => {
          const star = getStarType(system.starType)
          const selected = system.id === selectedSystemId
          const surveyed = system.discovery === 'surveyed'
          const nodeLabel = surveyed
            ? `${system.name}${system.isHome ? ' (home system)' : ''}`
            : 'Uncharted system — survey to reveal'
          return (
            <button
              key={system.id}
              type="button"
              onClick={() => onSelect(system.id)}
              style={{ left: `${left}%`, top: `${top}%` }}
              className={cn(
                'group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none',
              )}
              aria-label={nodeLabel}
            >
              {/* Node glow */}
              <span
                className={cn(
                  'block rounded-full transition-transform group-hover:scale-125',
                  selected ? 'size-4 ring-2 ring-offset-2 ring-offset-slate-950' : 'size-3',
                  surveyed ? 'opacity-100' : 'opacity-60',
                )}
                style={{
                  backgroundColor: star.color,
                  boxShadow: `0 0 ${selected ? 14 : 8}px ${star.color}`,
                  // @ts-expect-error CSS custom ring color
                  '--tw-ring-color': star.color,
                }}
              />
              {system.isHome && (
                <span className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-concord/70" />
              )}
              {/* Ownership pips */}
              {system.ownedByMe > 0 && (
                <span className="absolute -right-1 -top-1 size-1.5 rounded-full bg-concord" />
              )}
              {system.ownedByOthers > 0 && (
                <span className="absolute -bottom-1 -right-1 size-1.5 rounded-full bg-obsidian" />
              )}
              <span
                className={cn(
                  'pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap font-mono text-[0.55rem] uppercase tracking-wide transition-opacity',
                  selected ? 'text-text opacity-100' : 'text-text-faint opacity-0 group-hover:opacity-100',
                )}
              >
                {surveyed ? system.name : 'Unsurveyed'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.55rem] uppercase tracking-wide text-text-faint">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full border border-concord/70" /> Home
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-concord" /> Your holdings
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-obsidian" /> Rival holdings
        </span>
        <span className="flex items-center gap-1 opacity-60">
          <span className="size-2 rounded-full bg-text-faint" /> Detected (survey to reveal)
        </span>
      </div>
    </div>
  )
}
