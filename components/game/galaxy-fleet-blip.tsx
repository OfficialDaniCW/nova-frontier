'use client'

import { useEffect, useState } from 'react'
import { Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'

/** A fleet in transit, positioned in absolute galaxy coordinates for map rendering. */
export interface FleetMapView {
  id: string
  mission: string
  sectorName: string
  originX: number
  originY: number
  destX: number
  destY: number
  departedAt: string
  arrivesAt: string
}

/**
 * Live 0..1 progress of a fleet's transit, recomputed every second on the
 * client so blips crawl toward their destination without a page refresh.
 * Returns `null` until the first client effect runs, avoiding a hydration
 * mismatch (matches the useCountdown pattern).
 */
function useFleetProgress(departedAt: string, arrivesAt: string): number | null {
  const [progress, setProgress] = useState<number | null>(null)

  useEffect(() => {
    const start = new Date(departedAt).getTime()
    const end = new Date(arrivesAt).getTime()
    const span = Math.max(1, end - start)
    const tick = () => setProgress(Math.min(1, Math.max(0, (Date.now() - start) / span)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [departedAt, arrivesAt])

  return progress
}

interface FleetBlipProps {
  fleet: FleetMapView
  /** Converts an absolute galaxy coordinate to a `{ left, top }` percentage pair. */
  toPercent: (x: number, y: number) => { left: number; top: number }
  size?: 'sm' | 'md'
}

/**
 * Renders one fleet as a moving glyph along a dashed trail line between its
 * origin and destination, positioned by live interpolated progress.
 */
export function FleetBlip({ fleet, toPercent, size = 'md' }: FleetBlipProps) {
  const progress = useFleetProgress(fleet.departedAt, fleet.arrivesAt)
  const p = progress ?? 0

  const origin = toPercent(fleet.originX, fleet.originY)
  const dest = toPercent(fleet.destX, fleet.destY)
  const current = {
    left: origin.left + (dest.left - origin.left) * p,
    top: origin.top + (dest.top - origin.top) * p,
  }

  const angle = (Math.atan2(dest.top - origin.top, dest.left - origin.left) * 180) / Math.PI

  return (
    <>
      {/* Trail line (SVG so it renders crisp at any zoom) */}
      <svg
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
        aria-hidden="true"
      >
        <line
          x1={`${origin.left}%`}
          y1={`${origin.top}%`}
          x2={`${dest.left}%`}
          y2={`${dest.top}%`}
          stroke="var(--concord)"
          strokeOpacity={0.35}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      </svg>
      <div
        style={{ left: `${current.left}%`, top: `${current.top}%` }}
        className="group pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
        title={`${fleet.mission} → ${fleet.sectorName} (${Math.round(p * 100)}%)`}
      >
        <Rocket
          className={cn(
            'text-concord drop-shadow-[0_0_6px_var(--concord)]',
            size === 'sm' ? 'size-2.5' : 'size-3.5',
          )}
          style={{ transform: `rotate(${angle + 45}deg)` }}
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>
    </>
  )
}
