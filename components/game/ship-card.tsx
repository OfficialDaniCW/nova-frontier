'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { ChevronButton } from '@/components/game/chevron-button'
import { ResourceCostRow } from '@/components/game/resource-pill'
import { Input } from '@/components/ui/input'
import type { Cost } from '@/lib/game/definitions'

export interface ShipCardDef {
  id: string
  name: string
  description: string
  icon: LucideIcon
  count: number
  attack: number
  defense: number
  cargo: number
  cost: Cost
  buildTimeSec: number
  unlocked: boolean
  requiredLevel: number
  requiredBuildingName: string
}

interface ShipCardProps {
  ship: ShipCardDef
  queueActive: boolean
  affordable: (quantity: number) => boolean
  onFabricate?: (id: string, quantity: number) => void
}

export function ShipCard({ ship, queueActive, affordable, onFabricate }: ShipCardProps) {
  const [quantity, setQuantity] = useState(1)
  const Icon = ship.icon
  const locked = !ship.unlocked || queueActive || !affordable(quantity)

  let lockedReason: string | undefined
  if (!ship.unlocked) lockedReason = `Requires ${ship.requiredBuildingName} LVL ${ship.requiredLevel}.`
  else if (queueActive) lockedReason = 'Fabrication queue occupied.'
  else if (!affordable(quantity)) lockedReason = 'Insufficient resources.'

  return (
    <Panel grid className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center border border-concord/30 bg-concord/10 clip-panel-sm">
            <Icon className="size-5 text-concord" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold tracking-wide text-text">{ship.name}</h3>
            <p className="font-mono text-[0.65rem] text-text-faint">In hangar: {ship.count}</p>
          </div>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-text-dim">{ship.description}</p>

      <div className="grid grid-cols-3 gap-2 border-y border-panel-border/60 py-2 text-center">
        <div>
          <p className="font-display text-[0.6rem] uppercase tracking-wide text-text-faint">Atk</p>
          <p className="font-mono text-xs tabular-nums text-obsidian">{ship.attack}</p>
        </div>
        <div>
          <p className="font-display text-[0.6rem] uppercase tracking-wide text-text-faint">Def</p>
          <p className="font-mono text-xs tabular-nums text-concord">{ship.defense}</p>
        </div>
        <div>
          <p className="font-display text-[0.6rem] uppercase tracking-wide text-text-faint">Cargo</p>
          <p className="font-mono text-xs tabular-nums text-alloy">{ship.cargo}</p>
        </div>
      </div>

      <ResourceCostRow
        cost={{
          energy: (ship.cost.energy ?? 0) * quantity,
          alloy: (ship.cost.alloy ?? 0) * quantity,
          crystal: (ship.cost.crystal ?? 0) * quantity,
        }}
      />

      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          max={50}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
          className="w-20 border-panel-border bg-slate-950/60 text-center font-mono text-text"
          disabled={!ship.unlocked || queueActive}
        />
        <ChevronButton
          variant="concord"
          locked={locked}
          lockedReason={lockedReason}
          onClick={() => onFabricate?.(ship.id, quantity)}
          className="flex-1"
        >
          Fabricate
        </ChevronButton>
      </div>
    </Panel>
  )
}
