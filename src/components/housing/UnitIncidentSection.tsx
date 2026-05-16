import Link from 'next/link'
import {
  INCIDENT_TYPE_LABELS,
  INCIDENT_CATEGORY_ICONS,
  UI_LABELS,
  UNIT_INCIDENT_LABELS,
} from '@/lib/constants'
import { getSeverityBorderClass, formatRelativeDate } from '@/lib/utils'

interface Incident {
  id: string
  type: string
  category: string
  severity: string
  description: string
  date: Date | string
  resolvedAt: Date | string | null
  resolution: string | null
  subjectId: string | null
  reportedBy: { code: string } | null
  subject: { code: string } | null
}

interface FrequentSubject {
  id: string
  code: string
  count: number
}

interface Props {
  unitId: string
  incidents: Incident[]
  interpersonalCount: number
  maintenanceCount: number
  frequentSubjects: FrequentSubject[]
}

export function UnitIncidentSection({
  unitId,
  incidents,
  interpersonalCount,
  maintenanceCount,
  frequentSubjects,
}: Props) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {UNIT_INCIDENT_LABELS.title}
        </h2>
        <Link href={`/incidents/new?unit=${unitId}`} className="btn-outline text-sm">
          {UNIT_INCIDENT_LABELS.newIncident}
        </Link>
      </div>

      {/* Frequent Subjects Warning */}
      {frequentSubjects.length > 0 && (
        <div className="mb-4 p-4 bg-status-warning/10 border border-status-warning/25 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-status-warning text-lg" aria-hidden="true">!</span>
            <div>
              <p className="text-sm font-medium text-status-warning-text">
                {UNIT_INCIDENT_LABELS.frequentResidents}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {frequentSubjects.map((s) => (
                  <Link
                    key={s.id}
                    href={`/residents/${s.id}`}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-status-warning/15 text-status-warning-text rounded text-sm hover:bg-status-warning/20 transition-colors"
                  >
                    <span className="font-medium">{s.code}</span>
                    <span className="text-status-warning-text">({s.count}x)</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex gap-2 border-b border-gray-200">
          <TabButton active>{UNIT_INCIDENT_LABELS.tabs.all} ({incidents.length})</TabButton>
          <TabButton>{UNIT_INCIDENT_LABELS.tabs.conflicts} ({interpersonalCount})</TabButton>
          <TabButton>{UNIT_INCIDENT_LABELS.tabs.maintenance} ({maintenanceCount})</TabButton>
        </div>
      </div>

      {incidents.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {UNIT_INCIDENT_LABELS.noIncidents}
        </p>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
        </div>
      )}
    </div>
  )
}

function IncidentCard({ incident }: { incident: Incident }) {
  const categoryIcon = INCIDENT_CATEGORY_ICONS[incident.category] || '💬'

  return (
    <div className={`p-4 bg-gray-50 rounded-lg border-l-4 ${getSeverityBorderClass(incident.severity)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-lg" aria-hidden="true">{categoryIcon}</span>
          <div>
            <p className="font-medium text-gray-900">
              {INCIDENT_TYPE_LABELS[incident.type] || incident.type}
            </p>
            <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
            {incident.subject && (
              <p className="text-sm text-gray-500 mt-1">
                Betrifft: {incident.subject.code}
              </p>
            )}
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="text-gray-500">
            {formatRelativeDate(incident.date)}
          </p>
          {incident.resolvedAt ? (
            <span className="badge badge-active">{UI_LABELS.resolved}</span>
          ) : (
            <span className="badge badge-pending">{UI_LABELS.open}</span>
          )}
        </div>
      </div>
      {incident.resolution && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{UI_LABELS.solution}</span> {incident.resolution}
          </p>
        </div>
      )}
    </div>
  )
}

function TabButton({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? 'border-aoz-primary text-aoz-primary'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}
