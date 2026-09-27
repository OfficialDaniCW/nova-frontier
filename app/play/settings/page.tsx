import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Coffee, LogOut, User } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { governors } from '@/lib/db/schema'
import { SignOutButton } from '@/components/game/sign-out-button'
import { CoffeeButton, BUY_ME_A_COFFEE_URL } from '@/components/landing/coffee-button'

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const [governor] = await db
    .select()
    .from(governors)
    .where(eq(governors.userId, session.user.id))
    .limit(1)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-concord">
          Command Console
        </span>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-text">
          Settings
        </h1>
      </div>

      <section className="clip-chevron flex flex-col gap-4 border border-panel-border bg-slate-950/60 p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center border border-concord/40 bg-concord/10 text-concord">
            <User className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-text">
            Governor Account
          </h2>
        </div>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <dt className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
              Callsign
            </dt>
            <dd className="font-mono text-sm text-text">{governor?.callsign ?? 'Unassigned'}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
              Email
            </dt>
            <dd className="font-mono text-sm text-text">{session.user.email}</dd>
          </div>
        </dl>
        <div className="pt-2">
          <SignOutButton />
        </div>
      </section>

      <section className="clip-chevron flex flex-col gap-4 border border-devotion/30 bg-slate-950/60 p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center border border-devotion/40 bg-devotion/10 text-devotion">
            <Coffee className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-text">
            Support Nova Frontier
          </h2>
        </div>
        <p className="font-mono text-xs leading-relaxed text-text-faint">
          Nova Frontier is free to play, built and run by one person. There are no ads and
          nothing for sale &mdash; if you&apos;ve enjoyed your time in the Verge, a coffee helps
          keep the servers running.
        </p>
        <div>
          <CoffeeButton variant="solid" />
        </div>
        <p className="font-mono text-[0.65rem] text-text-faint">{BUY_ME_A_COFFEE_URL}</p>
      </section>
    </div>
  )
}
