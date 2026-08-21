'use client'

import { useState, type ReactNode } from 'react'
import { ScrollText, Users, Compass } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { cn } from '@/lib/utils'

type TabKey = 'history' | 'factions' | 'howto'

const TABS: { key: TabKey; label: string; icon: typeof ScrollText }[] = [
  { key: 'history', label: 'History', icon: ScrollText },
  { key: 'factions', label: 'Factions', icon: Users },
  { key: 'howto', label: 'How to Play', icon: Compass },
]

export function CodexTabs({
  history,
  factions,
  howto,
}: {
  history: ReactNode
  factions: ReactNode
  howto: ReactNode
}) {
  const [tab, setTab] = useState<TabKey>('history')

  const content = tab === 'history' ? history : tab === 'factions' ? factions : howto

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'clip-chevron flex items-center gap-2 border px-4 py-2 font-display text-xs font-semibold uppercase tracking-wide transition-colors',
                active
                  ? 'border-concord bg-concord/10 text-concord'
                  : 'border-panel-border bg-slate-950/40 text-text-dim hover:text-foreground',
              )}
            >
              <t.icon className="size-3.5" aria-hidden="true" />
              {t.label}
            </button>
          )
        })}
      </div>

      <Panel grid scanline className="p-5 sm:p-7">
        {content}
      </Panel>
    </div>
  )
}
