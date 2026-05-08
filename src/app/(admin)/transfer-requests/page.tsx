import type { Metadata } from 'next'
import { getTransferRequests } from '@/lib/actions/transfers'
import { TabLink } from '@/components/ui/Tabs'
import { formatRelativeDate } from '@/lib/utils'
import { TransferActions } from './TransferActions'
import { TRANSFER_REQUEST_STATUS_LABELS } from '@/lib/constants'

export const metadata: Metadata = { title: 'Verlegungsanfragen' }
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function TransferRequestsPage({ searchParams }: Props) {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Verlegungsanfragen</h1>
      </div>

      {/* Status Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          <TabLink
            href="/transfer-requests?status=PENDING"
            label="Offen"
            count={counts.pending}
            active={statusFilter === 'PENDING'}
          />
          <TabLink
            href="/transfer-requests?status=APPROVED"
            label="Genehmigt"
            count={counts.approved}
            active={statusFilter === 'APPROVED'}
          />
          <TabLink
            href="/transfer-requests?status=DENIED"
            label="Abgelehnt"
            count={counts.denied}
            active={statusFilter === 'DENIED'}
          />
          <TabLink
            href="/transfer-requests?status=ALL"
            label="Alle"
            count={counts.all}
            active={statusFilter === 'ALL'}
          />
        </div>
      </div>

      {/* Request List */}
      {requests.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            {statusFilter === 'PENDING'
              ? 'Keine offenen Verlegungsanfragen'
              : 'Keine Verlegungsanfragen in dieser Kategorie'}
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
            <h3 className="font-semibold text-gray-900">
              {request.resident.code}
            </h3>
            <span className={STATUS_BADGE[request.status] || 'badge'}>
              {STATUS_LABEL[request.status] || request.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {formatRelativeDate(request.createdAt)}
            {request.currentPlacement?.housingUnit && (
              <> · Von: {request.currentPlacement.housingUnit.code}</>
            )}
            {request.targetUnit && (
              <> · Nach: {request.targetUnit.code}</>
            )}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-3">{request.reason}</p>

      {request.staffNotes && (
        <div className="p-2 bg-gray-50 rounded text-sm text-gray-600 mb-3">
          <span className="font-medium">Notiz:</span> {request.staffNotes}
        </div>
      )}

      {request.status === 'PENDING' && (
        <TransferActions requestId={request.id} />
      )}
    </div>
  )
}
