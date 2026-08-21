import { Skeleton } from '@/components/ui/skeleton'
import { ListPanelSkeleton } from '@/components/game/panel-skeleton'

export default function FleetLoading() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-48" />
      </div>
      <ListPanelSkeleton rows={5} />
    </div>
  )
}
