import { getMarketState } from '@/app/actions/market'
import { getUserId } from '@/lib/game/session'
import { TradeMarket } from '@/components/game/trade-market'
import { Coins } from 'lucide-react'

export default async function TradePage() {
  const [userId, { openOrders, myOrders, projected }] = await Promise.all([
    getUserId(),
    getMarketState(),
  ])

  const serializedOpen = openOrders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }))
  const serializedMine = myOrders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }))

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Coins className="size-5 text-primary" />
        <h1 className="font-display text-lg uppercase tracking-wide text-foreground">
          Trade Exchange
        </h1>
      </div>
      <TradeMarket
        openOrders={serializedOpen}
        myOrders={serializedMine}
        resources={projected ?? { energy: 0, alloy: 0, crystal: 0 }}
        currentUserId={userId}
      />
    </div>
  )
}
