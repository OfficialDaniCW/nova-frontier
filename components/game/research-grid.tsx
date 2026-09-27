'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ResearchCard, type ResearchCardDef } from '@/components/game/research-card'
import { QueuePanel } from '@/components/game/queue-panel'
import { upgradeResearch } from '@/app/actions/research'
import { RESEARCH_DEFS, getBuildingDef, researchCostAtLevel, researchTimeAtLevel } from '@/lib/game/definitions'
import { canAfford } from '@/lib/game/resources'

interface ResearchRow {
  techId: string
  level: number
  queuedLevel: number | null
  queueStartedAt: string | null
  queueEtaAt: string | null
}

interface BuildingRow {
  buildingType: string
  level: number
}

interface ResearchGridProps {
  researchRows: ResearchRow[]
  buildingRows: BuildingRow[]
  resources: { energy: number; alloy: number; crystal: number }
}

export function ResearchGrid({ researchRows, buildingRows, resources }: ResearchGridProps) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const queuedRow = researchRows.find((r) => r.queuedLevel != null)
  const queueActive = Boolean(queuedRow)
  const queuedDef = queuedRow ? RESEARCH_DEFS.find((d) => d.id === queuedRow.techId) : undefined

  async function handleResearch(techId: string) {
    setPending(techId)
    try {
      await upgradeResearch(techId)
      toast.success('Research queued')
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to queue research')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {queuedRow && queuedDef && queuedRow.queueStartedAt && queuedRow.queueEtaAt && (
        <QueuePanel
          label="Research queue"
          itemName={`${queuedDef.name} → LVL ${queuedRow.queuedLevel}`}
          etaMs={new Date(queuedRow.queueEtaAt).getTime()}
          startedAtMs={new Date(queuedRow.queueStartedAt).getTime()}
          accent="crystal"
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RESEARCH_DEFS.map((def) => {
          const row = researchRows.find((r) => r.techId === def.id)
          const level = row?.level ?? 0
          const targetLevel = level + 1
          const cost = researchCostAtLevel(def, targetLevel)
          const reqBuilding = buildingRows.find((b) => b.buildingType === def.requiresBuilding.id)
          const unlocked = (reqBuilding?.level ?? 0) >= def.requiresBuilding.level
          const affordable = canAfford(resources, cost)

          const lockedBySibling = def.exclusiveGroup
            ? RESEARCH_DEFS.find((sibling) => {
                if (sibling.exclusiveGroup !== def.exclusiveGroup || sibling.id === def.id) return false
                const siblingRow = researchRows.find((r) => r.techId === sibling.id)
                return (siblingRow?.level ?? 0) > 0
              })
            : undefined

          const cardDef: ResearchCardDef = {
            id: def.id,
            name: def.name,
            description: def.description,
            icon: def.icon,
            effect: def.effect,
            level,
            maxLevel: def.maxLevel,
            cost,
            timeSec: researchTimeAtLevel(def, targetLevel),
            unlocked,
            requiredLevel: def.requiresBuilding.level,
            requiredBuildingName: getBuildingDef(def.requiresBuilding.id).name,
            lockedByDoctrine: lockedBySibling?.name,
            isFirstDoctrineCommit: Boolean(def.exclusiveGroup) && level === 0,
          }

          return (
            <ResearchCard
              key={def.id}
              tech={cardDef}
              queueActive={queueActive || pending === def.id}
              affordable={affordable}
              onResearch={handleResearch}
            />
          )
        })}
      </div>
    </div>
  )
}
