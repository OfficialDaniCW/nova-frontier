import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATES = [
  {
    tag: 'Default',
    className: 'border border-panel-border bg-slate-950/60 text-text',
  },
  {
    tag: 'Hover',
    className:
      'border border-concord bg-concord/10 text-concord shadow-[0_0_18px_-2px_var(--concord)] hazard-stripe [background-blend-mode:normal]',
  },
  {
    tag: 'Clicked',
    className: 'border border-concord bg-concord text-void font-semibold',
  },
  {
    tag: 'Locked',
    className: 'border border-panel-border/40 bg-slate-950/30 text-text-faint opacity-55',
  },
] as const

/**
 * Static reference showing all four explicitly-designed button states —
 * default, hover, clicked/active, and locked — side by side rather than
 * relying on interaction to reveal them.
 */
export function ButtonStatesDemo() {
  return (
    <div className="flex flex-wrap gap-4">
      {STATES.map((s) => (
        <div key={s.tag} className="flex flex-col items-center gap-2">
          <span className="font-mono text-[0.6rem] uppercase tracking-wide text-text-faint">
            {s.tag}
          </span>
          <span
            className={cn(
              'clip-chevron flex items-center gap-2 px-5 py-2.5 font-display text-xs uppercase tracking-wide',
              s.className,
            )}
          >
            {s.tag === 'Locked' && <Lock className="size-3" aria-hidden="true" />}
            Upgrade
          </span>
        </div>
      ))}
    </div>
  )
}
