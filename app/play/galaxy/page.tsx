'use client'

import { useState } from 'react'
import { SectorCard } from '@/components/game/sector-card'
import { SectorDetailPanel } from '@/components/game/sector-detail-panel'
import { sectors } from '@/lib/game-data'

export default function GalaxyPage() {
  const [selectedId, setSelectedId] = useState<string>(sectors[0].id)
  const selected = sectors.find((s) => s.id === selectedId) ?? sectors[0]

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
          Halcyon Verge · Sector Survey
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-wide text-text">Star Chart</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sectors.map((sector) => (
            <SectorCard
              key={sector.id}
              sector={sector}
              selected={sector.id === selectedId}
              onSelect={setSelectedId}
            />
          ))}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectorDetailPanel sector={selected} />
        </div>
      </div>
    </div>
  )
}
