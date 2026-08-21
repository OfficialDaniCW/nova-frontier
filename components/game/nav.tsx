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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { colonyInfo } from '@/lib/game-data'

interface NavItem {
  label: string
  href: string
  icon: typeof Building2
  /** Screens not yet built in this pass — shown locked instead of linked. */
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Colony', href: `/play/colony/${colonyInfo.id}`, icon: Building2 },
  { label: 'Fabrication', href: `/play/fabrication/${colonyInfo.id}`, icon: Factory, disabled: true },
  { label: 'Research', href: '/play/research', icon: FlaskConical, disabled: true },
  { label: 'Star Chart', href: '/play/galaxy', icon: Globe2 },
  { label: 'Fleet', href: '/play/fleet', icon: Rocket, disabled: true },
  { label: 'Compact', href: '/play/compact', icon: Users, disabled: true },
  { label: 'Market', href: '/play/market', icon: ArrowLeftRight, disabled: true },
  { label: 'Log', href: '/play/log', icon: ScrollText, disabled: true },
  { label: 'Leaderboard', href: '/play/leaderboard', icon: Trophy, disabled: true },
]

export function GameNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className="flex items-center gap-1 overflow-x-auto border-t border-panel-border/60 bg-slate-950/40 px-4 py-1.5 sm:px-6"
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
                ? 'border-concord/50 bg-concord/10 text-concord'
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
