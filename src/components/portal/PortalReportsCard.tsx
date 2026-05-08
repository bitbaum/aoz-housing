import Link from 'next/link'
import { INCIDENT_TYPE_LABELS, PORTAL_LABELS, getLabel } from '@/lib/constants'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'

interface ReportedIncident {
  id: string
  type: string
  description: string
  resolvedAt: Date | null
}

interface PortalReportsCardProps {
  incidents: ReportedIncident[]
}

export function PortalReportsCard({ incidents }: PortalReportsCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{PORTAL_LABELS.dashboard.myReports}</h2>
        <Link href="/portal/report" className="text-sm text-aoz-primary hover:underline">
          {PORTAL_LABELS.dashboard.newReport}
        </Link>
      </div>

      {incidents.length === 0 ? (
        <p className="text-gray-500 text-center py-6">
          {PORTAL_LABELS.dashboard.noReports}
        </p>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {getLabel(INCIDENT_TYPE_LABELS, incident.type)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {incident.description.slice(0, DISPLAY_LIMITS.descriptionPreview)}
                    {incident.description.length > 50 && '...'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {incident.resolvedAt ? PORTAL_LABELS.dashboard.reportResolved : PORTAL_LABELS.dashboard.reportPending}
                  </p>
                </div>
                <span className={`badge ${incident.resolvedAt ? 'badge-active' : 'badge-pending'}`}>
                  {incident.resolvedAt ? PORTAL_LABELS.dashboard.resolved : `${PORTAL_LABELS.dashboard.open} · ${PORTAL_LABELS.dashboard.inProgress}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
