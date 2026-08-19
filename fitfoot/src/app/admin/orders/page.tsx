import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { orders } from '@/db/schema'
import { ORDER_STATUSES, isOrderStatus } from '@/lib/orders/status'
import { formatRappen } from '@/lib/money'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const statusFilter = status && isOrderStatus(status) ? status : null

  const rows = await db
    .select()
    .from(orders)
    .where(statusFilter ? eq(orders.status, statusFilter) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(100)

  return (
    <div>
      <h1 className="font-heading text-3xl">Orders</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`inline-flex min-h-[44px] items-center rounded border px-3 py-1 text-sm font-medium ${
            !statusFilter ? 'border-gold-500 bg-gold-50 text-gold-700' : 'border-line text-muted'
          }`}
        >
          All
        </Link>
        {ORDER_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/orders?status=${status}`}
            className={`inline-flex min-h-[44px] items-center rounded border px-3 py-1 text-sm font-medium ${
              statusFilter === status
                ? 'border-gold-500 bg-gold-50 text-gold-700'
                : 'border-line text-muted'
            }`}
          >
            {status}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 rounded border border-dashed border-line p-8 text-center text-muted">
          No orders here.
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {rows.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-line p-4 hover:bg-subtle"
              >
                <span>
                  <span className="font-medium">{order.orderNumber}</span>
                  <span className="block text-sm text-muted">
                    {order.shipName} · {order.email}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <span className="font-semibold">{formatRappen(order.totalRappen)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
