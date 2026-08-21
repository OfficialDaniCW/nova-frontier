'use client'

import { useEffect, useState } from 'react'

/**
 * Live instrument-cluster readout for the command header: a running
 * mission clock plus a pulsing "uplink stable" status light. Purely
 * cosmetic telemetry that sells the control-centre feel; it renders a
 * stable placeholder on the server to avoid hydration drift.
 */
export function SystemTelemetry() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const clock = now
    ? now.toLocaleTimeString('en-GB', { hour12: false })
    : '--:--:--'

  // Stardate: a whimsical but stable derivation from the real date.
  const stardate = now
    ? (
        41000 +
        (now.getMonth() * 30 + now.getDate()) +
        now.getHours() / 24
      ).toFixed(1)
    : '----.-'

  return (
    <div className="hidden items-center gap-3 lg:flex" role="status" aria-label="System telemetry">
      <div className="flex items-center gap-1.5">
        <span className="status-dot size-2 rounded-full bg-bloom" aria-hidden="true" />
        <span className="font-display text-[0.6rem] uppercase tracking-[0.15em] text-bloom">
          Uplink stable
        </span>
      </div>
      <span className="h-3 w-px bg-panel-border" aria-hidden="true" />
      <div className="flex items-center gap-2 font-mono text-[0.7rem] tabular-nums text-text-dim">
        <span className="text-text-faint">SD</span>
        <span className="text-text">{stardate}</span>
        <span className="text-concord">{clock}</span>
      </div>
    </div>
  )
}
