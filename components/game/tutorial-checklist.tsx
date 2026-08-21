'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, X, BookOpen } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { dismissTutorial } from '@/app/actions/tutorial'
import type { TutorialProgress } from '@/lib/game/tutorial'
import { cn } from '@/lib/utils'

const STEPS: { key: keyof TutorialProgress; label: string; href: string }[] = [
  { key: 'upgradedBuilding', label: 'Upgrade a building on Colony Systems', href: '/play/colony' },
  { key: 'queuedResearch', label: 'Queue a technology in Research', href: '/play/research' },
  { key: 'fabricatedShip', label: 'Fabricate a ship in Fabrication', href: '/play/fabrication' },
  { key: 'launchedFleet', label: 'Send a fleet from the Star Chart', href: '/play/galaxy' },
  { key: 'postedTrade', label: 'Post an order on the Trade exchange', href: '/play/trade' },
]

export function TutorialChecklist({ progress }: { progress: TutorialProgress }) {
  const [hidden, setHidden] = useState(false)
  const [, startTransition] = useTransition()

  if (hidden) return null

  const doneCount = STEPS.filter((s) => progress[s.key]).length
  const allDone = doneCount === STEPS.length

  return (
    <Panel grid className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-wide text-concord">
            First Transmission — Governor Orientation
          </p>
          <p className="mt-1 font-mono text-[0.7rem] text-text-faint">
            {allDone
              ? 'All core systems tested. Command is yours, Governor.'
              : `${doneCount}/${STEPS.length} systems verified.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setHidden(true)
            startTransition(() => dismissTutorial())
          }}
          aria-label="Dismiss checklist"
          className="flex size-6 shrink-0 items-center justify-center text-text-faint transition-colors hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {STEPS.map((step) => {
          const done = progress[step.key]
          return (
            <li key={step.key}>
              <Link
                href={step.href}
                className={cn(
                  'flex items-center gap-2.5 border border-transparent px-2 py-1.5 font-mono text-xs transition-colors',
                  done ? 'text-text-faint' : 'text-text hover:border-panel-border hover:text-concord',
                )}
              >
                {done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-concord" aria-hidden="true" />
                ) : (
                  <Circle className="size-4 shrink-0 text-text-faint" aria-hidden="true" />
                )}
                <span className={cn(done && 'line-through')}>{step.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>

      <Link
        href="/play/codex"
        className="mt-4 flex items-center gap-1.5 border-t border-panel-border/60 pt-3 font-mono text-xs text-concord hover:underline"
      >
        <BookOpen className="size-3.5" aria-hidden="true" />
        Read the Concord Codex — history, factions, full how-to-play guide
      </Link>
    </Panel>
  )
}
