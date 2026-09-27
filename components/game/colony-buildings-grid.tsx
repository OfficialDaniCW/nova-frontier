'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { BuildingCard, type BuildingCardDef } from '@/components/game/building-card'
import { QueuePanel } from '@/components/game/queue-panel'
import { upgradeBuilding, toggleAutoQueue } from '@/app/actions/colony'
import { BUILDING_DEFS, buildingCostAtLevel, buildingTimeAtLevel } from '@/lib/game/definitions'
import { canAfford } from '@/lib/game/resources'

interface BuildingRow {
  id: string
  buildingType: string
  level: number
  queuedLevel: number | null
  queueStartedAt: string | null
  queueEtaAt: string | null
  autoQueue?: boolean
}

interface ColonyBuildingsGridProps {
  buildingRows: BuildingRow[]
  resources: { energy: number; alloy: number; crystal: number }
}

export function ColonyBuildingsGrid({ buildingRows, resources }: ColonyBuildingsGridProps) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const queuedRow = buildingRows.find((b) => b.queuedLevel != null)
  const queueActive = Boolean(queuedRow)
  const queuedDef = queuedRow ? BUILDING_DEFS.find((d) => d.id === queuedRow.buildingType) : undefined

  async function handleUpgrade(buildingType: string) {
    setPending(buildingType)
    try {
      await upgradeBuilding(buildingType)
      toast.success('Construction queued')
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to queue upgrade')
    } finally {
      setPending(null)
    }
  }

  async function handleToggleAutoQueue(buildingType: string, enabled: boolean) {
    try {
      await toggleAutoQueue(buildingType, enabled)
      toast.success(enabled ? 'Auto-queue enabled' : 'Auto-queue disabled')
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update auto-queue')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {queuedRow && queuedDef && queuedRow.queueStartedAt && queuedRow.queueEtaAt && (
        <QueuePanel
          label="Construction queue"
          itemName={`${queuedDef.name} → LVL ${queuedRow.queuedLevel}`}
          etaMs={new Date(queuedRow.queueEtaAt).getTime()}
          startedAtMs={new Date(queuedRow.queueStartedAt).getTime()}
          accent="concord"
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BUILDING_DEFS.map((def) => {
          const row = buildingRows.find((b) => b.buildingType === def.id)
          const level = row?.level ?? 0
          const targetLevel = level + 1
          const cost = buildingCostAtLevel(def, targetLevel)
          const affordable = canAfford(resources, cost)

          const cardDef: BuildingCardDef = {
            id: def.id,
            name: def.name,
            description: def.description,
            level,
            maxLevel: def.maxLevel,
            buildTimeSec: buildingTimeAtLevel(def, targetLevel),
            cost,
            productionRate: def.productionPerLevel
              ? { resource: def.productionPerLevel.resource, amount: def.productionPerLevel.amount * level }
              : undefined,
            storageCapacity: def.storagePerLevel ? def.storagePerLevel * level : undefined,
            scoreValue: def.scorePerLevel ? def.scorePerLevel * level : undefined,
            autoQueue: row?.autoQueue,
          }

          return (
            <BuildingCard
              key={def.id}
              building={cardDef}
              queueActive={queueActive || pending === def.id}
              affordable={affordable}
              onUpgrade={handleUpgrade}
              onToggleAutoQueue={row ? handleToggleAutoQueue : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}
