'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function SignOutButton() {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut()
        router.push('/sign-in')
        router.refresh()
      }}
      title="Sign out"
      className="clip-chevron-sm flex items-center gap-1.5 border border-panel-border bg-slate-950/60 px-2.5 py-1.5 font-display text-[0.65rem] uppercase tracking-wide text-text-dim transition-colors hover:border-destructive/50 hover:text-destructive"
    >
      <LogOut className="size-3.5" aria-hidden="true" />
      <span className="hidden sm:inline">Sign Out</span>
    </button>
  )
}
