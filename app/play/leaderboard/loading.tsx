import { Skeleton } from '@/components/ui/skeleton'
import { ListPanelSkeleton } from '@/components/game/panel-skeleton'

export default function LeaderboardLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="h-5 w-48" />
      </div>
      <ListPanelSkeleton rows={6} />
    </div>
  )
}
