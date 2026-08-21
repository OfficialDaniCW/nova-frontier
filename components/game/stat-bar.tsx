import { cn } from '@/lib/utils'

export type StatColor = 'concord' | 'alloy' | 'crystal' | 'obsidian' | 'kessler' | 'hollow' | 'bloom'

const STAT_COLOR_VAR: Record<StatColor, string> = {
  concord: 'var(--concord)',
  alloy: 'var(--alloy)',
  crystal: 'var(--crystal)',
  obsidian: 'var(--obsidian)',
  kessler: 'var(--kessler)',
  hollow: 'var(--hollow)',
  bloom: 'var(--bloom)',
}

const STAT_COLOR_TEXT: Record<StatColor, string> = {
  concord: 'text-concord',
  alloy: 'text-alloy',
  crystal: 'text-crystal',
  obsidian: 'text-obsidian',
  kessler: 'text-kessler',
  hollow: 'text-hollow',
  bloom: 'text-bloom',
}

interface StatBarProps {
  label: string
  value: number
  max?: number
  color?: StatColor
  segments?: number
  /** Show the raw numeric value instead of a max-relative label. */
  displayValue?: string | number
  className?: string
}

/** A labelled, segmented stat readout using a repeating-gradient fill. */
export function StatBar({
  label,
  value,
  max = 100,
  color = 'concord',
  segments = 12,
  displayValue,
  className,
}: StatBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const colorVar = STAT_COLOR_VAR[color]

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between">
        <span className="font-display text-[0.65rem] uppercase tracking-wide text-text-dim">
          {label}
        </span>
        <span className={cn('font-mono text-xs tabular-nums', STAT_COLOR_TEXT[color])}>
          {displayValue ?? value}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-none border border-panel-border bg-slate-950/60">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundImage: `repeating-linear-gradient(90deg, ${colorVar} 0px, ${colorVar} ${
              100 / segments
            }%, transparent ${100 / segments}%, transparent ${200 / segments}%)`,
            backgroundColor: colorVar,
            opacity: 0.9,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, transparent 0, transparent calc(${100 / segments}% - 1px), rgb(2 6 23 / 0.9) calc(${100 / segments}% - 1px), rgb(2 6 23 / 0.9) ${100 / segments}%)`,
          }}
        />
      </div>
    </div>
  )
}
