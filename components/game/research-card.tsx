'use client'

import type { LucideIcon } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { ChevronButton } from '@/components/game/chevron-button'
import { ResourceCostRow } from '@/components/game/resource-pill'
import type { Cost } from '@/lib/game/definitions'

export interface ResearchCardDef {
  id: string
  name: string
  description: string
  icon: LucideIcon
  effect: string
  level: number
  maxLevel: number
  cost: Cost
  timeSec: number
  unlocked: boolean
  requiredLevel: number
  requiredBuildingName: string
}

interface ResearchCardProps {
  tech: ResearchCardDef
  queueActive: boolean
  affordable: boolean
  onResearch?: (id: string) => void
}

export function ResearchCard({ tech, queueActive, affordable, onResearch }: ResearchCardProps) {
  const Icon = tech.icon
  const atMax = tech.level >= tech.maxLevel
  const locked = !tech.unlocked || atMax || !affordable || queueActive

  let lockedReason: string | undefined
  if (!tech.unlocked) lockedReason = `Requires ${tech.requiredBuildingName} LVL ${tech.requiredLevel}.`
  else if (atMax) lockedReason = 'Maximum level reached.'
  else if (queueActive) lockedReason = 'Research queue occupied.'
  else if (!affordable) lockedReason = 'Insufficient resources.'

  return (
    <Panel grid className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center border border-crystal/30 bg-crystal/10 clip-panel-sm">
            <Icon className="size-5 text-crystal" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold tracking-wide text-text">{tech.name}</h3>
            <p className="font-mono text-[0.65rem] text-text-faint">
              LVL {tech.level.toString().padStart(2, '0')} / {tech.maxLevel}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-text-dim">{tech.description}</p>

      <div className="flex items-center justify-between border-y border-panel-border/60 py-2">
        <span className="font-display text-[0.65rem] uppercase tracking-wide text-text-faint">Effect</span>
        <span className="font-mono text-xs text-crystal">{tech.effect}</span>
      </div>

      <ResourceCostRow cost={tech.cost} />

      <ChevronButton
        variant="crystal"
        locked={locked}
        lockedReason={lockedReason}
        onClick={() => onResearch?.(tech.id)}
        className="w-full"
      >
        Research
      </ChevronButton>
    </Panel>
  )
}
