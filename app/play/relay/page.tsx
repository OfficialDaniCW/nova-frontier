import { getRelayState } from '@/app/actions/relay'
import { RelayPanel } from '@/components/game/relay-panel'
import { MessageSquare } from 'lucide-react'

export default async function RelayPage() {
  const state = await getRelayState()

  const conversations = state.conversations.map((c) => ({
    ...c,
    lastAt: c.lastAt.toISOString(),
  }))
  const compactMessages = state.compactMessages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }))

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-5 text-primary" />
        <h1 className="font-display text-lg uppercase tracking-wide text-foreground">Relay</h1>
      </div>
      <p className="text-sm text-text-faint">
        Open direct channels with other governors or broadcast to your Compact.
      </p>

      <RelayPanel
        myCallsign={state.myCallsign}
        conversations={conversations}
        compact={state.compact}
        compactMessages={compactMessages}
      />
    </div>
  )
}
