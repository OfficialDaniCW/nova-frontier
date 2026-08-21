import { getGalaxyState } from '@/app/actions/fleet'
import { getUserId } from '@/lib/game/session'
import { Panel } from '@/components/game/panel'
import { FleetTransitList } from '@/components/game/fleet-transit-list'
import { SHIP_DEFS } from '@/lib/game/definitions'

export default async function FleetPage() {
  const userId = await getUserId()
  const { shipRows, activeFleets, sectors, recentCombat } = await getGalaxyState()

  const fleetViews = activeFleets.map((f) => ({
    id: f.id,
    sectorId: f.sectorId,
    sectorName: sectors.find((s) => s.id === f.sectorId)?.name ?? 'Unknown sector',
    mission: f.mission,
    arrivesAt: f.arrivesAt.toISOString(),
    shipCounts: f.shipCounts as Record<string, number>,
  }))

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <p className="font-mono text-[0.65rem] uppercase tracking-wide text-text-faint">
          Hangar Roster · Governor {userId.slice(0, 8)}
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-wide text-text">Fleet Command</h1>
      </div>

      <Panel grid className="flex flex-col gap-3 p-5">
        <h2 className="font-display text-xs uppercase tracking-wide text-text-faint">Hangar</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SHIP_DEFS.map((def) => {
            const row = shipRows.find((s) => s.shipType === def.id)
            const Icon = def.icon
            return (
              <div
                key={def.id}
                className="flex items-center gap-3 border border-panel-border/60 bg-slate-950/40 p-3"
              >
                <Icon className="size-5 shrink-0 text-concord" aria-hidden="true" />
                <div>
                  <p className="font-display text-xs text-text">{def.name}</p>
                  <p className="font-mono text-sm tabular-nums text-text-dim">{row?.count ?? 0}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      <FleetTransitList fleets={fleetViews} />

      <Panel grid className="flex flex-col gap-3 p-5">
        <h2 className="font-display text-xs uppercase tracking-wide text-text-faint">Recent engagements</h2>
        {recentCombat.length === 0 ? (
          <p className="font-mono text-xs text-text-faint">No combat reports on file.</p>
        ) : (
          <ul className="flex flex-col">
            {recentCombat.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-panel-border/40 py-2 last:border-0"
              >
                <span className="font-display text-xs uppercase tracking-wide text-text">
                  {log.sectorName}
                </span>
                <span
                  className={`font-mono text-xs uppercase tracking-wide ${
                    log.outcome === 'win' ? 'text-concord' : 'text-obsidian'
                  }`}
                >
                  {log.outcome === 'win' ? 'Victory' : 'Defeat'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
