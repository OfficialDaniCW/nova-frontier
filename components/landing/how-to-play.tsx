import { Building2, FlaskConical, Rocket, Users } from 'lucide-react'

const STEPS = [
  {
    icon: Building2,
    title: 'Found your colony',
    body: 'Commission a colony on a fresh planet. Balance energy, alloy, and crystal production as you raise your first structures.',
  },
  {
    icon: FlaskConical,
    title: 'Research the frontier',
    body: 'Unlock doctrines and technologies that reshape how your colony grows, fights, and survives disasters in the Deep Verge.',
  },
  {
    icon: Rocket,
    title: 'Build a fleet, chart the stars',
    body: 'Scout neighboring systems, colonize new worlds, and raise a war fleet to defend your claim or raid a rival governor.',
  },
  {
    icon: Users,
    title: 'Join a Compact, pick a Creed',
    body: "Ally with other governors in a Compact, pledge to a faction, and answer frontier events that shape your colony's story.",
  },
]

export function HowToPlay() {
  return (
    <section
      id="how-to-play"
      className="relative mx-auto w-full max-w-5xl px-6 py-20 sm:py-28"
      aria-labelledby="how-to-play-heading"
    >
      <div className="mb-12 flex flex-col items-center gap-3 text-center">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-concord">
          Command Briefing
        </span>
        <h2
          id="how-to-play-heading"
          className="font-display text-2xl font-bold uppercase tracking-[0.1em] text-text sm:text-3xl"
        >
          How to Play
        </h2>
        <p className="max-w-lg font-mono text-xs leading-relaxed text-text-faint sm:text-sm">
          Nova Frontier is a persistent, real-time strategy game. Progress continues while
          you&apos;re away — check in, issue orders, and watch your colony grow.
        </p>
      </div>

      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          return (
            <li
              key={step.title}
              className="clip-chevron group relative flex flex-col gap-3 border border-panel-border bg-slate-950/60 p-6 transition-colors hover:border-concord/50"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center border border-concord/40 bg-concord/10 text-concord">
                  <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="font-mono text-[0.65rem] tabular-nums text-text-faint">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-text">
                {step.title}
              </h3>
              <p className="font-mono text-xs leading-relaxed text-text-faint">{step.body}</p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
