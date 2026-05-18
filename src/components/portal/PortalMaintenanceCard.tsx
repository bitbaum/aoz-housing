import { INCIDENT_TYPE_LABELS, PORTAL_LABELS, getLabel } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

interface MaintenanceIncident {
  id: string
  type: string
  date: Date
}

interface PortalMaintenanceCardProps {
  incidents: MaintenanceIncident[]
}

export function PortalMaintenanceCard({ incidents }: PortalMaintenanceCardProps) {
  return (
    <div className="card md:col-span-2">
      <h2 className="text-lg font-semibold text-ui-text mb-4">
        {PORTAL_LABELS.dashboard.openMaintenance}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {incidents.map((incident) => (
          <div
            key={incident.id}
            className="flex items-center gap-3 p-3 bg-status-warning/10 rounded-lg"
          >
            <span className="text-xl">🔧</span>
            <div>
              <p className="font-medium text-ui-text text-sm">
                {getLabel(INCIDENT_TYPE_LABELS, incident.type)}
              </p>
              <p className="text-xs text-ui-muted">
                {PORTAL_LABELS.dashboard.reported}: {formatDate(incident.date)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
