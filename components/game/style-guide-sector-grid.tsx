'use client'

import { SectorCard } from '@/components/game/sector-card'
import type { SectorDef } from '@/lib/game-data'

interface StyleGuideSectorGridProps {
  sectors: SectorDef[]
}

/**
 * Thin client boundary so the (non-interactive) style guide page can stay
 * a server component while still rendering the interactive SectorCard,
 * whose onSelect handler cannot be passed across the server/client
 * boundary directly. Maps the static style-guide SectorDef shape onto the
 * real SectorView shape SectorCard now expects.
 */
export function StyleGuideSectorGrid({ sectors }: StyleGuideSectorGridProps) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-3">
      {sectors.map((sector) => (
        <SectorCard
          key={sector.id}
          sector={{
            id: sector.id,
            name: sector.name,
            faction: sector.faction,
            garrisonStrength: sector.garrison.reduce((sum, g) => sum + g.count, 0),
            positionX: sector.x,
            positionY: sector.y,
            ownerUserId: null,
            isMine: false,
          }}
          onSelect={() => {}}
        />
      ))}
    </div>
  )
}
