'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ShipCard, type ShipCardDef } from '@/components/game/ship-card'
import { QueuePanel } from '@/components/game/queue-panel'
import { fabricateShip } from '@/app/actions/shipyard'
import { SHIP_DEFS, getBuildingDef } from '@/lib/game/definitions'
import { canAfford } from '@/lib/game/resources'

interface ShipRow {
  shipType: string
  count: number
  queuedCount: number | null
  queueStartedAt: string | null
  queueEtaAt: string | null
}

interface BuildingRow {
  buildingType: string
  level: number
}

interface FabricationGridProps {
  shipRows: ShipRow[]
  buildingRows: BuildingRow[]
  resources: { energy: number; alloy: number; crystal: number }
}

export function FabricationGrid({ shipRows, buildingRows, resources }: FabricationGridProps) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const queuedRow = shipRows.find((s) => s.queuedCount != null)
  const queueActive = Boolean(queuedRow)
  const queuedDef = queuedRow ? SHIP_DEFS.find((d) => d.id === queuedRow.shipType) : undefined

  async function handleFabricate(shipType: string, quantity: number) {
    setPending(shipType)
    try {
      await fabricateShip(shipType, quantity)
      toast.success('Fabrication queued')
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to queue fabrication')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {queuedRow && queuedDef && queuedRow.queueStartedAt && queuedRow.queueEtaAt && (
        <QueuePanel
          label="Fabrication queue"
          itemName={`${queuedDef.name}`}
          quantity={queuedRow.queuedCount ?? undefined}
          etaMs={new Date(queuedRow.queueEtaAt).getTime()}
          startedAtMs={new Date(queuedRow.queueStartedAt).getTime()}
          accent="alloy"
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SHIP_DEFS.map((def) => {
          const row = shipRows.find((s) => s.shipType === def.id)
          const reqBuilding = buildingRows.find((b) => b.buildingType === def.requiresBuilding.id)
          const unlocked = (reqBuilding?.level ?? 0) >= def.requiresBuilding.level

          const cardDef: ShipCardDef = {
            id: def.id,
            name: def.name,
            description: def.description,
            icon: def.icon,
            count: row?.count ?? 0,
            attack: def.attack,
            defense: def.defense,
            cargo: def.cargo,
            cost: def.cost,
            buildTimeSec: def.buildTimeSec,
            unlocked,
            requiredLevel: def.requiresBuilding.level,
            requiredBuildingName: getBuildingDef(def.requiresBuilding.id).name,
          }

          return (
            <ShipCard
              key={def.id}
              ship={cardDef}
              queueActive={queueActive || pending === def.id}
              affordable={(quantity) =>
                canAfford(resources, {
                  energy: (def.cost.energy ?? 0) * quantity,
                  alloy: (def.cost.alloy ?? 0) * quantity,
                  crystal: (def.cost.crystal ?? 0) * quantity,
                })
              }
              onFabricate={handleFabricate}
            />
          )
        })}
      </div>
    </div>
  )
}
