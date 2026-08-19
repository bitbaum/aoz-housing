import Link from 'next/link'
import { count, desc, eq, gte, inArray, lte, sum } from 'drizzle-orm'
import { db } from '@/db'
import { contactInquiries, customers, orders, productVariants } from '@/db/schema'
import { OPEN_ORDER_STATUSES } from '@/lib/orders/status'
import { formatRappen } from '@/lib/money'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'

const LOW_STOCK_THRESHOLD = 3

export default async function AdminDashboardPage() {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [openOrders, monthRevenue, customerCount, newInquiries, lowStock, recentOrders] =
    await Promise.all([
      db
        .select({ n: count() })
        .from(orders)
        .where(inArray(orders.status, [...OPEN_ORDER_STATUSES])),
      db
        .select({ total: sum(orders.totalRappen) })
        .from(orders)
        .where(gte(orders.createdAt, monthStart)),
      db.select({ n: count() }).from(customers),
      db
        .select({ n: count() })
        .from(contactInquiries)
        .where(eq(contactInquiries.status, 'NEW')),
      db
        .select({ n: count() })
        .from(productVariants)
        .where(lte(productVariants.stockQty, LOW_STOCK_THRESHOLD)),
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(5),
    ])

  const stats = [
    { label: 'Open orders', value: String(openOrders[0].n), href: '/admin/orders' },
    {
      label: 'Revenue this month',
      value: formatRappen(Number(monthRevenue[0].total ?? 0)),
      href: '/admin/orders',
    },
    { label: 'Customers', value: String(customerCount[0].n), href: '/admin/customers' },
    { label: 'New inquiries', value: String(newInquiries[0].n), href: '/admin/inquiries' },
    {
      label: `Variants low on stock (≤${LOW_STOCK_THRESHOLD})`,
      value: String(lowStock[0].n),
      href: '/admin/products',
    },
  ]

  return (
    <div>
      <h1 className="font-heading text-3xl">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="card block">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="font-heading text-2xl">Latest orders</h2>
        {recentOrders.length === 0 ? (
          <p className="mt-4 text-muted">No orders yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-line p-4 hover:bg-subtle"
                >
                  <span className="font-medium">{order.orderNumber}</span>
                  <span className="text-sm text-muted">{order.shipName}</span>
                  <span className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <span className="font-semibold">{formatRappen(order.totalRappen)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
