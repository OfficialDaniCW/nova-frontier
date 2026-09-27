'use client'

import { useMemo, useState } from 'react'
import { Radio, Swords, FlaskConical, Hammer, Coins, Sparkles, Info, AlertTriangle } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { cn } from '@/lib/utils'

const CATEGORY_ICON: Record<string, typeof Radio> = {
  combat: Swords,
  research: FlaskConical,
  construction: Hammer,
  trade: Coins,
  bloom: Sparkles,
  disaster: AlertTriangle,
  system: Info,
}

const SEVERITY_STYLES: Record<string, string> = {
  info: 'border-panel-border text-text-dim',
  success: 'border-emerald-500/40 text-emerald-400',
  warning: 'border-amber-500/40 text-amber-400',
  danger: 'border-destructive/40 text-destructive',
}

interface CommLogEntry {
  id: string
  category: string
  severity: string
  message: string
  createdAt: string
}

function timeAgo(date: Date) {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function CommLogList({ entries }: { entries: CommLogEntry[] }) {
  const [category, setCategory] = useState<string>('all')

  const categories = useMemo(() => {
    const seen = new Set<string>()
    for (const entry of entries) seen.add(entry.category)
    return Array.from(seen)
  }, [entries])

  const filtered = useMemo(
    () => (category === 'all' ? entries : entries.filter((e) => e.category === category)),
    [entries, category],
  )

  return (
    <div className="flex flex-col gap-3">
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={cn(
              'clip-chevron-sm border px-2.5 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors',
              category === 'all'
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-panel-border text-text-dim hover:text-foreground',
            )}
          >
            All
          </button>
          {categories.map((cat) => {
            const Icon = CATEGORY_ICON[cat] ?? Info
            const active = category === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  'clip-chevron-sm flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors',
                  active
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-panel-border text-text-dim hover:text-foreground',
                )}
              >
                <Icon className="size-3.5" />
                {cat}
              </button>
            )
          })}
        </div>
      )}

      <Panel grid className="p-4 sm:p-6">
        {filtered.length === 0 ? (
          <p className="py-8 text-center font-mono text-sm text-text-dim">
            {entries.length === 0
              ? 'No transmissions yet. Dispatch a fleet or queue construction to generate activity.'
              : 'No transmissions match this filter.'}
          </p>
        ) : (
          <ol className="flex flex-col gap-2.5">
            {filtered.map((entry) => {
              const Icon = CATEGORY_ICON[entry.category] ?? Info
              const severityClass = SEVERITY_STYLES[entry.severity] ?? SEVERITY_STYLES.info
              return (
                <li
                  key={entry.id}
                  className={cn(
                    'flex items-start gap-3 border-l-2 bg-slate-950/40 px-3 py-2.5',
                    severityClass,
                  )}
                >
                  <Icon className="mt-0.5 size-4 shrink-0" />
                  <div className="flex flex-1 flex-col gap-0.5">
                    <p className="font-mono text-sm leading-relaxed text-foreground">{entry.message}</p>
                    <div className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-wide text-text-dim">
                      <span>{entry.category}</span>
                      <span aria-hidden="true">•</span>
                      <span>{timeAgo(new Date(entry.createdAt))}</span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </Panel>
    </div>
  )
}
