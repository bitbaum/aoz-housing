import Link from 'next/link'
import { count, desc, eq, ilike, or, sql, sum } from 'drizzle-orm'
import { db } from '@/db'
import { customers, orders } from '@/db/schema'
import { formatRappen } from '@/lib/money'

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const q = (await searchParams).q?.trim() ?? ''

  const rows = await db
    .select({
      id: customers.id,
      email: customers.email,
      firstName: customers.firstName,
      lastName: customers.lastName,
      role: customers.role,
      newsletterOptIn: customers.newsletterOptIn,
      createdAt: customers.createdAt,
      orderCount: count(orders.id),
      totalSpent: sum(orders.totalRappen),
    })
    .from(customers)
    .leftJoin(orders, eq(orders.customerId, customers.id))
    .where(
      q
        ? or(
            ilike(customers.email, `%${q}%`),
            ilike(customers.firstName, `%${q}%`),
            ilike(customers.lastName, `%${q}%`)
          )
        : undefined
    )
    .groupBy(customers.id)
    .orderBy(desc(sql`count(${orders.id})`), desc(customers.createdAt))
    .limit(100)

  return (
    <div>
      <h1 className="font-heading text-3xl">Customers</h1>

      <form method="get" className="mt-4 flex max-w-md gap-2">
        <label htmlFor="customer-search" className="sr-only">
          Search customers
        </label>
        <input
          id="customer-search"
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="input-field"
        />
        <button type="submit" className="btn-dark px-4 text-sm">
          Search
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="mt-8 rounded border border-dashed border-line p-8 text-center text-muted">
          No customers found.
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/customers/${row.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-line p-4 hover:bg-subtle"
              >
                <span>
                  <span className="font-medium">
                    {row.firstName || row.lastName
                      ? `${row.firstName} ${row.lastName}`.trim()
                      : row.email}
                  </span>
                  <span className="block text-sm text-muted">{row.email}</span>
                </span>
                <span className="flex items-center gap-3 text-sm">
                  {row.role !== 'CUSTOMER' && <span className="badge-gold">{row.role}</span>}
                  {row.newsletterOptIn && <span className="badge-neutral">Newsletter</span>}
                  <span className="text-muted">{row.orderCount} orders</span>
                  <span className="font-semibold">{formatRappen(Number(row.totalSpent ?? 0))}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
