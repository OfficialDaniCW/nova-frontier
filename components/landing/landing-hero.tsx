import Link from 'next/link'
import { Hexagon } from 'lucide-react'
import { ChevronButton } from '@/components/game/chevron-button'
import { StarfieldCanvas } from '@/components/landing/starfield-canvas'
import { LiveStatsBand } from '@/components/landing/live-stats-band'
import type { PublicGameStats } from '@/lib/game/public-stats'

export function LandingHero({
  isSignedIn,
  stats,
}: {
  isSignedIn: boolean
  stats: PublicGameStats
}) {
  return (
    <section className="relative isolate flex min-h-[92vh] flex-col overflow-hidden">
      <StarfieldCanvas />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-void via-transparent to-void"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
        <div className="flex flex-col items-center gap-4">
          <Hexagon className="size-9 text-concord pulse-glow rounded-full" strokeWidth={1.5} aria-hidden="true" />
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-concord">
            RC 108 &mdash; Deep Verge Uplink Live
          </span>
          <h1 className="max-w-3xl font-display text-4xl font-bold uppercase tracking-[0.08em] text-text sm:text-6xl">
            Nova <span className="text-concord">Frontier</span>
          </h1>
          <p className="max-w-xl font-mono text-sm leading-relaxed text-text-dim sm:text-base">
            A persistent, real-time colony strategy game. Build a colony, research the frontier,
            raise a fleet, and expand into a dying star cluster &mdash; even while you&apos;re offline.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link href={isSignedIn ? '/play/colony' : '/sign-up'}>
            <ChevronButton variant="concord" size="lg">
              {isSignedIn ? 'Establish Uplink' : 'Commission a Colony'}
            </ChevronButton>
          </Link>
          {!isSignedIn && (
            <Link
              href="/sign-in"
              className="font-mono text-xs uppercase tracking-wide text-text-faint transition-colors hover:text-concord"
            >
              Already a governor? Sign in
            </Link>
          )}
        </div>

        <div className="mt-6 w-full max-w-3xl">
          <LiveStatsBand stats={stats} />
        </div>
      </div>
    </section>
  )
}
