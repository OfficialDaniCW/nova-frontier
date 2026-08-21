'use client'

import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  Factory,
  FlaskConical,
  Gem,
  Layers,
  Rocket,
  Satellite,
  ShieldCheck,
  Warehouse,
  Zap,
} from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { ChevronButton } from '@/components/game/chevron-button'
import { ResourceCostRow } from '@/components/game/resource-pill'
import type { BuildingDef } from '@/lib/game-data'
import { resourceState } from '@/lib/game-data'

const BUILDING_ICONS: Record<string, LucideIcon> = {
  'command-spire': Building2,
  'fusion-reactor': Zap,
  'alloy-foundry': Layers,
  'crystal-extractor': Gem,
  'storage-depot': Warehouse,
  'research-lab': FlaskConical,
  'fabrication-bay': Factory,
  shipyard: Rocket,
  'shield-generator': ShieldCheck,
  'sensor-array': Satellite,
}

function canAfford(cost: BuildingDef['cost']) {
  return (
    (cost.energy ?? 0) <= resourceState.energy &&
    (cost.alloy ?? 0) <= resourceState.alloy &&
    (cost.crystal ?? 0) <= resourceState.crystal
  )
}

interface BuildingCardProps {
  building: BuildingDef
  queueActive: boolean
  onUpgrade?: (id: string) => void
}

export function BuildingCard({ building, queueActive, onUpgrade }: BuildingCardProps) {
  const Icon = BUILDING_ICONS[building.id] ?? Building2
  const atMax = building.level >= building.maxLevel
  const affordable = canAfford(building.cost)
  const locked = atMax || !affordable || queueActive

  let lockedReason: string | undefined
  if (atMax) lockedReason = 'Maximum level reached.'
  else if (queueActive) lockedReason = 'Construction queue occupied.'
  else if (!affordable) lockedReason = 'Insufficient resources.'

  return (
    <Panel grid className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center border border-concord/30 bg-concord/10 clip-panel-sm">
            <Icon className="size-5 text-concord" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold tracking-wide text-text">
              {building.name}
            </h3>
            <p className="font-mono text-[0.65rem] text-text-faint">
              LVL {building.level.toString().padStart(2, '0')} / {building.maxLevel}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-text-dim">{building.description}</p>

      {building.productionRate && (
        <div className="flex items-center justify-between border-y border-panel-border/60 py-2">
          <span className="font-display text-[0.65rem] uppercase tracking-wide text-text-faint">
            Output
          </span>
          <span className="font-mono text-xs tabular-nums text-concord">
            +{building.productionRate.amount}/s {building.productionRate.resource}
          </span>
        </div>
      )}
      {building.storageCapacity && (
        <div className="flex items-center justify-between border-y border-panel-border/60 py-2">
          <span className="font-display text-[0.65rem] uppercase tracking-wide text-text-faint">
            Capacity
          </span>
          <span className="font-mono text-xs tabular-nums text-alloy">
            {new Intl.NumberFormat('en-US').format(building.storageCapacity)}
          </span>
        </div>
      )}

      <ResourceCostRow cost={building.cost} />

      <ChevronButton
        variant="concord"
        locked={locked}
        lockedReason={lockedReason}
        onClick={() => onUpgrade?.(building.id)}
        className="w-full"
      >
        Upgrade
      </ChevronButton>
    </Panel>
  )
}
