import Link from 'next/link'
import { headers } from 'next/headers'
import { Hexagon } from 'lucide-react'
import { ChevronButton } from '@/components/game/chevron-button'
import { auth } from '@/lib/auth'

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() })

  return (
    <div className="flex min-h-screen items-center justify-center bg-void font-sans">
      <main className="flex w-full max-w-md flex-col items-center gap-8 px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <Hexagon className="size-8 text-concord" strokeWidth={1.5} aria-hidden="true" />
          <h1 className="font-display text-3xl font-bold uppercase tracking-[0.15em] text-text">
            Nova <span className="text-concord">Frontier</span>
          </h1>
          <p className="max-w-sm font-mono text-xs leading-relaxed text-text-faint">
            RC 108. Deep-sensor arrays are registering anomalous activity in the Deep
            Verge. Governors are advised to expand while the Verge still permits it.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Link href={session?.user ? '/play/colony' : '/sign-up'}>
            <ChevronButton variant="concord" size="lg">
              {session?.user ? 'Establish Uplink' : 'Commission a Colony'}
            </ChevronButton>
          </Link>
          {!session?.user && (
            <Link
              href="/sign-in"
              className="font-mono text-[0.7rem] uppercase tracking-wide text-text-faint transition-colors hover:text-concord"
            >
              Already a governor? Sign in
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
