import { Rocket } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { ChevronButton } from '@/components/game/chevron-button'
import { ResourceCostRow } from '@/components/game/resource-pill'
import { StatBar } from '@/components/game/stat-bar'

const RULER = ['30', '20', '10', '00', '10', '20', '30']

/**
 * Unit spec sheet: product-showcase archetype (index tag, corner brackets,
 * hero centrepiece, stat rows, and a ruler strip) applied to a Nova
 * Frontier fleet unit card.
 */
export function SpecSheet() {
  return (
    <Panel grid scanline className="bracketed p-7">
      <span className="corner corner-tl" aria-hidden="true" />
      <span className="corner corner-tr" aria-hidden="true" />
      <span className="corner corner-bl" aria-hidden="true" />
      <span className="corner corner-br" aria-hidden="true" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="border border-concord/40 px-2.5 py-1 font-mono text-[0.65rem] text-concord">
          UNIT · 03 / 09
        </span>
        <span className="font-mono text-[0.65rem] text-text-faint">NF-2.1 · SHIPYARD LV.4+</span>
      </div>

      <div className="mt-6 grid gap-8 sm:grid-cols-[1fr_260px] sm:items-center">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Rocket
            className="size-14 text-concord drop-shadow-[0_0_20px_rgba(103,232,249,0.5)]"
            strokeWidth={1.25}
            aria-hidden="true"
          />
          <h3 className="font-display text-xl font-semibold text-text">Strike Cruiser</h3>
          <p className="max-w-[220px] font-mono text-[0.65rem] text-text-faint">
            Main battle line vessel. Backbone of any serious fleet.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <StatBar label="Attack" value={55} color="obsidian" />
          <StatBar label="Defence" value={42} color="concord" />
          <StatBar label="Cargo" value={50} displayValue={500} color="crystal" />
          <ResourceCostRow cost={{ energy: 620, alloy: 520, crystal: 160 }} className="mt-1" />
          <ChevronButton variant="concord" className="mt-1 w-full">
            Deploy Unit
          </ChevronButton>
        </div>
      </div>

      <div className="mt-7 flex justify-between border-t border-panel-border pt-3 font-mono text-[0.6rem] text-text-faint">
        {RULER.map((mark, i) => (
          <span key={i} className={mark === '00' ? 'text-concord' : undefined}>
            {mark}
          </span>
        ))}
      </div>
    </Panel>
  )
}
