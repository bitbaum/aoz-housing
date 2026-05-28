import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { X } from 'lucide-react'
import {
  INCIDENT_TYPE_LABELS,
  INCIDENT_CATEGORY_LABELS,
  INCIDENT_CATEGORY_ICONS,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_RESOLVED_LABELS,
  INCIDENT_PAGE_LABELS,
  UI_LABELS,
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
import { PageHeader } from '@/components/ui/Page'
import type { IncidentCategory, Prisma } from '@prisma/client'
import { QUERY_LIMITS } from '@/lib/config/thresholds'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ category?: string; status?: string }>
}

export default async function IncidentsListPage({ searchParams }: Props) {
  const params = await searchParams
  const categoryFilter = params.category || 'all'
  const statusFilter = params.status || 'all'

  const where: Prisma.IncidentWhereInput = {
    ...(categoryFilter !== 'all' ? { category: categoryFilter as IncidentCategory } : {}),
    ...(statusFilter === 'open' ? { resolvedAt: null } : {}),
    ...(statusFilter === 'resolved' ? { resolvedAt: { not: null } } : {}),
  }

  const [incidents, allIncidents] = await Promise.all([
    prisma.incident.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
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
        mediationMinutes: true,
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
      take: QUERY_LIMITS.pageList,
    }),
    // Unfiltered for tab counts
    prisma.incident.findMany({
      select: { category: true, severity: true, resolvedAt: true },
    }),
  ])

  const openOnly = (cat?: string) =>
    allIncidents.filter((i) => !i.resolvedAt && (!cat || i.category === cat)).length

  const stats = {
    total: allIncidents.length,
    open: openOnly(),
    interpersonal: allIncidents.filter((i) => i.category === 'INTERPERSONAL').length,
    openInterpersonal: openOnly('INTERPERSONAL'),
    maintenance: allIncidents.filter((i) => i.category === 'MAINTENANCE').length,
    safety: allIncidents.filter((i) => i.category === 'SAFETY').length,
    openSafety: openOnly('SAFETY'),
    critical: allIncidents.filter(
      (i) => i.severity === 'CRITICAL' && !i.resolvedAt
    ).length,
  }

  // Tab counts reflect the active status filter
  const tabTotal = statusFilter === 'open' ? stats.open : stats.total
  const tabInterpersonal = statusFilter === 'open' ? stats.openInterpersonal : stats.interpersonal
  const tabSafety = statusFilter === 'open' ? stats.openSafety : stats.safety

  // Build query suffix to preserve status filter across tab links
  const statusQS = statusFilter !== 'all' ? `&status=${statusFilter}` : ''

  return (
    <div>
      <div className="mb-6">
        <PageHeader
          title={INCIDENT_PAGE_LABELS.title}
          actions={
            <>
              <a
                href="/api/export/incidents"
                className="min-h-[44px] rounded-md border border-ui-border-strong bg-ui-surface px-4 py-2 text-sm font-medium text-ui-muted hover:bg-ui-subtle inline-flex items-center"
              >
                {INCIDENT_PAGE_LABELS.export}
              </a>
              <Link href="/incidents/new" className="btn-primary">
                {INCIDENT_PAGE_LABELS.newIncident}
              </Link>
            </>
          }
        />
      </div>

      {/* Critical Incidents Alert */}
      {stats.critical > 0 && (
        <div className="mb-6 p-4 bg-status-error/8 border border-status-error/25 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label={UI_LABELS.warning}>🚨</span>
            <div>
              <p className="font-semibold text-status-error-text">
                {stats.critical} {INCIDENT_PAGE_LABELS.criticalAlertSuffix}
              </p>
              <p className="text-sm text-status-error-text">
                {INCIDENT_PAGE_LABELS.criticalAlertDesc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          label={UI_LABELS.open}
          value={stats.open}
          trend={stats.open > 0 ? 'warning' : 'neutral'}
          href={statusFilter === 'open' ? '/incidents' : `/incidents?status=open${categoryFilter !== 'all' ? `&category=${categoryFilter}` : ''}`}
        />
        <StatCard label={INCIDENT_SEVERITY_LABELS.CRITICAL} value={stats.critical} trend={stats.critical > 0 ? 'warning' : 'neutral'} />
        <StatCard label={INCIDENT_CATEGORY_LABELS.INTERPERSONAL} value={stats.interpersonal} />
        <StatCard label={INCIDENT_CATEGORY_LABELS.SAFETY} value={stats.safety} />
      </div>

      {/* Active filter indicator */}
      {statusFilter === 'open' && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-ui-muted">{INCIDENT_PAGE_LABELS.filterOpen}:</span>
          <a
            href={`/incidents${categoryFilter !== 'all' ? `?category=${categoryFilter}` : ''}`}
            className="inline-flex items-center gap-1 px-2 py-1 bg-aoz-accent text-aoz-secondary text-xs font-medium rounded-full hover:bg-aoz-accent-dark transition-colors"
            aria-label="Filter entfernen"
          >
            {UI_LABELS.open}
            <X className="w-3 h-3" aria-hidden="true" />
          </a>
        </div>
      )}

      {/* Category Tabs - Note: Maintenance requests have their own page (/maintenance) */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-ui-border">
          <TabLink
            href={`/incidents${statusQS ? `?${statusQS.slice(1)}` : ''}`}
            label={UI_LABELS.all}
            count={tabTotal}
            active={categoryFilter === 'all'}
          />
          <TabLink
            href={`/incidents?category=INTERPERSONAL${statusQS}`}
            label={INCIDENT_CATEGORY_LABELS.INTERPERSONAL}
            count={tabInterpersonal}
            active={categoryFilter === 'INTERPERSONAL'}
          />
          <TabLink
            href={`/incidents?category=SAFETY${statusQS}`}
            label={INCIDENT_CATEGORY_LABELS.SAFETY}
            count={tabSafety}
            active={categoryFilter === 'SAFETY'}
          />
        </div>
      </div>

      {/* Incidents List */}
      {incidents.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-ui-muted mb-4">
            {statusFilter === 'open' && categoryFilter === 'all'
              ? INCIDENT_PAGE_LABELS.noIncidentsOpen
              : categoryFilter !== 'all'
              ? INCIDENT_PAGE_LABELS.noIncidentsCategory(getLabel(INCIDENT_CATEGORY_LABELS, categoryFilter))
              : INCIDENT_PAGE_LABELS.noIncidents}
          </p>
          {statusFilter === 'open' ? (
            <a href="/incidents" className="btn-outline">
              {INCIDENT_PAGE_LABELS.clearFilter}
            </a>
          ) : (
            <Link href="/incidents/new" className="btn-primary">
              {INCIDENT_PAGE_LABELS.createIncident}
            </Link>
          )}
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
  mediationMinutes: number | null
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
          <span className="text-2xl" role="img" aria-label={INCIDENT_CATEGORY_LABELS[incident.category] || 'Vorfall'}>{categoryIcon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-ui-text">
                {getLabel(INCIDENT_TYPE_LABELS, incident.type)}
              </h3>
              <span
                className={`w-2 h-2 rounded-full ${getSeverityDotClass(
                  incident.severity
                )}`}
                title={getLabel(INCIDENT_SEVERITY_LABELS, incident.severity)}
              />
              {isOverdue && (
                <span className="text-xs px-2 py-0.5 bg-status-error/15 text-status-error-text rounded">
                  ⏰ {INCIDENT_PAGE_LABELS.overdue}
                </span>
              )}
              {incident._count?.followUps > 0 && (
                <span className="text-xs text-ui-muted">
                  {incident._count.followUps} Follow-ups
                </span>
              )}
              {incident.category === 'INTERPERSONAL' && !incident.resolvedAt && !incident.mediationMinutes && (
                <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded border border-purple-200">
                  ⏱ Mediationszeit fehlt
                </span>
              )}
            </div>
            <p className="text-sm text-ui-muted mt-1 line-clamp-2">
              {incident.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-ui-muted">
              <span className="hover:text-aoz-primary">
                <span aria-hidden="true">🏠</span> {incident.housingUnit.code}
              </span>
              {incident.reportedBy && (
                <span
                  className="hover:text-aoz-primary"
                  title={INCIDENT_PAGE_LABELS.reportedByTitle}
                >
                  <span aria-hidden="true">📢</span> {incident.reportedBy.code}
                </span>
              )}
              {incident.subject && (
                <span
                  className="hover:text-aoz-primary font-medium"
                  title={INCIDENT_PAGE_LABELS.subjectTitle}
                >
                  <span aria-hidden="true">👤</span> {incident.subject.code}
                </span>
              )}
              <span>{formatRelativeDate(incident.date)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {incident.resolvedAt ? (
            <span className="badge badge-active">{INCIDENT_RESOLVED_LABELS.resolved}</span>
          ) : (
            <span className="badge badge-pending">{INCIDENT_RESOLVED_LABELS.open}</span>
          )}
        </div>
      </div>
      {incident.resolution && (
        <div className="mt-3 pt-3 border-t border-ui-border ml-12">
          <p className="text-sm text-ui-muted">
            <span className="font-medium">{UI_LABELS.solution}</span> {incident.resolution}
          </p>
        </div>
      )}
    </Link>
  )
}

