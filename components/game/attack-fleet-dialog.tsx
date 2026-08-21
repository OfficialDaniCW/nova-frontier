'use client'

import { useState } from 'react'
import { Swords } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronButton } from '@/components/game/chevron-button'
import { SHIP_DEFS } from '@/lib/game/definitions'

interface ShipRow {
  shipType: string
  count: number
}

interface AttackFleetDialogProps {
  sectorName: string
  shipRows: ShipRow[]
  onLaunch: (shipCounts: Record<string, number>) => Promise<void>
  disabled?: boolean
  lockedReason?: string
}

export function AttackFleetDialog({
  sectorName,
  shipRows,
  onLaunch,
  disabled,
  lockedReason,
}: AttackFleetDialogProps) {
  const [open, setOpen] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  const combatShips = SHIP_DEFS.filter((def) => {
    const row = shipRows.find((r) => r.shipType === def.id)
    return (row?.count ?? 0) > 0
  })

  const totalSelected = Object.values(counts).reduce((a, b) => a + (b || 0), 0)

  async function handleLaunch() {
    setSubmitting(true)
    try {
      await onLaunch(counts)
      setOpen(false)
      setCounts({})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <ChevronButton variant="obsidian" size="sm" locked={disabled} lockedReason={lockedReason}>
            <Swords className="size-3.5" aria-hidden="true" />
            Launch Attack
          </ChevronButton>
        }
      />

      <DialogContent className="border-panel-border bg-slate-950 font-sans">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide text-text">
            Dispatch attack fleet
          </DialogTitle>
          <DialogDescription className="text-text-dim">
            Assign hangar ships to strike {sectorName}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {combatShips.length === 0 && (
            <p className="font-mono text-xs text-text-faint">No combat-capable ships in the hangar.</p>
          )}
          {combatShips.map((def) => {
            const row = shipRows.find((r) => r.shipType === def.id)
            const max = row?.count ?? 0
            return (
              <div key={def.id} className="flex items-center justify-between gap-3">
                <Label htmlFor={`ship-${def.id}`} className="flex-1 text-xs text-text-dim">
                  {def.name} <span className="font-mono text-text-faint">(avail. {max})</span>
                </Label>
                <Input
                  id={`ship-${def.id}`}
                  type="number"
                  min={0}
                  max={max}
                  value={counts[def.id] ?? 0}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(max, Number(e.target.value) || 0))
                    setCounts((prev) => ({ ...prev, [def.id]: val }))
                  }}
                  className="w-20 border-panel-border bg-slate-950/60 text-right font-mono text-text"
                />
              </div>
            )
          })}
        </div>

        <DialogFooter>
          <ChevronButton
            variant="obsidian"
            onClick={handleLaunch}
            locked={totalSelected < 1 || submitting}
            lockedReason="Select at least one ship."
          >
            {submitting ? 'Launching…' : 'Launch Fleet'}
          </ChevronButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
