import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { orderItems, orders } from '@/db/schema'
import { allowedTransitions, isOrderStatus } from '@/lib/orders/status'
import { formatRappen } from '@/lib/money'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { OrderStatusActions } from '@/components/admin/OrderStatusActions'

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
  if (!order) notFound()

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id))
  const transitions = isOrderStatus(order.status) ? allowedTransitions(order.status) : []

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-muted hover:text-ink">
        ← All orders
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl">{order.orderNumber}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-muted">
        Placed {order.createdAt.toLocaleString('en-CH')} ·{' '}
        {order.customerId ? (
          <Link href={`/admin/customers/${order.customerId}`} className="text-gold-600 hover:underline">
            {order.email}
          </Link>
        ) : (
          order.email
        )}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="font-heading text-xl">Items</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-2">
                <span>
                  {item.quantity} × {item.productName} (size {item.size}
                  {item.color ? `, ${item.color}` : ''})
                </span>
                <span className="font-medium">
                  {formatRappen(item.unitPriceRappen * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatRappen(order.subtotalRappen)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Shipping ({order.shippingMethod.toLowerCase()})</dt>
              <dd>{order.shippingRappen === 0 ? 'Free' : formatRappen(order.shippingRappen)}</dd>
            </div>
            <div className="flex justify-between text-base font-bold">
              <dt>Total</dt>
              <dd>{formatRappen(order.totalRappen)}</dd>
            </div>
            <p className="text-xs text-muted">incl. {formatRappen(order.vatRappen)} VAT</p>
          </dl>
        </section>

        <div className="space-y-6">
          <section className="card">
            <h2 className="font-heading text-xl">Shipping address</h2>
            <address className="mt-3 text-sm not-italic text-ink">
              {order.shipName}
              <br />
              {order.shipStreet}
              <br />
              {order.shipZip} {order.shipCity}, {order.shipCountry}
            </address>
          </section>

          <section className="card">
            <h2 className="font-heading text-xl">Actions</h2>
            {transitions.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                This order is in a final state — nothing left to do.
              </p>
            ) : (
              <OrderStatusActions orderId={order.id} transitions={[...transitions]} />
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
