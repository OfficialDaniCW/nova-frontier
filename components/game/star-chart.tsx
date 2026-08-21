'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { SatelliteDish, Loader2 } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { ChevronButton } from '@/components/game/chevron-button'
import { InfoTooltip } from '@/components/game/info-tooltip'
import { QuadrantMap } from '@/components/game/quadrant-map'
import { SystemDetailPanel } from '@/components/game/system-detail-panel'
import { FleetTransitList, type FleetTransitView } from '@/components/game/fleet-transit-list'
import { QUADRANTS, getQuadrant, type QuadrantId } from '@/lib/game/galaxy'
import { cn } from '@/lib/utils'
import { deepScan } from '@/app/actions/fleet'
import { getSystem } from '@/app/actions/exploration'
import type { VisibleSystem, SystemDetail } from '@/lib/game/discovery'

interface ShipRow {
  shipType: string
  count: number
}

interface StarChartProps {
  systems: VisibleSystem[]
  quadrantTotals: Record<string, number>
  homeSystemId: string | null
  sensorRange: number
  resourceCaches: Record<string, { energy?: number; alloy?: number; crystal?: number }>
  shipRows: ShipRow[]
  fleets: FleetTransitView[]
  currentUserId: string
  compactMateUserIds: string[]
}

export function StarChart({
  systems,
  quadrantTotals,
  homeSystemId,
  sensorRange,
  resourceCaches,
  shipRows,
  fleets,
  currentUserId,
  compactMateUserIds,
}: StarChartProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const homeQuadrant = useMemo(
    () => systems.find((s) => s.id === homeSystemId)?.quadrant ?? 'auric',
    [systems, homeSystemId],
  )
  const [activeQuadrant, setActiveQuadrant] = useState<QuadrantId>(homeQuadrant as QuadrantId)
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(homeSystemId)
  const [detail, setDetail] = useState<SystemDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [scanning, setScanning] = useState(false)

  const quadrant = getQuadrant(activeQuadrant) ?? QUADRANTS[0]
  const quadrantSystems = systems.filter((s) => s.quadrant === activeQuadrant)

  const hasScoutProbe = (shipRows.find((r) => r.shipType === 'scout-probe')?.count ?? 0) > 0
  const hasHauler = (shipRows.find((r) => r.shipType === 'hauler')?.count ?? 0) > 0

  async function selectSystem(systemId: string) {
    setSelectedSystemId(systemId)
    setLoadingDetail(true)
    setDetail(null)
    try {
      const d = await getSystem(systemId)
      setDetail(d)
    } catch {
      toast.error('Could not load system detail')
    } finally {
      setLoadingDetail(false)
    }
  }

  async function handleDeepScan() {
    setScanning(true)
    try {
      const res = await deepScan()
      if (res.detected > 0) {
        toast.success(`Deep Scan complete — ${res.detected} new system(s) detected.`)
      } else {
        toast.info('Deep Scan complete — no new systems in range.')
      }
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Deep Scan failed')
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Quadrant tabs + deep scan */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {QUADRANTS.map((q) => {
            const active = q.id === activeQuadrant
            const charted = systems.filter((s) => s.quadrant === q.id).length
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setActiveQuadrant(q.id)}
                className={cn(
                  'clip-chevron-sm flex items-center gap-2 border px-3 py-1.5 font-display text-[0.65rem] uppercase tracking-wide transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-primary shadow-[0_0_12px_-2px_var(--primary)]'
                    : 'border-panel-border text-text-dim hover:text-foreground',
                )}
              >
                {q.name}
                <span className="font-mono text-[0.6rem] text-text-faint">
                  {charted}/{quadrantTotals[q.id] ?? 0}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.6rem] uppercase tracking-wide text-text-faint">
            Sensor range {sensorRange}u
          </span>
          <ChevronButton variant="concord" size="sm" locked={scanning} onClick={handleDeepScan}>
            {scanning ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <SatelliteDish className="size-3.5" aria-hidden="true" />
            )}
            Deep Scan
          </ChevronButton>
          <InfoTooltip label="What does Deep Scan do?">
            Spends energy on an extended sensor sweep from your home system, detecting undiscovered
            systems in an expanded radius. On a short cooldown. Detected systems must still be
            surveyed to reveal their planets.
          </InfoTooltip>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <Panel className="p-4">
          <QuadrantMap
            quadrant={quadrant}
            systems={quadrantSystems}
            totalInQuadrant={quadrantTotals[activeQuadrant] ?? 0}
            selectedSystemId={selectedSystemId}
            onSelect={selectSystem}
          />
        </Panel>

        <div className="lg:sticky lg:top-24 lg:self-start">
          {loadingDetail ? (
            <Panel className="flex items-center justify-center p-10">
              <Loader2 className="size-5 animate-spin text-text-dim" aria-hidden="true" />
            </Panel>
          ) : detail ? (
            <SystemDetailPanel
              detail={detail}
              resourceCaches={resourceCaches}
              shipRows={shipRows}
              currentUserId={currentUserId}
              compactMateUserIds={compactMateUserIds}
              hasScoutProbe={hasScoutProbe}
              hasHauler={hasHauler}
            />
          ) : (
            <Panel className="p-6">
              <p className="text-center font-mono text-xs text-text-dim">
                Select a system node on the star map to inspect it.
              </p>
            </Panel>
          )}
        </div>
      </div>

      {fleets.length > 0 && <FleetTransitList fleets={fleets} />}
    </div>
  )
}
