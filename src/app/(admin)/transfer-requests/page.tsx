import type { Metadata } from 'next'
import { getTransferRequests } from '@/lib/actions/transfers'
import { TabLink, TabLinkGroup } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/ui/Page'
import { formatRelativeDate } from '@/lib/utils'
import { requirePermission } from '@/lib/auth'
import { TransferActions } from './TransferActions'
import { TRANSFER_REQUEST_STATUS_LABELS, TRANSFER_ACTION_LABELS, UI_LABELS, PAGE_TITLES } from '@/lib/constants'
import { residentName, type NamedResident } from '@/lib/utils/resident-name'

export const metadata: Metadata = { title: PAGE_TITLES.transferRequests }
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function TransferRequestsPage({ searchParams }: Props) {
  await requirePermission('placements:write')
  const params = await searchParams
  const statusFilter = params.status || 'PENDING'

  const [requests, allRequests] = await Promise.all([
    getTransferRequests(statusFilter === 'ALL' ? undefined : statusFilter),
    getTransferRequests(),
  ])
  const counts = {
    all: allRequests.length,
    pending: allRequests.filter(r => r.status === 'PENDING').length,
    approved: allRequests.filter(r => r.status === 'APPROVED').length,
    denied: allRequests.filter(r => r.status === 'DENIED').length,
  }

  return (
    <div>
      <div className="mb-6">
        <PageHeader title={PAGE_TITLES.transferRequests} />
      </div>

      {/* Status Tabs */}
      <div className="mb-6">
        <TabLinkGroup label={UI_LABELS.filterNav} variant="underline">
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
        </TabLinkGroup>
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
  resident: NamedResident & { id: string; supportLevel: string | null }
  currentPlacement: {
    id: string
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
              {residentName(request.resident)}
            </h3>
            <span className={STATUS_BADGE[request.status] || 'badge'}>
              {STATUS_LABEL[request.status] || request.status}
            </span>
          </div>
          <p className="text-sm text-ui-muted">
            {formatRelativeDate(request.createdAt)}
            {request.currentPlacement?.housingUnit && (
              <> · {TRANSFER_ACTION_LABELS.fromUnit} {request.currentPlacement.housingUnit.code}</>
            )}
            {request.targetUnit && (
              <> · {TRANSFER_ACTION_LABELS.toUnit} {request.targetUnit.code}</>
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
        <TransferActions requestId={request.id} />
      )}
    </div>
  )
}
