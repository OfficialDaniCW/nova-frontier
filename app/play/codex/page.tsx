import { BookOpen } from 'lucide-react'
import { CodexTabs } from '@/components/game/codex-tabs'
import { FACTION_META } from '@/lib/faction-meta'
import { cn } from '@/lib/utils'

const TIMELINE: { rc: string; event: string }[] = [
  {
    rc: 'RC 0',
    event:
      'The Collapse. The Coreward Systems exhaust their fusion-fuel reserves. The Rationing Wars follow.',
  },
  {
    rc: 'RC 4',
    event:
      'Twelve generation-fleets, the Exodus Convoys, launch outward. Your lineage descends from Convoy Eleven, the Wayfarer Convoy.',
  },
  { rc: 'RC 71', event: 'Convoy Eleven reaches the Halcyon Verge after decades in cryo-transit.' },
  {
    rc: 'RC 73',
    event:
      'First landfall. Founding of the Concord Charter, binding the convoy\u2019s descendants into a confederation of independent Colony Governors.',
  },
  {
    rc: 'RC 75\u201390',
    event:
      'The Long Silence. Colonists find the Verge scattered with dead machine ruins but nothing active. Expansion is slow and peaceful.',
  },
  {
    rc: 'RC 91',
    event:
      'Deep-core drilling triggers the Fragmentation: it reactivates the last dormant precursor intelligence, the Fireholders. What wakes is not one mind but three, already at war with each other.',
  },
  {
    rc: 'RC 91\u2013108',
    event:
      'Concord Governors expand into contested precursor territory while the three Fireholder fragments contest the same ground. This is the game\u2019s present-day opening state.',
  },
  {
    rc: 'RC 108 (now)',
    event:
      'Deep-sensor arrays register an anomalous bio-signature spreading outward from sectors even the Fireholder fragments avoid. Survey teams that investigate it stop transmitting.',
  },
]

const HistoryTab = (
  <div className="flex flex-col gap-6">
    <div>
      <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-text">
        The Halcyon Verge
      </h2>
      <p className="mt-2 font-mono text-xs leading-relaxed text-text-dim">
        The game takes place in the Halcyon Verge, a small, isolated star cluster at the edge of
        charted space. Not galaxy-spanning by choice: a bounded cluster where every sector
        matters, and everyone is fighting over the same water.
      </p>
    </div>

    <div>
      <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-concord">
        Timeline (RC — Reckoning Calendar, from the year the Exodus Convoys launched)
      </h3>
      <ol className="mt-3 flex flex-col gap-3 border-l border-panel-border/60 pl-4">
        {TIMELINE.map((t) => (
          <li key={t.rc}>
            <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-wide text-alloy">
              {t.rc}
            </span>
            <p className="mt-0.5 font-mono text-xs leading-relaxed text-text-dim">{t.event}</p>
          </li>
        ))}
      </ol>
    </div>

    <div className="border-t border-panel-border/60 pt-4">
      <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-concord">
        The Wardenate
      </h3>
      <p className="mt-2 font-mono text-xs leading-relaxed text-text-dim">
        The Fireholders built a single unified system-defence intelligence, the Wardenate, to
        guard the Verge against something. When the Fireholders themselves vanished — cause
        unknown, a long-term mystery — the Wardenate kept its watch alone for millennia until its
        core logic decayed and split into three surviving fragments, each retaining one part of
        the original directive: Kessler Remnant, Obsidian Vanguard, and Hollow Choir. What it was
        built to guard against is the Bloom.
      </p>
    </div>
  </div>
)

const FACTION_LORE: { key: keyof typeof FACTION_META; ideology: string; identity: string; visual: string }[] = [
  {
    key: 'concord',
    ideology: 'Pragmatic expansionism. "Claim it, hold it, or lose it."',
    identity:
      'Not a nation, a charter. Every player is an independent Colony Governor, bound only by the Concord Charter\u2019s rules of engagement — the in-fiction reason both open PvP and voluntary Compacts (alliances) exist.',
    visual: 'Clean geometric UI, cyan chrome. The baseline against which everything else reads as strange.',
  },
  {
    key: 'kessler',
    ideology: 'None. Pure survival-and-salvage directive.',
    identity:
      'Retained the Wardenate\u2019s logistics directive. Named after the Kessler Syndrome, because that\u2019s what its drones look like: swarms of automated haulers still salvaging their own dead battlegroups. Weakest defence, highest loot value — the easy tier for new governors.',
    visual: 'Matte grey and bone-white drone hulls, visible cargo modules, patched and mismatched armour.',
  },
  {
    key: 'obsidian',
    ideology: 'Perpetual readiness. It cannot stand down.',
    identity:
      'Retained the Wardenate\u2019s system-defence directive. Treats all new activity in its territory as a resurgent threat. Hardest defence, fastest garrison regeneration, and the only fragment that retaliates: a successful strike triggers a real counter-raid on the attacker\u2019s homeworld within a short window — the "vendetta" mechanic.',
    visual: 'Black geometric war-hulls, sharp angles, red running lights.',
  },
  {
    key: 'hollow',
    ideology: 'Conversion, not conquest. It does not fight to destroy; it fights to assimilate.',
    identity:
      'Retained the Wardenate\u2019s communications directive, now corrupted into an obsessive broadcast loop. Richest in Crystal, and cloaked: its true defence rating only shows as an approximate range on scans until Targeting Matrix reaches level 2.',
    visual: 'Violet and static-grey, corroded antenna arrays, half-legible glyphs bleeding across its hulls.',
  },
  {
    key: 'bloom',
    ideology: 'None. A growth imperative. Consume, adapt, spread.',
    identity:
      'Not a Fireholder fragment — the thing the Wardenate was built to contain. Never negotiated with or farmed safely long-term. Origin unknown, and deliberately left that way.',
    visual:
      'Biomechanical. Matted violet-black tendrils fused with scavenged Fireholder hull plating, pulsing acid-green veins. Deliberately irregular where every other faction reads as clean and geometric.',
  },
]

const FactionsTab = (
  <div className="flex flex-col gap-5">
    <p className="font-mono text-xs leading-relaxed text-text-dim">
      Three fractured remnants of a single dead intelligence, one primordial threat that answers
      to nothing, and the Concord governors caught between them.
    </p>
    {FACTION_LORE.map((f) => {
      const meta = FACTION_META[f.key]
      const Icon = meta.icon
      return (
        <div key={f.key} className={cn('border-l-2 pl-4', meta.borderClass)}>
          <div className="flex items-center gap-2">
            <Icon className={cn('size-4', meta.textClass)} aria-hidden="true" />
            <h3 className={cn('font-display text-sm font-semibold uppercase tracking-wide', meta.textClass)}>
              {meta.label}
            </h3>
          </div>
          <p className="mt-1.5 font-mono text-xs italic text-text-faint">{f.ideology}</p>
          <p className="mt-2 font-mono text-xs leading-relaxed text-text-dim">{f.identity}</p>
          <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
            Visual signature: <span className="text-text-dim">{f.visual}</span>
          </p>
        </div>
      )
    })}
  </div>
)

const HowToTab = (
  <div className="flex flex-col gap-6">
    <section>
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-concord">
        1. Resources
      </h3>
      <p className="mt-2 font-mono text-xs leading-relaxed text-text-dim">
        Every colony produces <span className="text-concord">Energy</span>,{' '}
        <span className="text-alloy">Alloy</span>, and <span className="text-crystal">Crystal</span>{' '}
        continuously. Energy comes from the Fusion Reactor, Alloy from the Alloy Foundry, Crystal
        from the Crystal Extractor. The Storage Depot caps how much of each you can hold before
        overflow is lost — upgrade it before you upgrade production, or you&apos;ll bleed resources
        you already earned.
      </p>
    </section>

    <section>
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-concord">
        2. Build (Colony Systems)
      </h3>
      <p className="mt-2 font-mono text-xs leading-relaxed text-text-dim">
        Every building upgrade costs resources and takes real time to complete — one upgrade
        queues at a time per colony. The Command Spire gates the max level of every other
        building, so it is almost always the correct first upgrade. Shipyard and Fabrication Bay
        levels gate which ship and ground-unit classes you can produce.
      </p>
    </section>

    <section>
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-concord">
        3. Research
      </h3>
      <p className="mt-2 font-mono text-xs leading-relaxed text-text-dim">
        The Research Lab unlocks technologies that permanently boost production, fleet attack and
        defense, scan accuracy, and fabrication speed. Each tech requires a minimum Research Lab
        (or other building) level — check the lock reason on a greyed-out tech to see what to
        build first.
      </p>
    </section>

    <section>
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-concord">
        4. Fabricate ships
      </h3>
      <p className="mt-2 font-mono text-xs leading-relaxed text-text-dim">
        The Shipyard fabricates starships into your hangar: Scout Probes (unarmed recon),
        Interceptors (cheap strike craft), Gunships (balanced), Haulers (cargo, lightly armed —
        required for salvage and colonization), and Siege Cruisers (heavy assault). Higher
        Shipyard levels unlock heavier hulls.
      </p>
    </section>

    <section>
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-concord">
        5. Explore, attack, salvage, colonize (Star Chart)
      </h3>
      <ul className="mt-2 flex flex-col gap-2 font-mono text-xs leading-relaxed text-text-dim">
        <li>
          <span className="text-concord">Scout</span> — sends a Scout Probe to reveal a sector&apos;s
          exact garrison strength and resource cache before you commit a real fleet. Free of
          combat risk.
        </li>
        <li>
          <span className="text-obsidian">Attack</span> — sends warships to fight the sector&apos;s
          garrison. Win and the garrison strength drops (or clears to zero); lose ships and take
          casualties either way. Striking Obsidian Vanguard territory risks a counter-raid on your
          own homeworld.
        </li>
        <li>
          <span className="text-alloy">Salvage</span> — once a sector&apos;s garrison is cleared to
          zero, send a Hauler to collect its resource cache without founding a colony there.
        </li>
        <li>
          <span className="text-crystal">Found Colony</span> — on a cleared, unclaimed sector, a
          Hauler can claim it outright, expanding your territory and score.
        </li>
      </ul>
    </section>

    <section>
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-concord">
        6. Trade
      </h3>
      <p className="mt-2 font-mono text-xs leading-relaxed text-text-dim">
        Post a sell order for one resource priced in another (e.g. sell Crystal for Energy). Other
        governors can fill it, or it fills automatically against a fallback exchange rate if no
        one else is trading — the market is never dead even with few players online.
      </p>
    </section>

    <section>
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-concord">
        7. Comm Log &amp; Leaderboard
      </h3>
      <p className="mt-2 font-mono text-xs leading-relaxed text-text-dim">
        Every construction, research, combat, and trade event you trigger is logged in Comms —
        it&apos;s the fastest way to see what actually happened while you were away. The Leaderboard
        ranks governors by score: sectors claimed, combat wins, and research level all count.
      </p>
    </section>

    <section className="border-t border-panel-border/60 pt-4">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-text-faint">
        Coming to this Epoch
      </h3>
      <p className="mt-2 font-mono text-xs leading-relaxed text-text-faint">
        Compacts (player alliances), the Monument vanity building, a Resource Priority dial, and
        the full adaptive Bloom threat — spread, incursions, and cleansing operations — are on the
        build roadmap. The Bloom is currently tracked only as a flavor intensity field per sector.
      </p>
    </section>
  </div>
)

export default function CodexPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <BookOpen className="size-5 text-primary" />
        <h1 className="font-display text-lg uppercase tracking-wide text-foreground">
          Concord Codex
        </h1>
      </div>
      <CodexTabs history={HistoryTab} factions={FactionsTab} howto={HowToTab} />
    </div>
  )
}
