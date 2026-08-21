import type { ReactNode } from 'react'
import { GameHeader } from '@/components/game/header'
import { GameNav } from '@/components/game/nav'

export default function PlayLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-void">
      <div className="sticky top-0 z-40">
        <GameHeader />
        <GameNav />
      </div>
      <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
