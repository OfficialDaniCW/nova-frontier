'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Zap, Layers, Gem, Scale } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { setResourcePriority } from '@/app/actions/colony'
import { RESOURCE_PRIORITY_DEFS, type ResourcePriority } from '@/lib/game/definitions'
import { InfoTooltip } from '@/components/game/info-tooltip'
import { cn } from '@/lib/utils'

const PRIORITY_ICON = {
  balanced: Scale,
  energy: Zap,
  alloy: Layers,
  crystal: Gem,
} as const

const PRIORITY_ACCENT: Record<ResourcePriority, string> = {
  balanced: 'text-text-dim border-panel-border',
  energy: 'text-concord border-concord/50',
  alloy: 'text-alloy border-alloy/50',
  crystal: 'text-crystal border-crystal/50',
}

interface ResourcePriorityDialProps {
  current: ResourcePriority
}

export function ResourcePriorityDial({ current }: ResourcePriorityDialProps) {
  const router = useRouter()
  const [pending, setPending] = useState<ResourcePriority | null>(null)
  const [, startTransition] = useTransition()

  async function handleSelect(priority: ResourcePriority) {
    if (priority === current) return
    setPending(priority)
    try {
      await setResourcePriority(priority)
      toast.success('Resource priority updated')
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update priority')
    } finally {
      setPending(null)
    }
  }

  return (
    <Panel grid className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-xs font-semibold uppercase tracking-wide text-text-faint">
          Resource Priority
        </h2>
        <InfoTooltip label="What does Resource Priority do?">
          Reweights your colony&apos;s production toward one resource at the expense of the other
          two. Switch anytime — it takes effect on the next tick, no downtime.
        </InfoTooltip>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {RESOURCE_PRIORITY_DEFS.map((def) => {
          const Icon = PRIORITY_ICON[def.id]
          const active = def.id === current
          const busy = pending === def.id
          return (
            <button
              key={def.id}
              type="button"
              disabled={busy}
              onClick={() => handleSelect(def.id)}
              title={def.description}
              className={cn(
                'flex flex-col items-center gap-1.5 border bg-slate-950/50 px-2 py-3 text-center transition-colors clip-panel-sm',
                'disabled:cursor-not-allowed disabled:opacity-60',
                active
                  ? PRIORITY_ACCENT[def.id]
                  : 'border-panel-border text-text-faint hover:border-panel-border hover:text-text-dim',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="font-display text-[0.65rem] font-semibold uppercase tracking-wide">
                {def.name}
              </span>
              <span className="font-mono text-[0.6rem] leading-tight text-text-faint">
                {def.description}
              </span>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
