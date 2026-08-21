import { Panel } from '@/components/game/panel'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** A card-shaped skeleton matching the Panel clip shape, used while a grid of cards loads. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Panel className={cn('flex flex-col gap-3 p-4 opacity-60', className)}>
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-2 w-full" />
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-10" />
      </div>
    </Panel>
  )
}

/** A grid of CardSkeletons, for screens whose main content is a card grid. */
export function CardGridSkeleton({
  count = 6,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

/** A skeleton for a list-style panel (comm log, leaderboard, order book rows). */
export function ListPanelSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Panel grid className="flex flex-col gap-2.5 p-4 opacity-60 sm:p-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-l-2 border-panel-border bg-slate-950/40 px-3 py-2.5">
          <Skeleton className="size-4 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
        </div>
      ))}
    </Panel>
  )
}
