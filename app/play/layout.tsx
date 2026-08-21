import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Toaster } from '@/components/ui/sonner'
import { auth } from '@/lib/auth'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { GameHeader } from '@/components/game/header'
import { GameNav } from '@/components/game/nav'
import { StatusBar } from '@/components/game/status-bar'

export default async function PlayLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const { colony } = await ensurePlayerBootstrapped(session.user.id)

  return (
    <div className="control-scan relative flex min-h-screen flex-col bg-void">
      {/* Ambient deep-space console backdrop — fixed behind all content */}
      <div className="control-backdrop pointer-events-none fixed inset-0 z-0" aria-hidden="true" />
      <div className="control-grid pointer-events-none fixed inset-0 z-0" aria-hidden="true" />
      <div className="control-vignette pointer-events-none fixed inset-0 z-0" aria-hidden="true" />

      {/* Console corner brackets framing the command viewport */}
      <div className="pointer-events-none fixed inset-2 z-30 hidden sm:block" aria-hidden="true">
        <span className="absolute left-0 top-0 size-6 border-l-2 border-t-2 border-concord/60" />
        <span className="absolute right-0 top-0 size-6 border-r-2 border-t-2 border-concord/60" />
        <span className="absolute bottom-0 left-0 size-6 border-b-2 border-l-2 border-concord/60" />
        <span className="absolute bottom-0 right-0 size-6 border-b-2 border-r-2 border-concord/60" />
      </div>

      <div className="relative z-40 flex min-h-screen flex-col">
        <div className="sticky top-0 z-40">
          <GameHeader />
          <GameNav />
        </div>
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        <StatusBar
          sector="Halcyon Verge"
          colonyName={colony?.name ?? 'Unassigned'}
        />
      </div>
      <Toaster />
    </div>
  )
}
