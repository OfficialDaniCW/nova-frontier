import Link from 'next/link'
import { Hexagon } from 'lucide-react'
import { CoffeeButton } from '@/components/landing/coffee-button'

export function LandingFooter() {
  return (
    <footer className="relative border-t border-panel-border/60 bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-12 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <div className="flex items-center gap-2">
            <Hexagon className="size-4 text-concord" strokeWidth={1.5} aria-hidden="true" />
            <span className="font-display text-xs font-bold uppercase tracking-[0.15em] text-text">
              Nova <span className="text-concord">Frontier</span>
            </span>
          </div>
          <p className="max-w-sm font-mono text-[0.7rem] leading-relaxed text-text-faint">
            Built and run by one governor, for free. If the Verge has been good to you,
            a coffee keeps the servers online.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:items-end">
          <CoffeeButton variant="solid" />
          <div className="flex items-center gap-4 font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
            <Link href="/sign-in" className="transition-colors hover:text-concord">
              Sign in
            </Link>
            <span aria-hidden="true">&middot;</span>
            <Link href="/sign-up" className="transition-colors hover:text-concord">
              Commission a colony
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
