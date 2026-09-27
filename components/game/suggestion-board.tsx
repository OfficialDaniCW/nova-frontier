'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ChevronUp, Lightbulb } from 'lucide-react'
import { createSuggestion, toggleVote, type SuggestionRow } from '@/app/actions/suggestions'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Under Review',
  planned: 'Planned',
  shipped: 'Shipped',
  declined: 'Declined',
}

const STATUS_CLASS: Record<string, string> = {
  pending: 'border-text-faint/40 text-text-faint',
  planned: 'border-concord/50 text-concord',
  shipped: 'border-emerald-500/50 text-emerald-400',
  declined: 'border-devotion/40 text-devotion/80',
}

interface SuggestionBoardProps {
  suggestions: SuggestionRow[]
}

export function SuggestionBoard({ suggestions }: SuggestionBoardProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)
  const [votingId, setVotingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      toast.error('Give your idea a title and a short description')
      return
    }
    setSubmitting(true)
    try {
      await createSuggestion({ title, description })
      toast.success('Idea transmitted to the Command Council')
      setTitle('')
      setDescription('')
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit idea')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVote(id: string) {
    setVotingId(id)
    try {
      await toggleVote(id)
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to vote')
    } finally {
      setVotingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder={'Idea title (e.g. "Add cloaking ships")'}
          className="border border-panel-border bg-slate-950/60 px-3 py-2 font-mono text-sm text-text placeholder:text-text-faint/60 focus:border-concord/60 focus:outline-none"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={600}
          rows={3}
          placeholder="What should it do, and why would it make the game better?"
          className="resize-none border border-panel-border bg-slate-950/60 px-3 py-2 font-mono text-sm text-text placeholder:text-text-faint/60 focus:border-concord/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="clip-chevron self-start border border-concord/50 bg-concord/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide text-concord transition hover:bg-concord/20 disabled:opacity-50"
        >
          {submitting ? 'Transmitting…' : 'Submit Idea'}
        </button>
      </form>

      <div className="flex flex-col gap-2 border-t border-panel-border pt-4">
        {suggestions.length === 0 && (
          <p className="font-mono text-xs text-text-faint">
            No ideas yet &mdash; be the first governor to propose one.
          </p>
        )}
        {suggestions.map((s) => (
          <div
            key={s.id}
            className="flex items-start gap-3 border border-panel-border bg-slate-950/40 p-3"
          >
            <button
              type="button"
              onClick={() => handleVote(s.id)}
              disabled={votingId === s.id}
              aria-pressed={s.hasVoted}
              className={`flex flex-col items-center gap-0.5 border px-2 py-1.5 font-mono text-xs transition disabled:opacity-50 ${
                s.hasVoted
                  ? 'border-concord/60 bg-concord/15 text-concord'
                  : 'border-panel-border text-text-faint hover:border-concord/40 hover:text-concord'
              }`}
            >
              <ChevronUp className="size-3.5" strokeWidth={2} aria-hidden="true" />
              <span className="font-bold">{s.voteCount}</span>
            </button>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-sm font-bold text-text">{s.title}</h3>
                <span
                  className={`clip-chevron border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wide ${STATUS_CLASS[s.status] ?? STATUS_CLASS.pending}`}
                >
                  {STATUS_LABEL[s.status] ?? s.status}
                </span>
              </div>
              <p className="font-mono text-xs leading-relaxed text-text-faint">{s.description}</p>
              <span className="font-mono text-[0.6rem] uppercase tracking-wide text-text-faint/70">
                Proposed by {s.authorName}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 border border-devotion/20 bg-devotion/5 p-3">
        <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-devotion" strokeWidth={1.5} aria-hidden="true" />
        <p className="font-mono text-[0.65rem] leading-relaxed text-text-faint">
          The top voted ideas each cycle get reviewed and, when they fit, built into the game. The
          highest ranked ones also show up on the home page as Pending Updates.
        </p>
      </div>
    </div>
  )
}
