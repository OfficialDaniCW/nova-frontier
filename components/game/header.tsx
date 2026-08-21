import Link from 'next/link'
import { Gem, Hexagon, Layers, Zap } from 'lucide-react'
import { ResourcePill } from '@/components/game/resource-pill'
import { colonyInfo, resourceState } from '@/lib/game-data'

export function GameHeader() {
  return (
    <header className="border-b border-panel-border/60 bg-slate-950/70 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/play/colony" className="flex items-center gap-2">
          <Hexagon className="size-5 text-concord" strokeWidth={1.5} aria-hidden="true" />
          <span className="font-display text-sm font-bold uppercase tracking-[0.15em] text-text">
            Nova <span className="text-concord">Frontier</span>
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <ResourcePill type="energy" icon={Zap} value={resourceState.energy} rate={resourceState.energyRate} />
          <ResourcePill type="alloy" icon={Layers} value={resourceState.alloy} rate={resourceState.alloyRate} />
          <ResourcePill type="crystal" icon={Gem} value={resourceState.crystal} rate={resourceState.crystalRate} />
        </div>

        <div className="flex items-center gap-2 border border-panel-border bg-slate-950/60 px-3 py-1.5 clip-chevron-sm">
          <span className="font-display text-[0.65rem] uppercase tracking-wide text-text-faint">
            {colonyInfo.name}
          </span>
          <span className="h-3 w-px bg-panel-border" aria-hidden="true" />
          <span className="font-mono text-sm tabular-nums text-text">
            {new Intl.NumberFormat('en-US').format(colonyInfo.score)}
          </span>
          <span className="font-display text-[0.6rem] uppercase tracking-wide text-text-faint">score</span>
        </div>
      </div>
    </header>
  )
}
