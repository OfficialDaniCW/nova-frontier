'use client'

import { useEffect, useRef, useState } from 'react'
import { Users, Skull, Crosshair, Rocket } from 'lucide-react'
import type { PublicGameStats } from '@/lib/game/public-stats'

interface StatDef {
  key: keyof PublicGameStats
  label: string
  icon: typeof Users
  colorClass: string
}

const STAT_DEFS: StatDef[] = [
  { key: 'governorCount', label: 'Governors commissioned', icon: Users, colorClass: 'text-concord' },
  { key: 'shipsLost', label: 'Ships lost to the Verge', icon: Skull, colorClass: 'text-kessler' },
  { key: 'battlesFought', label: 'Battles logged', icon: Crosshair, colorClass: 'text-devotion' },
  { key: 'fleetsDeployed', label: 'Fleets deployed', icon: Rocket, colorClass: 'text-crystal' },
]

function useCountUp(target: number, durationMs = 1400) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    const from = 0

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / durationMs, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, durationMs])

  return value
}

function StatCounter({ def, value }: { def: StatDef; value: number }) {
  const animated = useCountUp(value)
  const Icon = def.icon

  return (
    <div className="flex flex-col items-center gap-2 px-4 py-2 text-center sm:items-start sm:text-left">
      <div className="flex items-center gap-2">
        <Icon className={`size-4 ${def.colorClass}`} strokeWidth={1.5} aria-hidden="true" />
        <span className="font-display text-2xl font-bold tabular-nums text-text sm:text-3xl">
          {new Intl.NumberFormat('en-US').format(animated)}
        </span>
      </div>
      <span className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
        {def.label}
      </span>
    </div>
  )
}

export function LiveStatsBand({ stats }: { stats: PublicGameStats }) {
  return (
    <div
      className="clip-chevron relative flex flex-col divide-y divide-panel-border border border-panel-border bg-slate-950/60 backdrop-blur-sm sm:flex-row sm:divide-x sm:divide-y-0"
      role="group"
      aria-label="Live server statistics"
    >
      {STAT_DEFS.map((def) => (
        <StatCounter key={def.key} def={def} value={stats[def.key]} />
      ))}
    </div>
  )
}
