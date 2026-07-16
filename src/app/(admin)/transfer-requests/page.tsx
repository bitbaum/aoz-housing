import type { Metadata } from 'next'
import Link from 'next/link'
import { getTransferRequests } from '@/lib/actions/transfers'
import { TabLink } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/ui/Page'
import { formatRelativeDate } from '@/lib/utils'
import { TransferActions } from './TransferActions'
import { TRANSFER_REQUEST_STATUS_LABELS, TRANSFER_ACTION_LABELS, UI_LABELS, PAGE_TITLES } from '@/lib/constants'

export const metadata: Metadata = { title: PAGE_TITLES.transferRequests }
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function TransferRequestsPage({ searchParams }: Props) {
  const params = await searchParams
  const statusFilter = params.status || 'PENDING'

  const allRequests = await getTransferRequests()
  const requests =
    statusFilter === 'ALL' ? allRequests : allRequests.filter((r) => r.status === statusFilter)
  const counts = {
    all: allRequests.length,
    pending: allRequests.filter(r => r.status === 'PENDING').length,
    approved: allRequests.filter(r => r.status === 'APPROVED').length,
    denied: allRequests.filter(r => r.status === 'DENIED').length,
    completed: allRequests.filter(r => r.status === 'COMPLETED').length,
  }

  return (
    <div>
      <div className="mb-6">
        <PageHeader title={PAGE_TITLES.transferRequests} />
      </div>

      {/* Status Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-ui-border overflow-x-auto">
          <TabLink
            href="/transfer-requests?status=PENDING"
            label={TRANSFER_REQUEST_STATUS_LABELS.PENDING}
            count={counts.pending}
            active={statusFilter === 'PENDING'}
          />
          <TabLink
            href="/transfer-requests?status=APPROVED"
            label={TRANSFER_REQUEST_STATUS_LABELS.APPROVED}
            count={counts.approved}
            active={statusFilter === 'APPROVED'}
          />
          <TabLink
            href="/transfer-requests?status=COMPLETED"
            label={TRANSFER_REQUEST_STATUS_LABELS.COMPLETED}
            count={counts.completed}
            active={statusFilter === 'COMPLETED'}
          />
          <TabLink
            href="/transfer-requests?status=DENIED"
            label={TRANSFER_REQUEST_STATUS_LABELS.DENIED}
            count={counts.denied}
            active={statusFilter === 'DENIED'}
          />
          <TabLink
            href="/transfer-requests?status=ALL"
            label={UI_LABELS.all}
            count={counts.all}
            active={statusFilter === 'ALL'}
          />
        </div>
      </div>

      {/* Request List */}
      {requests.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-ui-muted">
            {statusFilter === 'PENDING'
              ? TRANSFER_ACTION_LABELS.emptyPending
              : TRANSFER_ACTION_LABELS.emptyOther}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <TransferRequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  )
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge badge-pending',
  APPROVED: 'badge badge-active',
  DENIED: 'badge badge-inactive',
  COMPLETED: 'badge badge-active',
  CANCELLED: 'badge badge-inactive',
}

const STATUS_LABEL = TRANSFER_REQUEST_STATUS_LABELS

interface TransferRequestData {
  id: string
  status: string
  reason: string
  staffNotes: string | null
  createdAt: Date | string
  reviewedAt: Date | string | null
  resident: { id: string; code: string; supportLevel: string | null }
  currentPlacement: {
    id: string
    status: string
    housingUnit: { id: string; code: string; address: string } | null
  } | null
  targetUnit: { id: string; code: string; address: string } | null
}

function TransferRequestCard({ request }: { request: TransferRequestData }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-ui-text">
              <Link
                href={`/residents/${request.resident.id}`}
                className="hover:text-aoz-primary hover:underline"
              >
                {request.resident.code}
              </Link>
            </h3>
            <span className={STATUS_BADGE[request.status] || 'badge'}>
              {STATUS_LABEL[request.status] || request.status}
            </span>
          </div>
          <p className="text-sm text-ui-muted">
            {formatRelativeDate(request.createdAt)}
            {request.currentPlacement?.housingUnit && (
              <>
                {' · '}{TRANSFER_ACTION_LABELS.fromUnit}{' '}
                <Link
                  href={`/housing/${request.currentPlacement.housingUnit.id}`}
                  className="hover:text-aoz-primary hover:underline"
                >
                  {request.currentPlacement.housingUnit.code}
                </Link>
              </>
            )}
            {request.targetUnit && (
              <>
                {' · '}{TRANSFER_ACTION_LABELS.toUnit}{' '}
                <Link
                  href={`/housing/${request.targetUnit.id}`}
                  className="hover:text-aoz-primary hover:underline"
                >
                  {request.targetUnit.code}
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      <p className="text-sm text-ui-muted mb-3">{request.reason}</p>

      {request.staffNotes && (
        <div className="p-2 bg-ui-subtle rounded text-sm text-ui-muted mb-3">
          <span className="font-medium">{TRANSFER_ACTION_LABELS.noteLabel}</span> {request.staffNotes}
        </div>
      )}

      {request.status === 'PENDING' && (
        <TransferActions
          requestId={request.id}
          residentId={request.resident.id}
          hasTargetUnit={Boolean(request.targetUnit)}
        />
      )}

      {request.status === 'APPROVED' && (
        <div className="pt-3 border-t border-ui-border">
          <p className="text-sm text-ui-muted">
            {TRANSFER_ACTION_LABELS.completeTransferHint}{' '}
            <Link
              href={`/residents/${request.resident.id}`}
              className="text-aoz-primary underline font-medium"
            >
              {TRANSFER_ACTION_LABELS.completeTransferLink}
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
