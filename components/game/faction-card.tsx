import { cn } from '@/lib/utils'
import { FACTION_META } from '@/lib/faction-meta'
import type { Faction } from '@/lib/game-data'

interface FactionCardProps {
  faction: Faction
  role: string
  description: string
  className?: string
}

/**
 * Faction identity card: angular clip-panel for the three Fireholder
 * fragments, and the organic clip-bloom shape (with a slow morph and
 * pulsing vein glow) for The Bloom — the one deliberate departure from
 * the clean-geometry rule.
 */
export function FactionCard({ faction, role, description, className }: FactionCardProps) {
  const meta = FACTION_META[faction]
  const Icon = meta.icon
  const isBloom = faction === 'bloom'

  return (
    <div
      className={cn(
        'relative flex flex-col gap-2 border p-5',
        isBloom ? 'clip-bloom bloom-pulse' : 'clip-panel',
        meta.borderClass,
        meta.bgClass,
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('size-4 shrink-0', meta.textClass)} aria-hidden="true" />
        <h3 className={cn('font-display text-base font-semibold', meta.textClass)}>{meta.label}</h3>
      </div>
      <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">{role}</p>
      <p className={cn('text-xs leading-relaxed', isBloom ? 'text-bloom/80' : 'text-text-dim')}>
        {description}
      </p>
    </div>
  )
}
