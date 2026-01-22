import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  INCIDENT_TYPE_LABELS,
  INCIDENT_CATEGORY_LABELS,
  INCIDENT_SEVERITY_LABELS,
  getLabel,
} from '@/lib/constants'
import {
  getSeverityBorderClass,
  getSeverityDotClass,
  formatRelativeDate,
} from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function IncidentsListPage() {
  const incidents = await prisma.incident.findMany({
    include: {
      housingUnit: true,
      resident: true,
    },
    orderBy: { date: 'desc' },
    take: 100,
  })

  const stats = {
    total: incidents.length,
    open: incidents.filter((i) => !i.resolvedAt).length,
    interpersonal: incidents.filter((i) => i.category === 'INTERPERSONAL').length,
    maintenance: incidents.filter((i) => i.category === 'MAINTENANCE').length,
    safety: incidents.filter((i) => i.category === 'SAFETY').length,
    critical: incidents.filter(
      (i) => i.severity === 'CRITICAL' && !i.resolvedAt
    ).length,
  }

  const interpersonalIncidents = incidents.filter(
    (i) => i.category === 'INTERPERSONAL'
  )
  const maintenanceIncidents = incidents.filter(
    (i) => i.category === 'MAINTENANCE'
  )
  const safetyIncidents = incidents.filter((i) => i.category === 'SAFETY')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vorfälle</h1>
        <Link href="/incidents/new" className="btn-primary">
          Neuer Vorfall
        </Link>
      </div>

      {/* Critical Incidents Alert */}
      {stats.critical > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-semibold text-red-800">
                {stats.critical} kritische Vorfälle erfordern sofortige Aufmerksamkeit
              </p>
              <p className="text-sm text-red-600">
                Diese Vorfälle haben höchste Priorität und sollten umgehend bearbeitet werden
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Offen" value={stats.open} highlight={stats.open > 0} />
        <StatCard
          label="Kritisch"
          value={stats.critical}
          highlight={stats.critical > 0}
        />
        <StatCard label="Konflikte" value={stats.interpersonal} />
        <StatCard label="Wartung" value={stats.maintenance} />
      </div>

      {/* Category Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          <TabSection
            label="Alle"
            count={incidents.length}
            active
          />
          <TabSection
            label="Konflikte"
            count={interpersonalIncidents.length}
          />
          <TabSection
            label="Wartung"
            count={maintenanceIncidents.length}
          />
          <TabSection
            label="Sicherheit"
            count={safetyIncidents.length}
          />
        </div>
      </div>

      {/* Incidents List */}
      {incidents.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">Keine Vorfälle dokumentiert</p>
          <Link href="/incidents/new" className="btn-primary">
            Ersten Vorfall erfassen
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <IncidentRow key={incident.id} incident={incident} />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={`text-2xl font-bold ${
          highlight ? 'text-red-600' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function TabSection({
  label,
  count,
  active = false,
}: {
  label: string
  count: number
  active?: boolean
}) {
  return (
    <button
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? 'border-aoz-primary text-aoz-primary'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
      <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
        {count}
      </span>
    </button>
  )
}

function IncidentRow({ incident }: { incident: any }) {
  const categoryIcon =
    incident.category === 'MAINTENANCE'
      ? '🔧'
      : incident.category === 'SAFETY'
      ? '⚠️'
      : '💬'

  return (
    <div
      className={`card p-4 border-l-4 ${getSeverityBorderClass(
        incident.severity
      )}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <span className="text-2xl">{categoryIcon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                {getLabel(INCIDENT_TYPE_LABELS, incident.type)}
              </h3>
              <span
                className={`w-2 h-2 rounded-full ${getSeverityDotClass(
                  incident.severity
                )}`}
                title={getLabel(INCIDENT_SEVERITY_LABELS, incident.severity)}
              />
            </div>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {incident.description}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <Link
                href={`/housing/${incident.housingUnitId}`}
                className="hover:text-aoz-primary"
              >
                🏠 {incident.housingUnit.code}
              </Link>
              {incident.resident && (
                <Link
                  href={`/residents/${incident.residentId}`}
                  className="hover:text-aoz-primary"
                >
                  👤 {incident.resident.code}
                </Link>
              )}
              <span>{formatRelativeDate(incident.date)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {incident.resolvedAt ? (
            <span className="badge badge-active">Gelöst</span>
          ) : (
            <span className="badge badge-pending">Offen</span>
          )}
          <ResolveButton incident={incident} />
        </div>
      </div>
      {incident.resolution && (
        <div className="mt-3 pt-3 border-t border-gray-100 ml-12">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Lösung:</span> {incident.resolution}
          </p>
        </div>
      )}
    </div>
  )
}

function ResolveButton({ incident }: { incident: any }) {
  if (incident.resolvedAt) return null

  return (
    <form action={`/api/incidents/${incident.id}/resolve`} method="POST">
      <button type="submit" className="btn-outline text-sm">
        Lösen
      </button>
    </form>
  )
}
