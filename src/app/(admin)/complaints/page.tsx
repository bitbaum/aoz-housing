import type { Metadata } from 'next'
import { db, complaint } from '@/lib/db'
import { asc, desc } from 'drizzle-orm'
import { requirePermission } from '@/lib/auth'
import { PageHeader } from '@/components/ui/Page'
import { SubmitButton } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { residentName } from '@/lib/utils/resident-name'
import {
  COMPLAINT_LABELS as C,
  COMPLAINT_STATUS_BADGES,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_SUBJECT_LABELS,
} from '@/lib/constants/labels'
import { respondToComplaint } from '@/lib/actions/complaints'

export const metadata: Metadata = { title: C.staffTitle }
export const dynamic = 'force-dynamic'

/**
 * Complaints about the organisation.
 *
 * `complaints:read` — held by `isSystemAdmin` alone. Not by any care role, and
 * deliberately NOT widened by `ALL_DOMAINS`: the person with oversight over
 * every care domain is one of the people a complaint can be about.
 * @see lib/auth/role-policy.ts — COMPLAINT_PERMISSIONS
 */
export default async function ComplaintsPage() {
  await requirePermission('complaints:read')

  const complaints = await db.query.complaint.findMany({
    orderBy: [asc(complaint.status), desc(complaint.createdAt)],
    columns: {
      id: true,
      createdAt: true,
      subject: true,
      body: true,
      status: true,
      response: true,
      respondedAt: true,
    },
    with: {
      // An anonymous complaint has no resident, and the null IS the anonymity —
      // there is nothing here to redact later because nothing was written.
      resident: { columns: { code: true, displayName: true } },
      respondedBy: { columns: { name: true } },
    },
  })

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={C.staffTitle} description={C.staffSubtitle} />

      {complaints.length === 0 ? (
        <p className="text-ui-muted">{C.staffEmpty}</p>
      ) : (
        <ul className="space-y-4">
          {complaints.map((complaint) => (
            <li key={complaint.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">{COMPLAINT_SUBJECT_LABELS[complaint.subject]}</p>
                  <p className="text-xs text-ui-muted mt-1">
                    {C.filedOn} {formatDate(complaint.createdAt)} ·{' '}
                    {complaint.resident ? residentName(complaint.resident) : C.anonymousMarker}
                  </p>
                </div>
                <span className={COMPLAINT_STATUS_BADGES[complaint.status]}>
                  {COMPLAINT_STATUS_LABELS[complaint.status]}
                </span>
              </div>

              <p className="text-sm text-ui-text mt-3 whitespace-pre-wrap">{complaint.body}</p>

              {complaint.response ? (
                <div className="mt-4 border-t border-ui-border pt-3">
                  <p className="eyebrow">{C.respondLabel}</p>
                  <p className="text-sm text-ui-text mt-1 whitespace-pre-wrap">
                    {complaint.response}
                  </p>
                  <p className="text-xs text-ui-muted mt-1">
                    {C.respondedBy} {complaint.respondedBy?.name ?? '—'}
                    {complaint.respondedAt ? ` · ${formatDate(complaint.respondedAt)}` : ''}
                  </p>
                </div>
              ) : complaint.resident ? (
                <form action={respondToComplaint} className="mt-4 space-y-2">
                  <input type="hidden" name="complaintId" value={complaint.id} />
                  <label className="label" htmlFor={`response-${complaint.id}`}>
                    {C.respondLabel}
                  </label>
                  <textarea
                    id={`response-${complaint.id}`}
                    name="response"
                    className="input min-h-[90px]"
                    placeholder={C.respondPlaceholder}
                    required
                  />
                  <SubmitButton className="btn-primary min-h-[44px]">
                    {C.respondSubmit}
                  </SubmitButton>
                </form>
              ) : (
                // No form at all rather than a disabled one: there is nobody to
                // send an answer to, and offering the box would imply otherwise.
                <p className="text-xs text-ui-muted mt-4">{C.anonymousMarker}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
