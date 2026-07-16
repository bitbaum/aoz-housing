import Link from 'next/link'
import { PORTAL_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils/formatting'

interface TransferRequestPreview {
  id: string
  status: string
  createdAt: Date
  targetUnit: { code: string } | null
}

interface PortalTransferStatusCardProps {
  request: TransferRequestPreview
}

export function PortalTransferStatusCard({ request }: PortalTransferStatusCardProps) {
  const L = PORTAL_LABELS.transfer.statusCard
  const isApproved = request.status === 'APPROVED'

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ui-text">{L.title}</h2>
        <Link href="/portal/transfer" className="inline-flex items-center min-h-[44px] px-1 text-sm text-aoz-primary hover:underline">
          {L.details}
        </Link>
      </div>

      <div className="p-3 bg-ui-subtle rounded-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-ui-text text-sm">
              {L.requestedOn} {formatDate(request.createdAt)}
            </p>
            {request.targetUnit && (
              <p className="text-sm text-ui-muted mt-1">
                {L.targetUnit}: {request.targetUnit.code}
              </p>
            )}
            <p className="text-sm text-ui-muted mt-1">
              {isApproved ? L.approvedInfo : L.pendingInfo}
            </p>
          </div>
          <span className={`badge ${isApproved ? 'badge-active' : 'badge-pending'}`}>
            {isApproved ? L.approved : L.pending}
          </span>
        </div>
      </div>
    </div>
  )
}
