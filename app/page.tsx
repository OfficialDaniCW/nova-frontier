import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getPublicGameStats } from '@/lib/game/public-stats'
import { LandingHero } from '@/components/landing/landing-hero'
import { HowToPlay } from '@/components/landing/how-to-play'
import { SystemsOverview } from '@/components/landing/systems-overview'
import { LandingFooter } from '@/components/landing/landing-footer'

export default async function Home() {
  const [session, stats] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getPublicGameStats(),
  ])

  return (
    <div className="control-scan relative min-h-screen bg-void font-sans">
      <div className="control-backdrop pointer-events-none fixed inset-0 z-0" aria-hidden="true" />
      <div className="control-grid pointer-events-none fixed inset-0 z-0" aria-hidden="true" />
      <div className="control-vignette pointer-events-none fixed inset-0 z-0" aria-hidden="true" />

      <main className="relative z-10">
        <LandingHero isSignedIn={Boolean(session?.user)} stats={stats} />
        <HowToPlay />
        <SystemsOverview />
      </main>
      <div className="relative z-10">
        <LandingFooter />
      </div>
    </div>
  )
}
