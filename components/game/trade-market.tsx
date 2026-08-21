'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Zap, Layers, Gem, X, ArrowRightLeft } from 'lucide-react'
import { Panel } from '@/components/game/panel'
import { ChevronButton } from '@/components/game/chevron-button'
import { ResourcePill, type ResourceType } from '@/components/game/resource-pill'
import { postSellOrder, cancelOrder } from '@/app/actions/market'

const RESOURCE_ICON: Record<ResourceType, typeof Zap> = {
  energy: Zap,
  alloy: Layers,
  crystal: Gem,
}

interface OrderRow {
  id: string
  userId: string
  resource: string
  quantity: number
  remainingQuantity: number
  pricePerUnit: number
  paymentResource: string
  status: string
  createdAt: string | Date
}

interface TradeMarketProps {
  openOrders: OrderRow[]
  myOrders: OrderRow[]
  resources: { energy: number; alloy: number; crystal: number }
  currentUserId: string
}

export function TradeMarket({ openOrders, myOrders, resources, currentUserId }: TradeMarketProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [resource, setResource] = useState<ResourceType>('crystal')
  const [payment, setPayment] = useState<ResourceType>('energy')
  const [quantity, setQuantity] = useState(50)
  const [price, setPrice] = useState(2)
  const [orderFilter, setOrderFilter] = useState<'all' | ResourceType>('all')

  const visibleOpenOrders =
    orderFilter === 'all' ? openOrders : openOrders.filter((o) => o.resource === orderFilter)

  function submitOrder() {
    startTransition(async () => {
      try {
        await postSellOrder(resource, quantity, price, payment)
        toast.success('Sell order posted to the exchange.')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to post order')
      }
    })
  }

  function cancel(orderId: string) {
    startTransition(async () => {
      try {
        await cancelOrder(orderId)
        toast('Order cancelled, resources refunded.')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to cancel order')
      }
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <Panel grid className="flex flex-col gap-4 p-4 sm:p-5">
        <h2 className="font-display text-sm uppercase tracking-wide text-foreground">
          Post Sell Order
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {(['energy', 'alloy', 'crystal'] as ResourceType[]).map((r) => {
            const Icon = RESOURCE_ICON[r]
            return (
              <button
                key={r}
                type="button"
                onClick={() => setResource(r)}
                className={`clip-chevron-sm flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors ${
                  resource === r
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-panel-border text-text-dim hover:text-foreground'
                }`}
              >
                <Icon className="size-3.5" />
                {r}
              </button>
            )
          })}
        </div>
        <div className="flex items-center justify-center text-text-faint">
          <ArrowRightLeft className="size-4" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['energy', 'alloy', 'crystal'] as ResourceType[])
            .filter((r) => r !== resource)
            .map((r) => {
              const Icon = RESOURCE_ICON[r]
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setPayment(r)}
                  className={`clip-chevron-sm flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors ${
                    payment === r
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-panel-border text-text-dim hover:text-foreground'
                  }`}
                >
                  <Icon className="size-3.5" />
                  {r}
                </button>
              )
            })}
        </div>

        <label className="flex flex-col gap-1.5 font-mono text-xs uppercase tracking-wide text-text-dim">
          Quantity to sell
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="border border-panel-border bg-slate-950/60 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5 font-mono text-xs uppercase tracking-wide text-text-dim">
          Price per unit (in {payment})
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={price}
            onChange={(e) => setPrice(Math.max(0.1, Number(e.target.value)))}
            className="border border-panel-border bg-slate-950/60 px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"
          />
        </label>

        <p className="font-mono text-xs text-text-faint">
          In stock: {Math.floor(resources[resource])} {resource}
        </p>

        <ChevronButton onClick={submitOrder} disabled={isPending} className="w-full justify-center">
          Post Order
        </ChevronButton>
      </Panel>

      <div className="flex flex-col gap-4">
        {myOrders.length > 0 && (
          <Panel grid className="p-4 sm:p-5">
            <h2 className="mb-3 font-display text-sm uppercase tracking-wide text-foreground">
              My Orders
            </h2>
            <ul className="flex flex-col gap-2">
              {myOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-3 border border-panel-border bg-slate-950/40 px-3 py-2"
                >
                  <span className="font-mono text-sm text-foreground">
                    {order.remainingQuantity}/{order.quantity} {order.resource} @ {order.pricePerUnit}{' '}
                    {order.paymentResource}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[0.65rem] uppercase tracking-wide ${
                        order.status === 'open' ? 'text-primary' : 'text-text-faint'
                      }`}
                    >
                      {order.status}
                    </span>
                    {order.status === 'open' && (
                      <button
                        type="button"
                        onClick={() => cancel(order.id)}
                        disabled={isPending}
                        className="text-text-dim transition-colors hover:text-destructive"
                        aria-label="Cancel order"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <Panel grid className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-sm uppercase tracking-wide text-foreground">
              Open Exchange Orders
            </h2>
            {openOrders.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setOrderFilter('all')}
                  className={`clip-chevron-sm border px-2 py-1 font-mono text-[0.65rem] uppercase tracking-wide transition-colors ${
                    orderFilter === 'all'
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-panel-border text-text-dim hover:text-foreground'
                  }`}
                >
                  All
                </button>
                {(['energy', 'alloy', 'crystal'] as ResourceType[]).map((r) => {
                  const Icon = RESOURCE_ICON[r]
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setOrderFilter(r)}
                      className={`clip-chevron-sm flex items-center gap-1 border px-2 py-1 font-mono text-[0.65rem] uppercase tracking-wide transition-colors ${
                        orderFilter === r
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-panel-border text-text-dim hover:text-foreground'
                      }`}
                    >
                      <Icon className="size-3" />
                      {r}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          {openOrders.length === 0 ? (
            <p className="py-6 text-center font-mono text-sm text-text-dim">
              No open orders. Post the first sell order to seed the market.
            </p>
          ) : visibleOpenOrders.length === 0 ? (
            <p className="py-6 text-center font-mono text-sm text-text-dim">
              No open orders for this resource.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {visibleOpenOrders.map((order) => {
                const Icon = RESOURCE_ICON[order.resource as ResourceType] ?? Zap
                const isMine = order.userId === currentUserId
                return (
                  <li
                    key={order.id}
                    className="flex items-center justify-between gap-3 border border-panel-border bg-slate-950/40 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-text-dim" />
                      <span className="font-mono text-sm text-foreground">
                        {order.remainingQuantity} {order.resource} @ {order.pricePerUnit}{' '}
                        {order.paymentResource}/ea
                      </span>
                    </div>
                    {isMine && <span className="font-mono text-[0.65rem] text-primary">YOURS</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
