import Link from 'next/link'
import { headers } from 'next/headers'
import { Gem, Hexagon, Layers, Zap } from 'lucide-react'
import { ResourcePill } from '@/components/game/resource-pill'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { colonies, governors } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { projectColonyResources } from '@/lib/game/resources'
import { SignOutButton } from '@/components/game/sign-out-button'

export async function GameHeader() {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id

  const [governor] = userId
    ? await db.select().from(governors).where(eq(governors.userId, userId)).limit(1)
    : []
  const [colony] = userId
    ? await db.select().from(colonies).where(eq(colonies.userId, userId)).limit(1)
    : []

  const projected = colony ? projectColonyResources(colony) : null

  return (
    <header className="border-b border-panel-border/60 bg-slate-950/70 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/play/colony" className="flex items-center gap-2">
          <Hexagon className="size-5 text-concord" strokeWidth={1.5} aria-hidden="true" />
          <span className="font-display text-sm font-bold uppercase tracking-[0.15em] text-text">
            Nova <span className="text-concord">Frontier</span>
          </span>
        </Link>

        {projected && colony && (
          <div className="flex flex-wrap items-center gap-2">
            <ResourcePill type="energy" icon={Zap} value={projected.energy} rate={colony.energyRate} />
            <ResourcePill type="alloy" icon={Layers} value={projected.alloy} rate={colony.alloyRate} />
            <ResourcePill type="crystal" icon={Gem} value={projected.crystal} rate={colony.crystalRate} />
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-panel-border bg-slate-950/60 px-3 py-1.5 clip-chevron-sm">
            <span className="font-display text-[0.65rem] uppercase tracking-wide text-text-faint">
              {governor?.callsign ?? colony?.name ?? 'Governor'}
            </span>
            <span className="h-3 w-px bg-panel-border" aria-hidden="true" />
            <span className="font-mono text-sm tabular-nums text-text">
              {new Intl.NumberFormat('en-US').format(governor?.score ?? 0)}
            </span>
            <span className="font-display text-[0.6rem] uppercase tracking-wide text-text-faint">score</span>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  )
}
