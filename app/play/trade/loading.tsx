import { Skeleton } from '@/components/ui/skeleton'
import { Panel } from '@/components/game/panel'
import { ListPanelSkeleton } from '@/components/game/panel-skeleton'

export default function TradeLoading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Panel className="flex flex-col gap-4 p-4 opacity-60 sm:p-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-10 w-full" />
        </Panel>
        <ListPanelSkeleton rows={5} />
      </div>
    </div>
  )
}
