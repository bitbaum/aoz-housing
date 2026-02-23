import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  INCIDENT_TYPE_LABELS,
  INCIDENT_CATEGORY_LABELS,
  INCIDENT_CATEGORY_ICONS,
  INCIDENT_SEVERITY_LABELS,
  getLabel,
} from '@/lib/constants'

export const metadata: Metadata = { title: 'Vorfälle' }
import {
  getSeverityBorderClass,
  getSeverityDotClass,
  formatRelativeDate,
} from '@/lib/utils'
import { StatCard } from '@/components/ui/Card'
import { TabLink } from '@/components/ui/Tabs'
import type { IncidentCategory } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ category?: string }>
}

export default async function IncidentsListPage({ searchParams }: Props) {
  const params = await searchParams
  const categoryFilter = params.category || 'all'

  const incidents = await prisma.incident.findMany({
    where: categoryFilter !== 'all' ? { category: categoryFilter as IncidentCategory } : undefined,
    select: {
      id: true,
      type: true,
      category: true,
      severity: true,
      description: true,
      date: true,
      resolvedAt: true,
      resolution: true,
      nextFollowUpDate: true,
      housingUnit: {
        select: { code: true },
      },
      reportedBy: {
        select: { code: true },
      },
      subject: {
        select: { code: true },
      },
      _count: {
        select: { followUps: true },
      },
    },
    orderBy: { date: 'desc' },
    take: 100,
  })

  // Get counts for all categories (unfiltered)
  const allIncidents = await prisma.incident.findMany({
    select: { category: true, severity: true, resolvedAt: true },
  })

  const stats = {
    total: allIncidents.length,
    open: allIncidents.filter((i) => !i.resolvedAt).length,
    interpersonal: allIncidents.filter((i) => i.category === 'INTERPERSONAL').length,
    maintenance: allIncidents.filter((i) => i.category === 'MAINTENANCE').length,
    safety: allIncidents.filter((i) => i.category === 'SAFETY').length,
    critical: allIncidents.filter(
      (i) => i.severity === 'CRITICAL' && !i.resolvedAt
    ).length,
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vorfälle</h1>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/export/incidents"
            className="min-h-[44px] rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 inline-flex items-center"
          >
            Exportieren
          </a>
          <Link href="/incidents/new" className="btn-primary">
            Neuer Vorfall
          </Link>
        </div>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="Offen" value={stats.open} trend={stats.open > 0 ? 'warning' : 'neutral'} />
        <StatCard label="Kritisch" value={stats.critical} trend={stats.critical > 0 ? 'warning' : 'neutral'} />
        <StatCard label="Konflikte" value={stats.interpersonal} />
        <StatCard label="Sicherheit" value={stats.safety} />
      </div>

      {/* Category Tabs - Note: Maintenance requests have their own page (/maintenance) */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          <TabLink
            href="/incidents"
            label="Alle"
            count={stats.total}
            active={categoryFilter === 'all'}
          />
          <TabLink
            href="/incidents?category=INTERPERSONAL"
            label="Konflikte"
            count={stats.interpersonal}
            active={categoryFilter === 'INTERPERSONAL'}
          />
          <TabLink
            href="/incidents?category=SAFETY"
            label="Sicherheit"
            count={stats.safety}
            active={categoryFilter === 'SAFETY'}
          />
        </div>
      </div>

      {/* Incidents List */}
      {incidents.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            {categoryFilter === 'all'
              ? 'Keine Vorfälle dokumentiert'
              : `Keine ${getLabel(INCIDENT_CATEGORY_LABELS, categoryFilter)} Vorfälle`}
          </p>
          <Link href="/incidents/new" className="btn-primary">
            Vorfall erfassen
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

interface IncidentRowData {
  id: string
  type: string
  category: string
  severity: string
  description: string
  date: Date | string
  resolvedAt: Date | string | null
  resolution: string | null
  nextFollowUpDate: Date | string | null
  housingUnit: { code: string }
  reportedBy: { code: string } | null
  subject: { code: string } | null
  _count: { followUps: number }
}

function IncidentRow({ incident }: { incident: IncidentRowData }) {
  const categoryIcon = INCIDENT_CATEGORY_ICONS[incident.category] || '💬'
  const isOverdue = incident.nextFollowUpDate && new Date(incident.nextFollowUpDate) < new Date() && !incident.resolvedAt

  return (
    <Link
      href={`/incidents/${incident.id}`}
      className={`card p-4 border-l-4 ${getSeverityBorderClass(
        incident.severity
      )} block hover:shadow-md transition-shadow`}
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
              {isOverdue && (
                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                  ⏰ Überfällig
                </span>
              )}
              {incident._count?.followUps > 0 && (
                <span className="text-xs text-gray-500">
                  {incident._count.followUps} Follow-ups
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {incident.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="hover:text-aoz-primary">
                🏠 {incident.housingUnit.code}
              </span>
              {incident.reportedBy && (
                <span
                  className="hover:text-aoz-primary"
                  title="Gemeldet von"
                >
                  📢 {incident.reportedBy.code}
                </span>
              )}
              {incident.subject && (
                <span
                  className="hover:text-aoz-primary font-medium"
                  title="Betrifft"
                >
                  👤 {incident.subject.code}
                </span>
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
        </div>
      </div>
      {incident.resolution && (
        <div className="mt-3 pt-3 border-t border-gray-100 ml-12">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Lösung:</span> {incident.resolution}
          </p>
        </div>
      )}
    </Link>
  )
}

