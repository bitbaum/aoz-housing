import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { contactInquiries } from '@/db/schema'
import { INQUIRY_STATUSES } from '@/config/database'
import { InquiryStatusButtons } from '@/components/admin/InquiryStatusButtons'
import { INQUIRY_STATUS_LABELS as STATUS_LABELS } from '@/config/labels'

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const statusFilter =
    status && (INQUIRY_STATUSES as readonly string[]).includes(status) ? status : null

  const rows = await db
    .select()
    .from(contactInquiries)
    .where(statusFilter ? eq(contactInquiries.status, statusFilter) : undefined)
    .orderBy(desc(contactInquiries.createdAt))
    .limit(100)

  return (
    <div>
      <h1 className="font-heading text-3xl">Inquiries</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/inquiries"
          className={`inline-flex min-h-[44px] items-center rounded border px-3 py-1 text-sm font-medium ${
            !statusFilter ? 'border-gold-500 bg-gold-50 text-gold-700' : 'border-line text-muted'
          }`}
        >
          All
        </Link>
        {INQUIRY_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/inquiries?status=${status}`}
            className={`inline-flex min-h-[44px] items-center rounded border px-3 py-1 text-sm font-medium ${
              statusFilter === status
                ? 'border-gold-500 bg-gold-50 text-gold-700'
                : 'border-line text-muted'
            }`}
          >
            {STATUS_LABELS[status]}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 rounded border border-dashed border-line p-8 text-center text-muted">
          Inbox zero — nothing here.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((inquiry) => (
            <li key={inquiry.id} className="rounded border border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{inquiry.subject}</p>
                  <p className="text-sm text-muted">
                    {inquiry.name} ·{' '}
                    <a href={`mailto:${inquiry.email}`} className="hover:text-gold-600">
                      {inquiry.email}
                    </a>
                    {inquiry.customerId && (
                      <>
                        {' · '}
                        <Link
                          href={`/admin/customers/${inquiry.customerId}`}
                          className="text-gold-600 hover:underline"
                        >
                          customer record
                        </Link>
                      </>
                    )}
                    {' · '}
                    {inquiry.createdAt.toLocaleString('en-CH')}
                  </p>
                </div>
                <InquiryStatusButtons inquiryId={inquiry.id} current={inquiry.status} />
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{inquiry.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
