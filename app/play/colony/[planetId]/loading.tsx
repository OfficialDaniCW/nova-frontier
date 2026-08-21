import { Skeleton } from '@/components/ui/skeleton'
import { CardGridSkeleton } from '@/components/game/panel-skeleton'

export default function ColonyLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-7 w-56" />
        </div>
      </div>
      <CardGridSkeleton count={6} />
    </div>
  )
}
