import { Skeleton } from '@/components/ui/skeleton'
import { CardGridSkeleton } from '@/components/game/panel-skeleton'

export default function FabricationLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-56" />
      </div>
      <CardGridSkeleton count={5} />
    </div>
  )
}
