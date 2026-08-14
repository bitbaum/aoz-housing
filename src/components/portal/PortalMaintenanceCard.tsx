import { MAINTENANCE_CATEGORY_LABELS, PORTAL_LABELS, getLabel } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

interface OpenMaintenanceRequest {
  id: string
  category: string
  createdAt: Date
}

interface PortalMaintenanceCardProps {
  requests: OpenMaintenanceRequest[]
}

export function PortalMaintenanceCard({ requests }: PortalMaintenanceCardProps) {
  return (
    <div className="card md:col-span-2">
      <h2 className="text-lg font-semibold text-ui-text mb-4">
        {PORTAL_LABELS.dashboard.openMaintenance}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center gap-3 p-3 bg-status-warning/10 rounded-lg"
          >
            <span className="text-xl">🔧</span>
            <div>
              <p className="font-medium text-ui-text text-sm">
                {getLabel(MAINTENANCE_CATEGORY_LABELS, request.category)}
              </p>
              <p className="text-sm text-ui-muted">
                {PORTAL_LABELS.dashboard.reported}: {formatDate(request.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
