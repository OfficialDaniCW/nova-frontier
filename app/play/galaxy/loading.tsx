import { Skeleton } from '@/components/ui/skeleton'
import { Panel } from '@/components/game/panel'
import { CardGridSkeleton } from '@/components/game/panel-skeleton'

export default function GalaxyLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-7 w-40" />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <CardGridSkeleton count={6} />
        <Panel className="flex flex-col gap-3 p-4 opacity-60">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-8 w-full" />
        </Panel>
      </div>
    </div>
  )
}
