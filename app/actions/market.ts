'use server'

import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { colonies, marketOrders } from '@/lib/db/schema'
import { getUserId } from '@/lib/game/session'
import { ensurePlayerBootstrapped } from '@/lib/game/bootstrap'
import { runTick } from '@/lib/game/tick'
import { canAfford, subtractCost, projectColonyResources } from '@/lib/game/resources'
import { revalidatePath } from 'next/cache'

export async function getMarketState() {
  const userId = await getUserId()
  await runTick()
  const { colony } = await ensurePlayerBootstrapped(userId)

  const openOrders = await db
    .select()
    .from(marketOrders)
    .where(eq(marketOrders.status, 'open'))
    .orderBy(desc(marketOrders.createdAt))
    .limit(50)

  const myOrders = await db
    .select()
    .from(marketOrders)
    .where(eq(marketOrders.userId, userId))
    .orderBy(desc(marketOrders.createdAt))
    .limit(20)

  const projected = colony ? projectColonyResources(colony) : null

  return { openOrders, myOrders, colony, projected }
}

export async function postSellOrder(
  resource: 'energy' | 'alloy' | 'crystal',
  quantity: number,
  pricePerUnit: number,
  paymentResource: 'energy' | 'alloy' | 'crystal',
) {
  const userId = await getUserId()
  await runTick()
  const { colony } = await ensurePlayerBootstrapped(userId)
  if (!colony) throw new Error('No colony found')

  if (quantity <= 0 || pricePerUnit <= 0) throw new Error('Invalid order')
  if (resource === paymentResource) throw new Error('Cannot trade a resource for itself')

  const projected = projectColonyResources(colony)
  const cost = { [resource]: quantity } as Record<string, number>
  if (!canAfford(projected, cost)) throw new Error('Insufficient resources to list')

  const remaining = subtractCost(projected, cost)
  await db
    .update(colonies)
    .set({ ...remaining, lastTickAt: new Date() })
    .where(eq(colonies.id, colony.id))

  await db.insert(marketOrders).values({
    id: `mkt_${crypto.randomUUID()}`,
    userId,
    colonyId: colony.id,
    side: 'sell',
    resource,
    quantity,
    remainingQuantity: quantity,
    pricePerUnit,
    paymentResource,
    status: 'open',
  })

  revalidatePath('/play/trade')
  return { ok: true }
}

export async function cancelOrder(orderId: string) {
  const userId = await getUserId()
  const [order] = await db
    .select()
    .from(marketOrders)
    .where(and(eq(marketOrders.id, orderId), eq(marketOrders.userId, userId)))
    .limit(1)
  if (!order || order.status !== 'open') throw new Error('Order not cancellable')

  const [colony] = await db.select().from(colonies).where(eq(colonies.id, order.colonyId)).limit(1)
  if (colony) {
    const projected = projectColonyResources(colony)
    const refundKey = order.resource as 'energy' | 'alloy' | 'crystal'
    await db
      .update(colonies)
      .set({
        ...projected,
        [refundKey]: (projected as Record<string, number>)[refundKey] + order.remainingQuantity,
        lastTickAt: new Date(),
      })
      .where(eq(colonies.id, colony.id))
  }

  await db.update(marketOrders).set({ status: 'cancelled' }).where(eq(marketOrders.id, orderId))
  revalidatePath('/play/trade')
  return { ok: true }
}
