import type { Metadata } from 'next'
import { Gem, Hexagon, Layers, Zap } from 'lucide-react'
import { StyleGuideSectorGrid } from '@/components/game/style-guide-sector-grid'
import { Panel } from '@/components/game/panel'
import { ChevronButton } from '@/components/game/chevron-button'
import { ResourcePill, ResourceCostRow } from '@/components/game/resource-pill'
import { StatBar } from '@/components/game/stat-bar'
import { QueuePanel } from '@/components/game/queue-panel'
import { BuildingCard } from '@/components/game/building-card'
import { FactionCard } from '@/components/game/faction-card'
import { ButtonStatesDemo } from '@/components/game/button-states-demo'
import { SpecSheet } from '@/components/game/spec-sheet'
import { DossierCard } from '@/components/game/dossier-card'
import { buildings, sectors, activeConstruction } from '@/lib/game-data'

export const metadata: Metadata = {
  title: 'Style Guide — Nova Frontier',
  description: 'Design tokens, shapes, and component reference for the Nova Frontier UI system.',
}

const SWATCHES = [
  { name: 'Void', hex: '#020617 · slate-950', varClass: 'bg-void' },
  { name: 'Panel', hex: '#0f172a · slate-900/60', varClass: 'bg-slate-900' },
  { name: 'Concord', hex: '#67e8f9 · cyan-300', varClass: 'bg-concord' },
  { name: 'Alloy', hex: '#fcd34d · amber-300', varClass: 'bg-alloy' },
  { name: 'Crystal', hex: '#f0abfc · fuchsia-300', varClass: 'bg-crystal' },
  { name: 'Kessler Remnant', hex: '#cbd5e1 · slate-300', varClass: 'bg-kessler' },
  { name: 'Obsidian Vanguard', hex: '#fda4af · rose-300', varClass: 'bg-obsidian' },
  { name: 'Hollow Choir', hex: '#d8b4fe · violet-300', varClass: 'bg-hollow' },
  { name: 'The Bloom', hex: '#9fef5b · deliberate outlier', varClass: 'bg-bloom' },
]

function SectionHead({ title, description, accent }: { title: string; description: string; accent?: string }) {
  return (
    <div className="mb-7 flex items-start gap-3.5">
      <div className={`h-8 w-1 shrink-0 ${accent ?? 'bg-concord'} opacity-60`} aria-hidden="true" />
      <div>
        <h2 className="font-display text-xl text-text">{title}</h2>
        <p className="mt-0.5 max-w-2xl text-[0.8rem] leading-relaxed text-text-dim">{description}</p>
      </div>
    </div>
  )
}

export default function StyleGuidePage() {
  const reactor = buildings.find((b) => b.id === 'fusion-reactor')!
  const kesslerSector = sectors.find((s) => s.faction === 'kessler')!
  const hollowSector = sectors.find((s) => s.faction === 'hollow')!
  const bloomSector = sectors.find((s) => s.faction === 'bloom')!

  return (
    <div className="relative min-h-screen bg-void">
      <div
        className="pointer-events-none fixed inset-0 opacity-100"
        style={{
          backgroundImage:
            'linear-gradient(rgb(103 232 249 / 4.5%) 1px, transparent 1px), linear-gradient(90deg, rgb(103 232 249 / 4.5%) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }}
        aria-hidden="true"
      />

      <header className="scanline-overlay sticky top-0 z-10 border-b border-concord/20 bg-slate-950/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center border border-concord/40 bg-concord/10 text-concord">
              <Hexagon className="size-4" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display text-sm text-concord">Nova Frontier</p>
              <p className="font-mono text-[0.6rem] text-text-faint">Style Guide · v1.0</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ResourcePill type="energy" icon={Zap} value={4200} />
            <ResourcePill type="alloy" icon={Layers} value={3100} />
            <ResourcePill type="crystal" icon={Gem} value={980} />
          </div>
        </div>
      </header>

      <main className="relative z-[1] mx-auto max-w-5xl px-6 pb-24">
        {/* Hero */}
        <section className="py-16 text-center">
          <p className="mb-3.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-text-faint">
            Halcyon Verge · Epoch 1
          </p>
          <h1 className="text-balance font-display text-4xl font-semibold text-text sm:text-5xl">
            Claim it. Hold it. <span className="text-concord">Or lose it.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-sm leading-relaxed text-text-dim">
            A living style reference for Nova Frontier: every colour, typeface, panel shape, and
            component pattern the game&apos;s UI is built from, in one page.
          </p>
        </section>

        {/* Tokens */}
        <section className="mt-16">
          <SectionHead
            title="Design tokens"
            description="The palette and type system every screen draws from. Reference these Tailwind design tokens, don't hardcode hex values downstream."
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SWATCHES.map((s) => (
              <div key={s.name} className="border border-panel-border bg-panel">
                <div className={`h-14 ${s.varClass}`} aria-hidden="true" />
                <div className="px-3 py-2.5">
                  <p className="font-display text-xs text-text">{s.name}</p>
                  <p className="mt-0.5 font-mono text-[0.6rem] text-text-faint">{s.hex}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-5">
            <div>
              <p className="mb-1 font-mono text-[0.6rem] uppercase tracking-wide text-text-faint">
                Display · Chakra Petch
              </p>
              <p className="font-display text-2xl text-text">Command Spire, Level 7</p>
            </div>
            <div>
              <p className="mb-1 font-mono text-[0.6rem] uppercase tracking-wide text-text-faint">
                Body · Inter
              </p>
              <p className="text-sm leading-relaxed text-text-dim">
                Coordinates every system on the colony. Higher levels shorten all construction and
                production queues.
              </p>
            </div>
            <div>
              <p className="mb-1 font-mono text-[0.6rem] uppercase tracking-wide text-text-faint">
                Mono / HUD · JetBrains Mono
              </p>
              <p className="font-mono text-sm text-concord">07:15:02 · DEF 420 · ETA 04m 12s</p>
            </div>
          </div>
        </section>

        {/* Factions */}
        <section className="mt-20">
          <SectionHead
            title="Factions"
            description="Three fractured pieces of one dead intelligence, and the thing it was built to contain."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FactionCard
              faction="kessler"
              role="Scavenger fragment"
              description="Weakest defence, highest loot. Automated haulers still salvaging their own dead battlegroups."
            />
            <FactionCard
              faction="obsidian"
              role="Militarised fragment"
              description="Hits back. Striking a Vanguard sector risks a retaliation raid on your homeworld."
            />
            <FactionCard
              faction="hollow"
              role="Signal-cult fragment"
              description="Cloaked. True defence stays hidden as an approximate range without Targeting Matrix 2."
            />
            <FactionCard
              faction="bloom"
              role="Primordial threat"
              description="Not a fragment of anything. The thing the Wardenate was built to contain."
            />
          </div>
        </section>

        {/* Shape rule */}
        <section className="mt-20">
          <SectionHead
            title="The shape rule"
            description="The one rule that governs every future screen: clean geometry belongs to order, irregular organic shapes belong to the Bloom, so a corrupted sector reads as wrong before you even read the label."
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="scanline-overlay clip-panel flex min-h-[220px] flex-col justify-between border border-concord/30 bg-panel p-6">
              <div>
                <p className="font-mono text-[0.65rem] uppercase tracking-wide text-concord">
                  Concord &amp; Fireholder fragments
                </p>
                <h3 className="mt-2 font-display text-xl text-concord">Order</h3>
                <p className="mt-2.5 text-[0.8rem] leading-relaxed text-text-dim">
                  Angular, clipped corners, straight dividers. Every Concord panel and all three
                  Fireholder faction markers use this language.
                </p>
              </div>
              <p className="font-mono text-[0.65rem] text-text-faint">clip-path: polygon(...)</p>
            </div>
            <div className="clip-bloom bloom-pulse relative flex min-h-[220px] flex-col items-center justify-center gap-3 border border-bloom/35 bg-gradient-to-br from-bloom/10 to-panel px-12 py-10 text-center">
              <p className="font-mono text-[0.65rem] uppercase tracking-wide text-bloom">
                The Bloom
              </p>
              <h3 className="font-display text-xl text-bloom">Corruption</h3>
              <p className="max-w-[240px] text-[0.8rem] leading-relaxed text-bloom/80">
                Soft, asymmetric, slowly warping borders. A vein-like pulsing glow instead of a
                clean edge.
              </p>
              <p className="mt-1 max-w-[220px] font-mono text-[0.6rem] leading-relaxed text-bloom/70">
                border-radius: 62% 38% 55% 45%
              </p>
            </div>
          </div>
        </section>

        {/* Sector card demo */}
        <section className="mt-20">
          <SectionHead
            title="Sector card, applied"
            description="The same rule applied to a real star chart component: normal sectors next to a Bloom-infected one."
          />
          <StyleGuideSectorGrid
            sectors={[kesslerSector, hollowSector, bloomSector]}
          />
        </section>

        {/* Component kit */}
        <section className="mt-20">
          <SectionHead
            title="Component kit"
            description="Buttons, resource pills, queue progress, and a building card — the reusable pieces every screen is assembled from."
          />

          <div className="flex flex-col gap-8">
            <div>
              <h3 className="mb-3 font-display text-xs uppercase tracking-wide text-text-dim">
                Buttons
              </h3>
              <div className="flex flex-wrap gap-2.5">
                <ChevronButton variant="concord">Upgrade</ChevronButton>
                <ChevronButton variant="alloy">Cancel</ChevronButton>
                <ChevronButton variant="obsidian">Launch Attack</ChevronButton>
                <ChevronButton variant="bloom">Cleanse Sector</ChevronButton>
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-display text-xs uppercase tracking-wide text-text-dim">
                Resource cost row
              </h3>
              <ResourceCostRow cost={{ energy: 620, alloy: 480, crystal: 240 }} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 font-display text-xs uppercase tracking-wide text-text-dim">
                  Queue progress
                </h3>
                <QueuePanel
                  label="Construction in progress"
                  itemName={activeConstruction.buildingName}
                  etaMs={activeConstruction.etaMs}
                  startedAtMs={activeConstruction.startedAtMs}
                />
              </div>
              <div>
                <h3 className="mb-3 font-display text-xs uppercase tracking-wide text-text-dim">
                  Building card
                </h3>
                <BuildingCard building={reactor} queueActive={false} />
              </div>
            </div>
          </div>
        </section>

        {/* Patterns note */}
        <section className="mt-20">
          <SectionHead
            accent="bg-crystal"
            title="Patterns from reference study"
            description="Four components below adopt structural patterns from reference study: fully-specified button states, a grid-textured chamfer shape, a product-spec-sheet layout, and an ID-card persona treatment. Colours and copy are Nova Frontier's own; the techniques are borrowed on purpose."
          />
        </section>

        {/* Button states */}
        <section className="mt-16">
          <SectionHead
            title="Button states, fully specified"
            description="Our previous kit only defined a default and a hover. Four explicit states — including locked — cover every gated action in Nova Frontier: an unmet building requirement, an unresearched tech."
          />
          <ButtonStatesDemo />
        </section>

        {/* Spec sheet */}
        <section className="mt-20">
          <SectionHead
            title="Spec sheet"
            description="The product-showcase archetype — index tag, corner brackets, hero centrepiece, ruler strip — applied to a Nova Frontier unit card."
          />
          <SpecSheet />
        </section>

        {/* Dossier */}
        <section className="mt-20">
          <SectionHead
            title="Governor dossier card"
            description="Persona cards designed as overlapping ID cards, retargeted at a Concord governor profile. A good fit for a Compact roster or leaderboard entry."
          />
          <div className="relative flex flex-col gap-4 sm:min-h-[260px] sm:gap-0">
            <DossierCard
              name="Governor Vess Orlan"
              meta="Sector 07 · Nova-1 · Score 18,420"
              traits={['Expansionist', 'Obsidian rival']}
              about="Cleared three Kessler Remnant sectors in a single Epoch. Known for over-committing fleets to Cleansing Operations."
              goal="hold the Deep Verge border unaided."
              accentClass="text-concord"
              borderClass="border-concord/45"
              rotateClass="sm:absolute sm:top-0 sm:left-0 sm:-rotate-3 sm:z-[2]"
            />
            <DossierCard
              name="Governor Ira Seth"
              meta="Sector 07 · Resonance Hold · Score 12,905"
              traits={['Trader', 'Compact founder']}
              about="Runs the largest active market order book in the Verge. Rarely fights, rarely loses what she builds."
              goal="fund the next Cleansing Array from trade alone."
              accentClass="text-crystal"
              borderClass="border-crystal/40"
              rotateClass="sm:absolute sm:top-14 sm:left-52 sm:rotate-3 sm:z-[1]"
            />
          </div>
        </section>
      </main>

      <footer className="relative z-[1] border-t border-panel-border px-6 py-7 text-center font-mono text-[0.65rem] text-text-faint">
        Reference implementation for the Nova Frontier design system. Colours and shapes here are
        the literal source of truth for downstream builds.
      </footer>
    </div>
  )
}
