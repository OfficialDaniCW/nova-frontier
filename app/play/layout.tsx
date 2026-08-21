import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Toaster } from '@/components/ui/sonner'
import { auth } from '@/lib/auth'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { GameHeader } from '@/components/game/header'
import { GameNav } from '@/components/game/nav'

export default async function PlayLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  await ensurePlayerBootstrapped(session.user.id)

  return (
    <div className="flex min-h-screen flex-col bg-void">
      <div className="sticky top-0 z-40">
        <GameHeader />
        <GameNav />
      </div>
      <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      <Toaster />
    </div>
  )
}
