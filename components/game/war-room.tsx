'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Crosshair,
  ShieldHalf,
  Swords,
  Radar,
  Rocket,
  ArrowUpRight,
  ArrowDownLeft,
  Trophy,
  Skull,
} from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { AttackFleetDialog } from '@/components/game/attack-fleet-dialog'
import { launchRaid, type getRaidState } from '@/app/actions/raid'
import { cn } from '@/lib/utils'

type RaidState = Awaited<ReturnType<typeof getRaidState>>

interface WarRoomProps {
  state: RaidState
}

function formatEta(seconds: number): string {
  if (seconds <= 0) return 'now'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  if (m <= 0) return `${s}s`
  return `${m}m ${s}s`
}

function Countdown({ iso }: { iso: string }) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000)),
  )
  useEffect(() => {
    const t = setInterval(() => {
      setRemaining(Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000)))
    }, 1000)
    return () => clearInterval(t)
  }, [iso])
  return <span className="font-mono tabular-nums">{formatEta(remaining)}</span>
}

export function WarRoom({ state }: WarRoomProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const stationedRows = Object.entries(state.stationed).map(([shipType, count]) => ({
    shipType,
    count,
  }))

  async function handleRaid(defenderUserId: string, shipCounts: Record<string, number>) {
    try {
      const res = await launchRaid(defenderUserId, shipCounts)
      toast.success(`Raid launched — ETA ${formatEta(res.etaSec)}.`)
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Raid failed to launch')
    }
  }

  if (!state.inCompact) {
    return (
      <Panel grid className="p-5">
        <p className="font-mono text-xs text-text-dim">
          You must belong to a Compact and be at war with a rival alliance before you can raid.
          Found or join a Compact, then declare war from the Compact screen.
        </p>
      </Panel>
    )
  }

  const shieldActive =
    state.raidShieldUntil && new Date(state.raidShieldUntil).getTime() > Date.now()

  return (
    <div className="flex flex-col gap-6">
      {/* Defense summary */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-text-faint">
          <ShieldHalf className="size-4" /> Home Defense
        </h2>
        <Panel grid className="grid grid-cols-2 gap-px overflow-hidden sm:grid-cols-4">
          <Stat label="Defense Power" value={state.defensePower} Icon={ShieldHalf} accent="crystal" />
          <Stat label="Strike Power" value={state.attackPower} Icon={Swords} accent="obsidian" />
          <Stat label="Shield Gen Lv" value={state.shieldLevel} Icon={Radar} accent="concord" />
          <div className="flex flex-col gap-1 bg-slate-950/40 p-4">
            <span className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-wide text-text-faint">
              <ShieldHalf className="size-3" aria-hidden="true" /> Raid Shield
            </span>
            <span
              className={cn(
                'font-display text-lg tabular-nums',
                shieldActive ? 'text-crystal' : 'text-text-dim',
              )}
            >
              {shieldActive && state.raidShieldUntil ? (
                <Countdown iso={state.raidShieldUntil} />
              ) : (
                'Exposed'
              )}
            </span>
          </div>
        </Panel>
        <p className="mt-2 font-mono text-[0.65rem] leading-relaxed text-text-faint">
          Only ships stationed in your hangar defend. Ships sent on a raid leave your colony
          vulnerable until they return.
        </p>
      </div>

      {/* Targets */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-text-faint">
          <Crosshair className="size-4" /> Enemy Targets
        </h2>
        {state.targets.length === 0 ? (
          <Panel grid className="p-5">
            <p className="font-mono text-xs text-text-dim">
              No valid raid targets. Declare war on a rival Compact from the Compact screen to expose
              their governors here.
            </p>
          </Panel>
        ) : (
          <Panel grid className="p-2 sm:p-3">
            <ul className="flex flex-col gap-2">
              {state.targets.map((t) => (
                <li
                  key={t.defenderUserId}
                  className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-l-obsidian/50 bg-slate-950/40 px-3 py-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-display text-sm uppercase tracking-wide text-foreground">
                      [{t.compactTag}] {t.callsign}
                    </span>
                    <span className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
                      {t.colonyName} · {t.distance} ly · def {t.defensePower} · ETA{' '}
                      {formatEta(t.etaSec)}
                    </span>
                  </div>
                  {t.shielded && t.shieldUntil ? (
                    <span className="flex items-center gap-1.5 border border-crystal/50 bg-crystal/10 px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-wide text-crystal clip-chevron-sm">
                      <ShieldHalf className="size-3.5" aria-hidden="true" />
                      Shielded <Countdown iso={t.shieldUntil} />
                    </span>
                  ) : (
                    <AttackFleetDialog
                      sectorName={t.callsign}
                      shipRows={stationedRows}
                      onLaunch={(counts) => handleRaid(t.defenderUserId, counts)}
                      variant="obsidian"
                      triggerIcon={Crosshair}
                      triggerLabel="Launch Raid"
                      dialogTitle={`Raid ${t.callsign}`}
                      dialogDescription={`Assign hangar ships to raid ${t.colonyName}. Estimated defense power: ${t.defensePower}. Ships sent will not defend your colony until they return.`}
                    />
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      {/* Active raid fleets */}
      {state.raidFleets.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-text-faint">
            <Rocket className="size-4" /> Fleets in Transit
          </h2>
          <Panel grid className="p-2 sm:p-3">
            <ul className="flex flex-col gap-2">
              {state.raidFleets.map((f) => {
                const total = Object.values(f.shipCounts).reduce((a, b) => a + b, 0)
                const incoming = f.direction === 'incoming'
                return (
                  <li
                    key={f.id}
                    className={cn(
                      'flex flex-wrap items-center justify-between gap-3 border-l-2 bg-slate-950/40 px-3 py-3',
                      incoming ? 'border-l-obsidian' : 'border-l-concord',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {incoming ? (
                        <ArrowDownLeft className="size-4 text-obsidian" aria-hidden="true" />
                      ) : (
                        <ArrowUpRight className="size-4 text-concord" aria-hidden="true" />
                      )}
                      <span className="font-mono text-xs text-text-dim">
                        {incoming ? (
                          <>
                            <span className="text-obsidian">Incoming raid</span> from {f.otherCallsign}
                          </>
                        ) : (
                          <>
                            Raiding <span className="text-concord">{f.otherCallsign}</span>
                          </>
                        )}{' '}
                        · {total} ships
                      </span>
                    </div>
                    <span className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
                      ETA <Countdown iso={f.arrivesAt} />
                    </span>
                  </li>
                )
              })}
            </ul>
          </Panel>
        </div>
      )}

      {/* Raid log */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-text-faint">
          <Swords className="size-4" /> Raid Log
        </h2>
        <Panel grid className="p-2 sm:p-3">
          {state.raidLogs.length === 0 ? (
            <p className="p-3 font-mono text-xs text-text-faint">No raids on record.</p>
          ) : (
            <ul className="flex flex-col">
              {state.raidLogs.map((l) => {
                const win = l.outcome === 'win'
                const looted = l.energyLooted + l.alloyLooted + l.crystalLooted
                return (
                  <li
                    key={l.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-panel-border/40 px-2 py-2 last:border-b-0"
                  >
                    <span className="flex items-center gap-2">
                      {win ? (
                        <Trophy className="size-3.5 text-crystal" aria-hidden="true" />
                      ) : (
                        <Skull className="size-3.5 text-obsidian" aria-hidden="true" />
                      )}
                      <span className="font-mono text-xs text-text-dim">{l.sectorName}</span>
                    </span>
                    <span className="flex items-center gap-3 font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
                      <span>
                        {l.attackerPower} vs {l.defenderPower}
                      </span>
                      {looted > 0 && (
                        <span className="text-crystal">
                          +{l.energyLooted}E {l.alloyLooted}A {l.crystalLooted}C
                        </span>
                      )}
                      <span className={win ? 'text-crystal' : 'text-obsidian'}>
                        {win ? 'WIN' : 'LOSS'}
                      </span>
                    </span>
                  </li>
                )
              })}
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
  value: number
  Icon: typeof ShieldHalf
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
