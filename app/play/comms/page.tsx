import { getCommLog } from '@/app/actions/comms'
import { Panel } from '@/components/game/panel'
import { Radio, Swords, FlaskConical, Hammer, Coins, Sparkles, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORY_ICON: Record<string, typeof Radio> = {
  combat: Swords,
  research: FlaskConical,
  construction: Hammer,
  trade: Coins,
  bloom: Sparkles,
  system: Info,
}

const SEVERITY_STYLES: Record<string, string> = {
  info: 'border-panel-border text-text-dim',
  success: 'border-emerald-500/40 text-emerald-400',
  warning: 'border-amber-500/40 text-amber-400',
  danger: 'border-destructive/40 text-destructive',
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

export default async function CommsPage() {
  const { entries } = await getCommLog()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Radio className="size-5 text-primary" />
        <h1 className="font-display text-lg uppercase tracking-wide text-foreground">Comm Log</h1>
      </div>

      <Panel grid className="p-4 sm:p-6">
        {entries.length === 0 ? (
          <p className="py-8 text-center font-mono text-sm text-text-dim">
            No transmissions yet. Dispatch a fleet or queue construction to generate activity.
          </p>
        ) : (
          <ol className="flex flex-col gap-2.5">
            {entries.map((entry) => {
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
