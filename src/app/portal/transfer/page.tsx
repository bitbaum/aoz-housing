import type { Metadata } from 'next'
import {
  db,
  resident as residentTable,
  placement as placementTable,
  transferRequest,
  housingUnit,
} from '@/lib/db'
import { eq, and, ne, desc, asc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { TransferRequestForm } from '@/components/portal/TransferRequestForm'
import { buildTransferLabels } from '@/lib/i18n/portal-surfaces'
import { requireResidentCookie } from '@/lib/portal-auth'
import { PageHeader } from '@/components/ui/Page'
import { TRANSFER_REQUEST_STATUS_LABELS } from '@/lib/constants/labels/residents'
import { formatDate } from '@/lib/utils'
import { getRequestTranslator } from '@/lib/i18n/request'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestTranslator()
  return { title: t('nav.transfer') }
}

export default async function TransferPage() {
  const residentCode = await requireResidentCookie('/portal')
  const { t } = await getRequestTranslator()

  const resident = await db.query.resident.findFirst({
    where: eq(residentTable.code, residentCode),
    with: {
      placements: {
        where: eq(placementTable.status, 'ACTIVE'),
        limit: 1,
        with: {
          housingUnit: { columns: { id: true, code: true, address: true } },
        },
      },
      // The LATEST request, whatever its status — not just the pending one.
      // Filtering to PENDING made every staff decision vanish from the
      // resident's view the moment it was made, taking the staff note with
      // it: they were told "du wirst benachrichtigt" and then never were.
      transferRequests: {
        orderBy: [desc(transferRequest.createdAt)],
        limit: 1,
        columns: {
          id: true,
          createdAt: true,
          reason: true,
          status: true,
          staffNotes: true,
          reviewedAt: true,
        },
      },
    },
  })

  if (!resident) {
    redirect('/portal?error=account_not_found')
  }

  const placement = resident.placements[0]
  const latestRequest = resident.transferRequests[0]
  const pendingRequest = latestRequest?.status === 'PENDING' ? latestRequest : null
  // A decided request stays visible so the answer is readable, and the form
  // stays open underneath it so a new request is still possible.
  const decidedRequest = latestRequest && !pendingRequest ? latestRequest : null

  // Fetch available units for optional target selection (exclude current unit)
  const availableUnits = placement
    ? await db.query.housingUnit.findMany({
        where: and(
          eq(housingUnit.status, 'AVAILABLE'),
          ne(housingUnit.id, placement.housingUnit.id),
        ),
        columns: { id: true, code: true, address: true },
        orderBy: [asc(housingUnit.code)],
      })
    : []

  const L = buildTransferLabels(t)

  return (
    <div>
      <div className="mb-6">
        <PageHeader
          title={t('nav.transfer')}
          description={L.subtitle}
          backHref="/portal"
          backLabel={t('action.back')}
        />
      </div>

      {!placement ? (
        <div className="card text-center py-12">
          <p className="text-ui-muted">{L.noPlacement}</p>
        </div>
      ) : pendingRequest ? (
        <div className="card">
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-lg font-semibold text-ui-text mb-2">{L.pendingTitle}</h2>
            <p className="text-ui-muted max-w-md mx-auto">{L.pendingMessage}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {decidedRequest && (
            <div className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">{L.decisionTitle}</p>
                  <h2 className="text-lg font-semibold text-ui-text mt-1">
                    {TRANSFER_REQUEST_STATUS_LABELS[decidedRequest.status]}
                  </h2>
                </div>
                <span
                  className={decidedRequest.status === 'DENIED' ? 'chip-error' : 'chip-success'}
                >
                  {TRANSFER_REQUEST_STATUS_LABELS[decidedRequest.status]}
                </span>
              </div>

              <p className="text-sm text-ui-muted mt-3">
                {L.yourReason}: {decidedRequest.reason}
              </p>

              {decidedRequest.staffNotes && (
                <div className="mt-3 border-t border-ui-border pt-3">
                  <p className="eyebrow">{L.staffNote}</p>
                  <p className="text-sm text-ui-text mt-1">{decidedRequest.staffNotes}</p>
                </div>
              )}

              {decidedRequest.reviewedAt && (
                <p className="text-xs text-ui-muted mt-3">
                  {L.decidedOn} {formatDate(decidedRequest.reviewedAt)}
                </p>
              )}
            </div>
          )}

          <TransferRequestForm
            currentUnit={
              placement.housingUnit
                ? {
                    code: placement.housingUnit.code,
                    address: placement.housingUnit.address,
                  }
                : undefined
            }
            availableUnits={availableUnits}
          />
        </div>
      )}
    </div>
  )
}
