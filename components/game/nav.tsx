'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  Factory,
  FlaskConical,
  Globe2,
  Rocket,
  Users,
  ArrowLeftRight,
  ScrollText,
  Trophy,
  Lock,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: typeof Building2
  /** Screens not yet built in this pass — shown locked instead of linked. */
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Colony', href: `/play/colony`, icon: Building2 },
  { label: 'Fabrication', href: `/play/fabrication`, icon: Factory },
  { label: 'Research', href: '/play/research', icon: FlaskConical },
  { label: 'Star Chart', href: '/play/galaxy', icon: Globe2 },
  { label: 'Fleet', href: '/play/fleet', icon: Rocket },
  { label: 'Compact', href: '/play/compact', icon: Users },
  { label: 'Trade', href: '/play/trade', icon: ArrowLeftRight },
  { label: 'Comms', href: '/play/comms', icon: ScrollText },
  { label: 'Leaderboard', href: '/play/leaderboard', icon: Trophy },
  { label: 'Codex', href: '/play/codex', icon: BookOpen },
]

export function GameNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className="flex items-center gap-1 overflow-x-auto border-t border-panel-border/60 bg-slate-950/60 px-4 py-1.5 backdrop-blur-sm sm:px-6"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname?.startsWith(item.href.split('/').slice(0, 3).join('/'))
        if (item.disabled) {
          return (
            <span
              key={item.label}
              title="Not yet online for this epoch"
              className="flex shrink-0 cursor-not-allowed items-center gap-1.5 px-3 py-1.5 font-display text-[0.7rem] uppercase tracking-wide text-text-faint/60"
            >
              <Lock className="size-3" aria-hidden="true" />
              {item.label}
            </span>
          )
        }
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'clip-chevron-sm flex shrink-0 items-center gap-1.5 border border-transparent px-3 py-1.5 font-display text-[0.7rem] uppercase tracking-wide transition-colors',
              isActive
                ? 'border-concord/50 bg-concord/10 text-concord shadow-[0_0_12px_-2px_var(--concord-dim)]'
                : 'text-text-dim hover:border-panel-border hover:text-text',
            )}
          >
            <item.icon className="size-3.5" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
