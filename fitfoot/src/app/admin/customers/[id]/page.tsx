import Link from 'next/link'
import { notFound } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { contactInquiries, crmNotes, customers, orders } from '@/db/schema'
import { formatRappen } from '@/lib/money'
import { requireStaff } from '@/lib/auth/guards'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { CrmNoteForm } from '@/components/admin/CrmNoteForm'
import { RoleSelect } from '@/components/admin/RoleSelect'

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const staff = await requireStaff()
  const { id } = await params
  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1)
  if (!customer) notFound()

  const [customerOrders, notes, inquiries] = await Promise.all([
    db.select().from(orders).where(eq(orders.customerId, customer.id)).orderBy(desc(orders.createdAt)),
    db
      .select({
        id: crmNotes.id,
        body: crmNotes.body,
        createdAt: crmNotes.createdAt,
        authorFirstName: customers.firstName,
        authorLastName: customers.lastName,
        authorEmail: customers.email,
      })
      .from(crmNotes)
      .innerJoin(customers, eq(crmNotes.authorId, customers.id))
      .where(eq(crmNotes.customerId, id))
      .orderBy(desc(crmNotes.createdAt)),
    db
      .select()
      .from(contactInquiries)
      .where(eq(contactInquiries.customerId, id))
      .orderBy(desc(contactInquiries.createdAt)),
  ])

  const totalSpent = customerOrders.reduce((n, o) => n + o.totalRappen, 0)
  const name =
    customer.firstName || customer.lastName
      ? `${customer.firstName} ${customer.lastName}`.trim()
      : customer.email

  return (
    <div>
      <Link href="/admin/customers" className="text-sm text-muted hover:text-ink">
        ← All customers
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl">{name}</h1>
        {staff.role === 'ADMIN' && staff.id !== customer.id ? (
          <RoleSelect customerId={customer.id} currentRole={customer.role} />
        ) : (
          customer.role !== 'CUSTOMER' && <span className="badge-gold">{customer.role}</span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">
        {customer.email}
        {customer.phone ? ` · ${customer.phone}` : ''} · joined{' '}
        {customer.createdAt.toLocaleDateString('en-CH')}
        {customer.newsletterOptIn ? ' · newsletter subscriber' : ''}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-muted">Orders</p>
          <p className="mt-1 text-2xl font-bold">{customerOrders.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted">Total spent</p>
          <p className="mt-1 text-2xl font-bold">{formatRappen(totalSpent)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted">Inquiries</p>
          <p className="mt-1 text-2xl font-bold">{inquiries.length}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="font-heading text-2xl">Order history</h2>
          {customerOrders.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {customerOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-2 rounded border border-line p-3 text-sm hover:bg-subtle"
                  >
                    <span className="font-medium">{order.orderNumber}</span>
                    <span className="flex items-center gap-3">
                      <OrderStatusBadge status={order.status} />
                      <span className="font-semibold">{formatRappen(order.totalRappen)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {inquiries.length > 0 && (
            <>
              <h2 className="mt-8 font-heading text-2xl">Inquiries</h2>
              <ul className="mt-3 space-y-2">
                {inquiries.map((inquiry) => (
                  <li key={inquiry.id} className="rounded border border-line p-3 text-sm">
                    <p className="font-medium">{inquiry.subject}</p>
                    <p className="mt-1 text-muted">{inquiry.message}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section>
          <h2 className="font-heading text-2xl">Notes</h2>
          <CrmNoteForm customerId={customer.id} />
          {notes.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No notes yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {notes.map((note) => (
                <li key={note.id} className="rounded border border-line p-3 text-sm">
                  <p className="whitespace-pre-wrap text-ink">{note.body}</p>
                  <p className="mt-2 text-xs text-muted">
                    {`${note.authorFirstName} ${note.authorLastName}`.trim() || note.authorEmail} ·{' '}
                    {note.createdAt.toLocaleString('en-CH')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
