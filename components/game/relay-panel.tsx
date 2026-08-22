'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MessageSquare, Users, Send, Search, Radio, ArrowLeft } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { ChevronButton } from '@/components/game/chevron-button'
import { cn } from '@/lib/utils'
import {
  getThread,
  searchGovernors,
  sendDirectMessage,
  sendCompactMessage,
  type DirectConversation,
} from '@/app/actions/relay'

type CompactMessage = {
  id: string
  senderUserId: string
  senderCallsign: string
  body: string
  createdAt: string
  isMine: boolean
}

type ThreadMessage = {
  id: string
  body: string
  createdAt: string
  isMine: boolean
}

interface RelayPanelProps {
  myCallsign: string
  conversations: (Omit<DirectConversation, 'lastAt'> & { lastAt: string })[]
  compact: { id: string; name: string; tag: string } | null
  compactMessages: CompactMessage[]
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export function RelayPanel({
  myCallsign,
  conversations,
  compact,
  compactMessages,
}: RelayPanelProps) {
  const router = useRouter()
  const [tab, setTab] = useState<'direct' | 'alliance'>('direct')

  return (
    <div className="flex flex-col gap-4">
      {/* Tab switcher */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('direct')}
          className={cn(
            'flex items-center gap-2 border px-4 py-2 clip-chevron-sm font-display text-xs uppercase tracking-wide transition-colors',
            tab === 'direct'
              ? 'border-concord/60 bg-concord/10 text-concord'
              : 'border-panel-border bg-slate-950/50 text-text-faint hover:text-text',
          )}
        >
          <MessageSquare className="size-4" aria-hidden="true" />
          Direct
        </button>
        <button
          type="button"
          onClick={() => setTab('alliance')}
          className={cn(
            'flex items-center gap-2 border px-4 py-2 clip-chevron-sm font-display text-xs uppercase tracking-wide transition-colors',
            tab === 'alliance'
              ? 'border-crystal/60 bg-crystal/10 text-crystal'
              : 'border-panel-border bg-slate-950/50 text-text-faint hover:text-text',
          )}
        >
          <Users className="size-4" aria-hidden="true" />
          Alliance
        </button>
      </div>

      {tab === 'direct' ? (
        <DirectTab myCallsign={myCallsign} conversations={conversations} onChanged={() => router.refresh()} />
      ) : (
        <AllianceTab compact={compact} messages={compactMessages} onChanged={() => router.refresh()} />
      )}
    </div>
  )
}

/* ---------------------------------- Direct --------------------------------- */

function DirectTab({
  myCallsign,
  conversations,
  onChanged,
}: {
  myCallsign: string
  conversations: (Omit<DirectConversation, 'lastAt'> & { lastAt: string })[]
  onChanged: () => void
}) {
  const [active, setActive] = useState<{ userId: string; callsign: string } | null>(null)
  const [thread, setThread] = useState<ThreadMessage[]>([])
  const [loadingThread, setLoadingThread] = useState(false)

  async function openThread(userId: string, callsign: string) {
    setActive({ userId, callsign })
    setLoadingThread(true)
    const res = await getThread(userId)
    setThread(
      res.messages.map((m) => ({ ...m, createdAt: new Date(m.createdAt).toISOString() })),
    )
    setLoadingThread(false)
    onChanged()
  }

  if (active) {
    return (
      <Thread
        partner={active}
        messages={thread}
        loading={loadingThread}
        onBack={() => {
          setActive(null)
          onChanged()
        }}
        onSent={() => openThread(active.userId, active.callsign)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <NewTransmission onOpen={openThread} />
      <Panel grid className="p-0">
        <div className="border-b border-panel-border px-4 py-2">
          <span className="font-display text-[0.65rem] uppercase tracking-wide text-text-faint">
            Transmissions — {myCallsign}
          </span>
        </div>
        {conversations.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-text-faint">
            No transmissions yet. Search for a governor above to open a channel.
          </p>
        ) : (
          <ul className="divide-y divide-panel-border/60">
            {conversations.map((c) => (
              <li key={c.partnerUserId}>
                <button
                  type="button"
                  onClick={() => openThread(c.partnerUserId, c.partnerCallsign)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-900/40"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center border border-panel-border bg-slate-950/60 clip-chevron-sm">
                    <Radio className="size-4 text-concord" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-display text-sm uppercase tracking-wide text-text">
                        {c.partnerCallsign}
                      </span>
                      <span className="shrink-0 text-[0.65rem] text-text-faint">
                        {timeAgo(c.lastAt)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-text-faint">{c.lastMessage}</p>
                  </div>
                  {c.unread > 0 && (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-concord font-display text-[0.65rem] font-bold text-slate-950">
                      {c.unread}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}

function NewTransmission({
  onOpen,
}: {
  onOpen: (userId: string, callsign: string) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ userId: string; callsign: string }[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    let cancelled = false
    setSearching(true)
    const t = setTimeout(async () => {
      const res = await searchGovernors(q)
      if (!cancelled) {
        setResults(res.results)
        setSearching(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [query])

  return (
    <Panel className="p-4">
      <label className="mb-2 flex items-center gap-2 font-display text-[0.65rem] uppercase tracking-wide text-text-faint">
        <Search className="size-3.5" aria-hidden="true" />
        New transmission
      </label>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search governors by callsign…"
        className="w-full border border-panel-border bg-slate-950/60 px-3 py-2 text-sm text-text outline-none placeholder:text-text-faint/60 focus:border-concord/60"
      />
      {query.trim().length >= 2 && (
        <ul className="mt-2 flex flex-col gap-1">
          {searching && <li className="px-1 py-1 text-xs text-text-faint">Scanning…</li>}
          {!searching && results.length === 0 && (
            <li className="px-1 py-1 text-xs text-text-faint">No governors found.</li>
          )}
          {results.map((r) => (
            <li key={r.userId}>
              <button
                type="button"
                onClick={() => {
                  onOpen(r.userId, r.callsign)
                  setQuery('')
                  setResults([])
                }}
                className="flex w-full items-center gap-2 border border-transparent px-2 py-1.5 text-left transition-colors hover:border-panel-border hover:bg-slate-900/40"
              >
                <Radio className="size-3.5 text-concord" aria-hidden="true" />
                <span className="font-display text-sm uppercase tracking-wide text-text">
                  {r.callsign}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function Thread({
  partner,
  messages,
  loading,
  onBack,
  onSent,
}: {
  partner: { userId: string; callsign: string }
  messages: ThreadMessage[]
  loading: boolean
  onBack: () => void
  onSent: () => void
}) {
  const [body, setBody] = useState('')
  const [pending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  function submit() {
    const text = body.trim()
    if (!text) return
    startTransition(async () => {
      const res = await sendDirectMessage(partner.userId, text)
      if (res.ok) {
        setBody('')
        onSent()
      } else {
        toast.error(res.error ?? 'Failed to send.')
      }
    })
  }

  return (
    <Panel grid className="flex h-[32rem] flex-col p-0">
      <div className="flex items-center gap-3 border-b border-panel-border px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex size-7 items-center justify-center border border-panel-border bg-slate-950/60 text-text-faint transition-colors hover:text-text clip-chevron-sm"
          aria-label="Back to transmissions"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <span className="font-display text-sm uppercase tracking-wide text-text">
          {partner.callsign}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="text-center text-xs text-text-faint">Loading channel…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-text-faint">
            No messages yet. Say something.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn('flex', m.isMine ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[75%] border px-3 py-2 text-sm clip-chevron-sm',
                  m.isMine
                    ? 'border-concord/40 bg-concord/10 text-text'
                    : 'border-panel-border bg-slate-950/60 text-text',
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <span className="mt-1 block text-right text-[0.6rem] text-text-faint">
                  {timeAgo(m.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <Composer
        value={body}
        onChange={setBody}
        onSubmit={submit}
        pending={pending}
        placeholder={`Message ${partner.callsign}…`}
      />
    </Panel>
  )
}

/* --------------------------------- Alliance -------------------------------- */

function AllianceTab({
  compact,
  messages,
  onChanged,
}: {
  compact: { id: string; name: string; tag: string } | null
  messages: CompactMessage[]
  onChanged: () => void
}) {
  const [body, setBody] = useState('')
  const [pending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  if (!compact) {
    return (
      <Panel grid className="p-8 text-center">
        <Users className="mx-auto mb-3 size-8 text-text-faint" aria-hidden="true" />
        <p className="text-sm text-text-faint">
          You are not in a Compact. Join or found one from the Compact screen to unlock alliance
          comms.
        </p>
      </Panel>
    )
  }

  function submit() {
    const text = body.trim()
    if (!text) return
    startTransition(async () => {
      const res = await sendCompactMessage(text)
      if (res.ok) {
        setBody('')
        onChanged()
      } else {
        toast.error(res.error ?? 'Failed to send.')
      }
    })
  }

  return (
    <Panel grid className="flex h-[32rem] flex-col p-0">
      <div className="flex items-center gap-2 border-b border-panel-border px-4 py-3">
        <span className="border border-crystal/40 bg-crystal/10 px-1.5 py-0.5 font-display text-[0.6rem] uppercase tracking-wide text-crystal">
          {compact.tag}
        </span>
        <span className="font-display text-sm uppercase tracking-wide text-text">
          {compact.name}
        </span>
        <span className="ml-auto text-[0.65rem] uppercase tracking-wide text-text-faint">
          Alliance channel
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-text-faint">
            No alliance chatter yet. Rally your Compact.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn('flex', m.isMine ? 'justify-end' : 'justify-start')}>
              <div className="max-w-[80%]">
                {!m.isMine && (
                  <span className="mb-0.5 block font-display text-[0.6rem] uppercase tracking-wide text-crystal">
                    {m.senderCallsign}
                  </span>
                )}
                <div
                  className={cn(
                    'border px-3 py-2 text-sm clip-chevron-sm',
                    m.isMine
                      ? 'border-crystal/40 bg-crystal/10 text-text'
                      : 'border-panel-border bg-slate-950/60 text-text',
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <span className="mt-1 block text-right text-[0.6rem] text-text-faint">
                    {timeAgo(m.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Composer
        value={body}
        onChange={setBody}
        onSubmit={submit}
        pending={pending}
        placeholder="Broadcast to your Compact…"
        variant="crystal"
      />
    </Panel>
  )
}

/* --------------------------------- Composer -------------------------------- */

function Composer({
  value,
  onChange,
  onSubmit,
  pending,
  placeholder,
  variant = 'concord',
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  pending: boolean
  placeholder: string
  variant?: 'concord' | 'crystal'
}) {
  return (
    <div className="flex items-end gap-2 border-t border-panel-border p-3">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
            e.preventDefault()
            onSubmit()
          }
        }}
        rows={1}
        maxLength={1000}
        placeholder={placeholder}
        className="max-h-32 min-h-[2.5rem] flex-1 resize-none border border-panel-border bg-slate-950/60 px-3 py-2 text-sm text-text outline-none placeholder:text-text-faint/60 focus:border-concord/60"
      />
      <ChevronButton
        variant={variant}
        size="default"
        onClick={onSubmit}
        disabled={pending || !value.trim()}
      >
        <Send className="size-3.5" aria-hidden="true" />
        Send
      </ChevronButton>
    </div>
  )
}
