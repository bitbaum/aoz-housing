import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { orders } from '@/db/schema'
import { requireCustomer, AuthError } from '@/lib/auth/guards'
import { formatRappen } from '@/lib/money'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { LogoutButton } from '@/components/auth/LogoutButton'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your account',
}

export default async function AccountPage() {
  let customer
  try {
    customer = await requireCustomer()
  } catch (error) {
    if (error instanceof AuthError) redirect('/login?next=/account')
    throw error
  }

  const myOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customer.id))
    .orderBy(desc(orders.createdAt))

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl">
            Hi {customer.firstName || customer.email.split('@')[0]}!
          </h1>
          <p className="mt-1 text-sm text-muted">{customer.email}</p>
        </div>
        <LogoutButton />
      </div>

      <section className="mt-10">
        <h2 className="font-heading text-2xl">Your orders</h2>
        {myOrders.length === 0 ? (
          <p className="mt-4 rounded border border-dashed border-line p-8 text-center text-muted">
            No orders yet — your first pair is waiting in the shop.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {myOrders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded border border-line p-4"
              >
                <div>
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p className="text-sm text-muted">
                    {order.createdAt.toLocaleDateString('en-CH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <OrderStatusBadge status={order.status} />
                  <span className="font-semibold">{formatRappen(order.totalRappen)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
