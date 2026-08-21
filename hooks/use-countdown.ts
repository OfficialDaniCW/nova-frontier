'use client'

import { useEffect, useState } from 'react'

/**
 * Ticks down to a target timestamp (ms epoch), returning the remaining
 * milliseconds (never negative) and updating once per second.
 *
 * Returns `null` until the first client-side effect runs, so the
 * server-rendered markup and the initial client hydration pass always
 * agree (both render the "unknown yet" state) — the live value only
 * appears after hydration completes, avoiding a hydration mismatch from
 * time elapsing between server render and client mount.
 */
export function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, targetMs - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetMs])

  return remaining
}

export function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n: number) => n.toString().padStart(2, '0')

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(minutes)}:${pad(seconds)}`
}
