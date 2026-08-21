'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Flag, Package, Radar } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { ChevronButton } from '@/components/game/chevron-button'
import { ResourceCostRow } from '@/components/game/resource-pill'
import { StatBar } from '@/components/game/stat-bar'
import { AttackFleetDialog } from '@/components/game/attack-fleet-dialog'
import { InfoTooltip } from '@/components/game/info-tooltip'
import { FACTION_META } from '@/lib/faction-meta'
import { cn } from '@/lib/utils'
import type { SectorView } from '@/components/game/sector-card'
import { scoutSector, attackSector, salvageSector, colonizeSector } from '@/app/actions/fleet'

interface ShipRow {
  shipType: string
  count: number
}

interface SectorDetailPanelProps {
  sector: SectorView
  resourceCache: { energy?: number; alloy?: number; crystal?: number }
  shipRows: ShipRow[]
  hasScoutProbe: boolean
  hasHauler: boolean
}

export function SectorDetailPanel({
  sector,
  resourceCache,
  shipRows,
  hasScoutProbe,
  hasHauler,
}: SectorDetailPanelProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)

  const meta = FACTION_META[sector.faction]
  const Icon = meta.icon
  const isBloom = sector.faction === 'bloom'
  const cleared = sector.garrisonStrength <= 0
  const unclaimed = cleared && !sector.ownerUserId

  async function run(action: () => Promise<{ ok: boolean; etaSec?: number }>, successMsg: string) {
    setBusy(true)
    try {
      const res = await action()
      toast.success(res.etaSec ? `${successMsg} — ETA ${Math.round(res.etaSec)}s` : successMsg)
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel grid scanline className="flex flex-col gap-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
            SEC {sector.positionX.toString().padStart(2, '0')}.{sector.positionY.toString().padStart(2, '0')}
          </p>
          <h2 className="font-display text-lg font-semibold text-text">{sector.name}</h2>
        </div>
        <span
          className={cn(
            'flex items-center gap-1.5 border px-2.5 py-1 clip-chevron-sm',
            meta.borderClass,
            meta.bgClass,
            meta.textClass,
          )}
        >
          <Icon className="size-3.5" aria-hidden="true" />
          <span className="font-display text-[0.65rem] font-semibold uppercase tracking-wide">
            {meta.label}
          </span>
        </span>
      </div>

      <StatBar label="Garrison strength" value={sector.garrisonStrength} max={100} color={meta.statColor} />

      {sector.ownerUserId && (
        <p className="flex items-center gap-1.5 font-mono text-xs text-text-dim">
          <Flag className={cn('size-3.5', sector.isMine ? 'text-concord' : 'text-text-faint')} aria-hidden="true" />
          {sector.isMine ? 'Claimed by your compact.' : 'Claimed by a rival governor.'}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <span className="font-display text-[0.65rem] uppercase tracking-wide text-text-faint">
          Estimated cache
        </span>
        <ResourceCostRow cost={resourceCache} />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-panel-border/60 pt-4">
        <ChevronButton
          variant="concord"
          size="sm"
          locked={busy || !hasScoutProbe}
          lockedReason={!hasScoutProbe ? 'No scout probes in hangar.' : undefined}
          onClick={() => run(() => scoutSector(sector.id), 'Scout dispatched')}
        >
          <Radar className="size-3.5" aria-hidden="true" />
          Scout
        </ChevronButton>
        <InfoTooltip label="What does Scout do?">
          Sends a scout probe to reveal this sector&apos;s garrison strength and resource cache without
          engaging its defenders. Low risk, no combat.
        </InfoTooltip>

        {!cleared && !sector.isMine && (
          <>
            <AttackFleetDialog
              sectorName={sector.name}
              shipRows={shipRows}
              disabled={busy}
              onLaunch={(counts) => run(() => attackSector(sector.id, counts), 'Attack fleet dispatched')}
            />
            <InfoTooltip label="What does Attack do?">
              Dispatches warships to fight the sector&apos;s garrison. Winning reduces garrison strength
              toward zero; losing costs ships. Faction defense multipliers apply.
            </InfoTooltip>
          </>
        )}

        {cleared && !sector.ownerUserId && (
          <>
            <ChevronButton
              variant="crystal"
              size="sm"
              locked={busy || !hasHauler}
              lockedReason={!hasHauler ? 'No haulers in hangar.' : undefined}
              onClick={() => run(() => colonizeSector(sector.id), 'Colonization fleet dispatched')}
            >
              <Flag className="size-3.5" aria-hidden="true" />
              Found Colony
            </ChevronButton>
            <InfoTooltip label="What does Found Colony do?">
              Sends a hauler to claim this cleared sector under your banner, adding it to your territory
              and score. Requires the garrison to be fully cleared first.
            </InfoTooltip>
          </>
        )}

        {cleared && !sector.isMine && (
          <>
            <ChevronButton
              variant="alloy"
              size="sm"
              locked={busy || !hasHauler}
              lockedReason={!hasHauler ? 'No haulers in hangar.' : undefined}
              onClick={() => run(() => salvageSector(sector.id), 'Salvage fleet dispatched')}
            >
              <Package className="size-3.5" aria-hidden="true" />
              Salvage
            </ChevronButton>
            <InfoTooltip label="What does Salvage do?">
              Sends a hauler to strip the cleared sector&apos;s resource cache without claiming territory
              here. Faster payout, no lasting foothold.
            </InfoTooltip>
          </>
        )}
      </div>

      {unclaimed && (
        <p className="font-mono text-[0.6rem] text-text-faint">
          Sector garrison cleared. Send a hauler to salvage or found a colony here.
        </p>
      )}
    </Panel>
  )
}
