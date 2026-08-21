'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Telescope, Globe2, Lock, Sparkles, Radar } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { ChevronButton } from '@/components/game/chevron-button'
import { SectorDetailPanel } from '@/components/game/sector-detail-panel'
import { InfoTooltip } from '@/components/game/info-tooltip'
import { getGalaxyPlanetType, getPlanetTrait, getSiteType } from '@/lib/game/galaxy'
import { FACTION_META, type Faction } from '@/lib/faction-meta'
import { cn } from '@/lib/utils'
import { surveySystem } from '@/app/actions/fleet'
import type { SystemDetail, SystemPlanet } from '@/lib/game/discovery'
import type { SectorView } from '@/components/game/sector-card'

interface ShipRow {
  shipType: string
  count: number
}

interface SystemDetailPanelProps {
  detail: SystemDetail
  resourceCaches: Record<string, { energy?: number; alloy?: number; crystal?: number }>
  shipRows: ShipRow[]
  currentUserId: string
  compactMateUserIds: string[]
  hasScoutProbe: boolean
  hasHauler: boolean
}

function planetToSectorView(
  planet: SystemPlanet,
  currentUserId: string,
  compactMateUserIds: string[],
): SectorView {
  return {
    id: planet.id,
    name: planet.name,
    faction: planet.faction as Faction,
    garrisonStrength: planet.garrisonStrength,
    bloomIntensity: planet.bloomIntensity,
    positionX: planet.slot,
    positionY: planet.slot,
    ownerUserId: planet.ownerUserId,
    isMine: planet.ownerUserId === currentUserId,
    isCompactMate:
      !!planet.ownerUserId &&
      planet.ownerUserId !== currentUserId &&
      compactMateUserIds.includes(planet.ownerUserId),
  }
}

export function SystemDetailPanel({
  detail,
  resourceCaches,
  shipRows,
  currentUserId,
  compactMateUserIds,
  hasScoutProbe,
  hasHauler,
}: SystemDetailPanelProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null)

  const { system, discovery, isHome, planets } = detail
  const surveyed = discovery === 'surveyed'
  const site = getSiteType(system.siteType)

  async function handleSurvey() {
    setBusy(true)
    try {
      const res = await surveySystem(system.id)
      toast.success(`Survey fleet dispatched — ETA ${Math.round(res.etaSec ?? 0)}s`)
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Survey failed')
    } finally {
      setBusy(false)
    }
  }

  const selectedPlanet = planets.find((p) => p.id === selectedPlanetId)

  return (
    <div className="flex flex-col gap-4">
      <Panel grid scanline className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
              {system.quadrant.toUpperCase()} · {system.positionX.toString().padStart(2, '0')}.
              {system.positionY.toString().padStart(2, '0')}
            </p>
            <h2 className="font-display text-lg font-semibold text-text">
              {surveyed ? system.name : 'Unsurveyed System'}
            </h2>
          </div>
          <span
            className={cn(
              'flex items-center gap-1.5 border px-2.5 py-1 clip-chevron-sm font-display text-[0.65rem] font-semibold uppercase tracking-wide',
              isHome ? 'border-concord/50 bg-concord/10 text-concord' : 'border-panel-border text-text-dim',
            )}
          >
            {isHome ? <Sparkles className="size-3.5" /> : <Globe2 className="size-3.5" />}
            {isHome ? 'Home System' : `${planets.length} bodies`}
          </span>
        </div>

        {site && (
          <div className="flex items-start gap-2 border border-crystal/30 bg-crystal/5 p-2.5">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-crystal" aria-hidden="true" />
            <div>
              <p className="font-display text-[0.7rem] uppercase tracking-wide text-crystal">
                {site.name}
              </p>
              <p className="font-mono text-[0.65rem] text-text-dim">{site.blurb}</p>
            </div>
          </div>
        )}

        {!surveyed ? (
          <div className="flex flex-col gap-3">
            <p className="flex items-center gap-2 font-mono text-xs text-text-dim">
              <Lock className="size-3.5 text-text-faint" aria-hidden="true" />
              This system is detected but uncharted. Dispatch a survey probe to reveal its{' '}
              {planets.length} planet(s), their owners, and resource yields.
            </p>
            <div className="flex items-center gap-2">
              <ChevronButton
                variant="concord"
                size="sm"
                locked={busy || !hasScoutProbe}
                lockedReason={!hasScoutProbe ? 'No scout probes in hangar.' : undefined}
                onClick={handleSurvey}
              >
                <Telescope className="size-3.5" aria-hidden="true" />
                Survey System
              </ChevronButton>
              <InfoTooltip label="What does Survey do?">
                Sends a scout probe to chart the system, permanently revealing every planet, its
                garrison, faction, and resource cache. Anomaly and derelict sites also drop a
                one-off resource cache on arrival.
              </InfoTooltip>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="font-display text-[0.65rem] uppercase tracking-wide text-text-faint">
              Planets
            </span>
            <div className="flex flex-col gap-1.5">
              {planets.map((planet) => {
                const meta = FACTION_META[planet.faction as Faction] ?? FACTION_META.unclaimed
                const ptype = getGalaxyPlanetType(planet.planetType)
                const selected = planet.id === selectedPlanetId
                return (
                  <button
                    key={planet.id}
                    type="button"
                    onClick={() => setSelectedPlanetId(selected ? null : planet.id)}
                    className={cn(
                      'flex items-center justify-between gap-2 border px-3 py-2 text-left transition-colors clip-chevron-sm',
                      selected
                        ? 'border-primary bg-primary/10'
                        : 'border-panel-border hover:border-panel-border/80 hover:bg-slate-900/40',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn('size-2 rounded-full', meta.bgClass)}
                        style={{ backgroundColor: `var(--${meta.statColor})` }}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-display text-xs text-text">{planet.name}</p>
                        <p className="font-mono text-[0.6rem] uppercase tracking-wide text-text-faint">
                          {ptype.name}
                          {planet.isMine
                            ? ' · yours'
                            : planet.ownerCallsign
                              ? ` · ${planet.ownerCallsign}`
                              : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {planet.traits.map((t) => {
                        const trait = getPlanetTrait(t)
                        if (!trait) return null
                        return (
                          <span
                            key={t}
                            title={trait.blurb}
                            className="rounded-sm border border-crystal/30 bg-crystal/5 px-1 py-0.5 font-mono text-[0.5rem] uppercase text-crystal"
                          >
                            {trait.name.split(' ')[0]}
                          </span>
                        )
                      })}
                    </div>
                  </button>
                )
              })}
            </div>
            {!selectedPlanet && (
              <p className="flex items-center gap-1.5 pt-1 font-mono text-[0.6rem] text-text-faint">
                <Radar className="size-3" aria-hidden="true" />
                Select a planet to scout, attack, cleanse, salvage, or colonize it.
              </p>
            )}
          </div>
        )}
      </Panel>

      {selectedPlanet && (
        <SectorDetailPanel
          sector={planetToSectorView(selectedPlanet, currentUserId, compactMateUserIds)}
          resourceCache={resourceCaches[selectedPlanet.id] ?? {}}
          shipRows={shipRows}
          hasScoutProbe={hasScoutProbe}
          hasHauler={hasHauler}
        />
      )}
    </div>
  )
}
