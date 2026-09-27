import {
  Building2,
  FlaskConical,
  Crosshair,
  Flame,
  ArrowLeftRight,
  Trophy,
  Skull,
  MessageSquare,
} from 'lucide-react'

const SYSTEMS = [
  {
    icon: Building2,
    title: 'Colony Management',
    body: 'Queue building upgrades, automate your production chain, and watch your outpost grow into a metropolis.',
  },
  {
    icon: FlaskConical,
    title: 'Research Doctrines',
    body: 'Commit to mutually exclusive capstone technologies that permanently bend your colony toward a playstyle.',
  },
  {
    icon: Crosshair,
    title: 'Fleets & Combat',
    body: 'Scout, raid, and colonize across a live star chart. Every battle is logged — win or lose, the fleet is real.',
  },
  {
    icon: Skull,
    title: 'Disasters & the Bloom',
    body: 'Natural disasters and Bloom incursions strike without warning, leaving production debuffs you have to recover from.',
  },
  {
    icon: Flame,
    title: 'Creeds & Allegiance',
    body: 'Pledge to a faction and a creed. Frontier events test your convictions with choices that carry real consequences.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Galactic Market',
    body: 'Trade energy, alloy, and crystal with other governors when your production chain comes up short.',
  },
  {
    icon: MessageSquare,
    title: 'Compacts & Comms',
    body: 'Form alliances, coordinate through the relay, and keep a digest of every disaster, raid, and event you missed.',
  },
  {
    icon: Trophy,
    title: 'Seasons & Leaderboard',
    body: 'Every season resets the scoreboard. Climb the ranks, earn a title, and start the next epoch with a clean slate.',
  },
]

export function SystemsOverview() {
  return (
    <section
      className="relative mx-auto w-full max-w-6xl px-6 py-20 sm:py-28"
      aria-labelledby="systems-heading"
    >
      <div className="mb-12 flex flex-col items-center gap-3 text-center">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-concord">
          Ship Systems
        </span>
        <h2
          id="systems-heading"
          className="font-display text-2xl font-bold uppercase tracking-[0.1em] text-text sm:text-3xl"
        >
          Everything a Governor Commands
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SYSTEMS.map((system) => {
          const Icon = system.icon
          return (
            <div
              key={system.title}
              className="clip-chevron-sm flex flex-col gap-3 border border-panel-border bg-slate-950/50 p-5 transition-colors hover:border-concord/40"
            >
              <Icon className="size-5 text-concord" strokeWidth={1.5} aria-hidden="true" />
              <h3 className="font-display text-xs font-bold uppercase tracking-wide text-text">
                {system.title}
              </h3>
              <p className="font-mono text-[0.7rem] leading-relaxed text-text-faint">
                {system.body}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
