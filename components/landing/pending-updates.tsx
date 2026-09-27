import Link from 'next/link'
import { ChevronUp, Megaphone } from 'lucide-react'
import { listPublicPendingUpdates } from '@/app/actions/suggestions'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Under Review',
  planned: 'Planned',
  shipped: 'Shipped',
}

const STATUS_CLASS: Record<string, string> = {
  pending: 'border-text-faint/40 text-text-faint',
  planned: 'border-concord/50 text-concord',
  shipped: 'border-emerald-500/50 text-emerald-400',
}

export async function PendingUpdates() {
  const updates = await listPublicPendingUpdates(5)

  return (
    <section className="relative border-t border-panel-border bg-slate-950/40 px-6 py-20 sm:px-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-10 items-center justify-center border border-concord/40 bg-concord/10 text-concord">
            <Megaphone className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-text text-balance">
            Pending Updates
          </h2>
          <p className="max-w-xl font-mono text-sm leading-relaxed text-text-faint text-pretty">
            Nova Frontier is shaped by the governors who play it. Every idea below was proposed
            and voted up by real players &mdash; the top ones each cycle get built into the game.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {updates.length === 0 && (
            <p className="text-center font-mono text-xs text-text-faint">
              No community ideas yet &mdash; sign in and be the first to propose one.
            </p>
          )}
          {updates.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-4 border border-panel-border bg-slate-950/60 p-4"
            >
              <div className="flex flex-col items-center gap-0.5 border border-panel-border px-2.5 py-1.5 font-mono text-xs text-text-faint">
                <ChevronUp className="size-3.5" strokeWidth={2} aria-hidden="true" />
                <span className="font-bold text-text">{u.voteCount}</span>
              </div>
              <span className="flex-1 font-mono text-sm text-text text-pretty">{u.title}</span>
              <span
                className={`clip-chevron shrink-0 border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wide ${STATUS_CLASS[u.status] ?? STATUS_CLASS.pending}`}
              >
                {STATUS_LABEL[u.status] ?? u.status}
              </span>
            </div>
          ))}
        </div>

        <Link
          href="/sign-in"
          className="clip-chevron mx-auto border border-concord/50 bg-concord/10 px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-concord transition hover:bg-concord/20"
        >
          Suggest or Vote on an Idea
        </Link>
      </div>
    </section>
  )
}
