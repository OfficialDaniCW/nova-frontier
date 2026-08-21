import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ResourceType = 'energy' | 'alloy' | 'crystal'

export const RESOURCE_META: Record<
  ResourceType,
  { label: string; textClass: string; borderClass: string; bgClass: string }
> = {
  energy: {
    label: 'Energy',
    textClass: 'text-concord',
    borderClass: 'border-concord/40',
    bgClass: 'bg-concord/10',
  },
  alloy: {
    label: 'Alloy',
    textClass: 'text-alloy',
    borderClass: 'border-alloy/40',
    bgClass: 'bg-alloy/10',
  },
  crystal: {
    label: 'Crystal',
    textClass: 'text-crystal',
    borderClass: 'border-crystal/40',
    bgClass: 'bg-crystal/10',
  },
}

interface ResourcePillProps {
  type: ResourceType
  icon: LucideIcon
  value: number | string
  rate?: number
  className?: string
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(Math.floor(n))
}

/** A coloured resource chip: icon + current value + optional /s rate. */
export function ResourcePill({ type, icon: Icon, value, rate, className }: ResourcePillProps) {
  const meta = RESOURCE_META[type]
  return (
    <div
      className={cn(
        'clip-chevron-sm flex items-center gap-2 border px-3 py-1.5',
        meta.borderClass,
        meta.bgClass,
        className,
      )}
    >
      <Icon className={cn('size-4 shrink-0', meta.textClass)} aria-hidden="true" />
      <span className="sr-only">{meta.label}</span>
      <span className="font-mono text-sm font-medium text-text tabular-nums">
        {typeof value === 'number' ? formatNumber(value) : value}
      </span>
      {typeof rate === 'number' && (
        <span className="font-mono text-[0.65rem] text-text-faint tabular-nums">
          {rate >= 0 ? '+' : ''}
          {formatNumber(rate)}/s
        </span>
      )}
    </div>
  )
}

interface ResourceCostRowProps {
  cost: { energy?: number; alloy?: number; crystal?: number }
  className?: string
}

/** Compact cost row: three coloured pill icons + amounts. */
export function ResourceCostRow({ cost, className }: ResourceCostRowProps) {
  const entries = (
    [
      { type: 'energy', amount: cost.energy ?? 0 },
      { type: 'alloy', amount: cost.alloy ?? 0 },
      { type: 'crystal', amount: cost.crystal ?? 0 },
    ] satisfies { type: ResourceType; amount: number }[]
  ).filter((e) => e.amount > 0)

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {entries.map((e) => {
        const meta = RESOURCE_META[e.type]
        return (
          <span
            key={e.type}
            className={cn(
              'flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[0.65rem] tabular-nums',
              meta.borderClass,
              meta.bgClass,
              meta.textClass,
            )}
          >
            <span className={cn('size-1.5 rounded-full', meta.textClass, 'bg-current')} />
            {formatNumber(e.amount)}
          </span>
        )
      })}
    </div>
  )
}
