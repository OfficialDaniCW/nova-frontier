'use client'

import { useEffect, useState } from 'react'
import {
  ShieldAlert,
  CloudLightning,
  Sun,
  Mountain,
  Bug,
  Orbit,
  AlertTriangle,
  BookOpen,
} from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { cn } from '@/lib/utils'
import type { getHazardsState } from '@/app/actions/disasters'

type HazardsState = Awaited<ReturnType<typeof getHazardsState>>

const ICON_MAP: Record<string, typeof Sun> = {
  sun: Sun,
  mountain: Mountain,
  bug: Bug,
  orbit: Orbit,
}

function formatMs(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m <= 0) return `${s}s`
  return `${m}m ${s}s`
}

function Countdown({ ms }: { ms: number }) {
  const [remaining, setRemaining] = useState(ms)
  useEffect(() => {
    setRemaining(ms)
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1000)), 1000)
    return () => clearInterval(t)
  }, [ms])
  return <span className="font-mono tabular-nums">{formatMs(remaining)}</span>
}

const SEVERITY_CLASS: Record<string, string> = {
  severe: 'text-obsidian',
  moderate: 'text-crystal',
  minor: 'text-text-dim',
}

export function HazardsPanel({ state }: { state: HazardsState }) {
  const onCooldown = (state.cooldownRemainingMs ?? 0) > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Resilience summary */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-text-faint">
          <ShieldAlert className="size-4" /> Colony Resilience
        </h2>
        <Panel grid className="grid grid-cols-2 gap-px overflow-hidden sm:grid-cols-4">
          <Stat label="Bunker Lv" value={state.bunkerLevel} Icon={ShieldAlert} accent="concord" />
          <Stat
            label="Forecasting Lv"
            value={state.forecastingLevel}
            Icon={CloudLightning}
            accent="crystal"
          />
          <Stat
            label="Strike Chance"
            value={`${state.strikeChancePct}%`}
            Icon={AlertTriangle}
            accent="obsidian"
          />
          <div className="flex flex-col gap-1 bg-slate-950/40 p-4">
            <span className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-wide text-text-faint">
              <ShieldAlert className="size-3" aria-hidden="true" /> Status
            </span>
            <span
              className={cn(
                'font-display text-lg tabular-nums',
                onCooldown ? 'text-crystal' : 'text-text-dim',
              )}
            >
              {onCooldown ? <Countdown ms={state.cooldownRemainingMs!} /> : 'Vulnerable'}
            </span>
          </div>
        </Panel>
        <p className="mt-2 font-mono text-[0.65rem] leading-relaxed text-text-faint">
          Disasters strike automatically and cannot be dodged in the moment. Build a Contingency
          Bunker and research Disaster Forecasting to reduce both the odds and the damage.
        </p>
      </div>

      {/* Almanac */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-text-faint">
          <BookOpen className="size-4" /> Hazard Almanac
        </h2>
        <Panel grid className="p-2 sm:p-3">
          <ul className="flex flex-col gap-2">
            {state.almanac.map((entry) => {
              const Icon = ICON_MAP[entry.iconKey] ?? Orbit
              return (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-l-panel-border bg-slate-950/40 px-3 py-3"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 size-4 text-text-faint" aria-hidden="true" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-display text-sm uppercase tracking-wide text-foreground">
                        {entry.name}
                      </span>
                      <span className="font-mono text-[0.65rem] leading-relaxed text-text-faint">
                        {entry.blurb}
                      </span>
                      <span className="font-mono text-[0.6rem] uppercase tracking-wide text-text-dim">
                        {entry.affinityLabel}
                      </span>
                    </div>
                  </div>
                  <span className="whitespace-nowrap font-mono text-[0.65rem] uppercase tracking-wide text-concord">
                    {entry.mitigationPct}% mitigated
                  </span>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      {/* Recent events */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-text-faint">
          <AlertTriangle className="size-4" /> Recent Events
        </h2>
        <Panel grid className="p-2 sm:p-3">
          {state.recentEvents.length === 0 ? (
            <p className="p-3 font-mono text-xs text-text-faint">No disasters on record.</p>
          ) : (
            <ul className="flex flex-col">
              {state.recentEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-panel-border/40 px-2 py-2 last:border-b-0"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle
                      className={cn('size-3.5', SEVERITY_CLASS[ev.severity] ?? 'text-text-dim')}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-xs text-text-dim">{ev.summary}</span>
                  </span>
                  <span className="flex items-center gap-3 font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
                    {ev.mitigatedPct > 0 && (
                      <span className="text-concord">{ev.mitigatedPct}% mitigated</span>
                    )}
                    <span className={SEVERITY_CLASS[ev.severity] ?? 'text-text-dim'}>
                      {ev.severity.toUpperCase()}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  Icon,
  accent,
}: {
  label: string
  value: number | string
  Icon: typeof ShieldAlert
  accent: 'crystal' | 'obsidian' | 'concord'
}) {
  const accentClass =
    accent === 'crystal' ? 'text-crystal' : accent === 'obsidian' ? 'text-obsidian' : 'text-concord'
  return (
    <div className="flex flex-col gap-1 bg-slate-950/40 p-4">
      <span className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-wide text-text-faint">
        <Icon className="size-3" aria-hidden="true" /> {label}
      </span>
      <span className={cn('font-display text-lg tabular-nums', accentClass)}>{value}</span>
    </div>
  )
}
