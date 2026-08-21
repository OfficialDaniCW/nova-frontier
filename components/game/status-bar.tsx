import { Radio, ShieldCheck, Signal } from 'lucide-react'

interface StatusBarProps {
  sector: string
  colonyName: string
}

/**
 * Fixed console footer rail — the bottom edge of the command console.
 * Displays ambient telemetry (region, link integrity, defense grid) so
 * the play surface reads as a live station rather than a web page.
 */
export function StatusBar({ sector, colonyName }: StatusBarProps) {
  return (
    <footer className="sticky bottom-0 z-40 border-t border-panel-border/60 bg-slate-950/80 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 overflow-x-auto px-4 py-1.5 font-mono text-[0.65rem] uppercase tracking-wide text-text-faint sm:px-6">
        <div className="flex items-center gap-4">
          <span className="flex shrink-0 items-center gap-1.5">
            <Signal className="size-3 text-concord" aria-hidden="true" />
            <span className="text-text-dim">Region</span>
            <span className="text-text">{sector}</span>
          </span>
          <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
            <Radio className="size-3 text-alloy" aria-hidden="true" />
            <span className="text-text-dim">Command</span>
            <span className="text-text">{colonyName}</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden shrink-0 items-center gap-1.5 md:flex">
            <ShieldCheck className="size-3 text-bloom" aria-hidden="true" />
            <span className="text-text-dim">Defense grid</span>
            <span className="text-bloom">Online</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="status-dot size-1.5 rounded-full bg-concord" aria-hidden="true" />
            <span className="text-concord">Concord net</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
