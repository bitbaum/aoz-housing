import type { Metadata } from 'next'
// `incident` is aliased: the row-mapping callbacks below use the same name.
import { db, incident as incidentTable } from '@/lib/db'
import { eq, and, isNull, isNotNull, desc, count } from 'drizzle-orm'
import Link from 'next/link'
import { X, AlertTriangle, Home, Megaphone, User, Clock, Timer } from 'lucide-react'
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
import { getSeverityBorderClass, getSeverityDotClass, formatRelativeDate } from '@/lib/utils'
import { StatCard } from '@/components/ui/Card'
import { TabLink, TabLinkGroup } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/ui/Page'
import type { IncidentCategory } from '@/lib/db'
import { QUERY_LIMITS } from '@/lib/config/thresholds'
import { RESIDENT_NAME_SELECT, residentName, type NamedResident } from '@/lib/utils/resident-name'
import { requirePermission } from '@/lib/auth'
import { hasPermission } from '@/lib/auth/role-policy'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ category?: string; status?: string }>
}

export default async function IncidentsListPage({ searchParams }: Props) {
  const params = await searchParams
  const categoryFilter = params.category || 'all'
  const statusFilter = params.status || 'all'

  // `incidents:read` opens the board. It does NOT imply either affordance
  // rendered on it, and until JOBCOACH and FREIWILLIGENARBEIT were given
  // read-only sight of conflicts, nobody could reach this page without also
  // holding both — so two dead ends sat here harmlessly. Verified in
  // production: a Jobcoach landed on the board and was offered "Vorfall
  // melden", which redirects to /kein-zugriff?needs=incidents%3Awrite.
  //
  // A button that ends at the permission-denied page is the exact thing the
  // nav rule forbids; a page may not do what its own menu may not.
  const viewer = await requirePermission('incidents:read')
  const canWriteIncidents = hasPermission(viewer, 'incidents:write')
  const canExport = hasPermission(viewer, 'export:read')

  const conditions = [
    ...(categoryFilter !== 'all'
      ? [eq(incidentTable.category, categoryFilter as IncidentCategory)]
      : []),
    ...(statusFilter === 'open' ? [isNull(incidentTable.resolvedAt)] : []),
    ...(statusFilter === 'resolved' ? [isNotNull(incidentTable.resolvedAt)] : []),
  ]

  const [incidentRows, categoryGroups, openCategoryGroups, criticalOpenCount] = await Promise.all([
    db.query.incident.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      columns: {
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
      },
      with: {
        housingUnit: {
          columns: { code: true },
        },
        reportedBy: {
          columns: RESIDENT_NAME_SELECT,
        },
        subject: {
          columns: RESIDENT_NAME_SELECT,
        },
        // Prisma's `_count.followUps`: fetched id-only and counted below.
        followUps: {
          columns: { id: true },
        },
      },
      orderBy: [desc(incidentTable.date)],
      limit: QUERY_LIMITS.pageList,
    }),
    // Total counts per category (single query instead of fetching all rows)
    db
      .select({ category: incidentTable.category, count: count() })
      .from(incidentTable)
      .groupBy(incidentTable.category),
    // Open (resolvedAt = null) counts per category
    db
      .select({ category: incidentTable.category, count: count() })
      .from(incidentTable)
      .where(isNull(incidentTable.resolvedAt))
      .groupBy(incidentTable.category),
    // Count of critical, still-open incidents
    db.$count(
      incidentTable,
      and(eq(incidentTable.severity, 'CRITICAL'), isNull(incidentTable.resolvedAt)),
    ),
  ])

  const incidents = incidentRows.map(({ followUps, ...rest }) => ({
    ...rest,
    _count: { followUps: followUps.length },
  }))

  const categoryCounts = categoryGroups.reduce<Record<string, number>>((acc, g) => {
    acc[g.category] = g.count
    return acc
  }, {})
  const openCategoryCounts = openCategoryGroups.reduce<Record<string, number>>((acc, g) => {
    acc[g.category] = g.count
    return acc
  }, {})

  const stats = {
    total: categoryGroups.reduce((sum, g) => sum + g.count, 0),
    open: openCategoryGroups.reduce((sum, g) => sum + g.count, 0),
    interpersonal: categoryCounts.INTERPERSONAL ?? 0,
    openInterpersonal: openCategoryCounts.INTERPERSONAL ?? 0,
    maintenance: categoryCounts.MAINTENANCE ?? 0,
    safety: categoryCounts.SAFETY ?? 0,
    openSafety: openCategoryCounts.SAFETY ?? 0,
    critical: criticalOpenCount,
  }

  // Tab counts reflect the active status filter
  const tabTotal = statusFilter === 'open' ? stats.open : stats.total

  /**
   * One tab per category that actually HAS incidents, derived from the counts
   * rather than a hardcoded pair.
   *
   * Only Zwischenmenschlich and Sicherheit had tabs, so rows in any other
   * category — Wartung and Wohlbefinden — were counted in "Alle" and in the
   * total, but no filter could isolate them: present in the arithmetic,
   * unreachable in the UI. Deriving the tabs means a Wartung tab appears only
   * when such rows exist, and then it is itself the signal that they are on
   * the wrong desk (a broken appliance belongs on /maintenance, which is why
   * portal reports route there — see lib/reports/routing.ts).
   */
  const categoryTabs = Object.keys(INCIDENT_CATEGORY_LABELS)
    .filter((category) => (categoryCounts[category] ?? 0) > 0)
    .map((category) => ({
      category,
      label: INCIDENT_CATEGORY_LABELS[category],
      count:
        statusFilter === 'open'
          ? (openCategoryCounts[category] ?? 0)
          : (categoryCounts[category] ?? 0),
    }))

  // Build query suffix to preserve status filter across tab links
  const statusQS = statusFilter !== 'all' ? `&status=${statusFilter}` : ''

  return (
    <div>
      <div className="mb-6">
        <PageHeader
          title={INCIDENT_PAGE_LABELS.title}
          actions={
            <>
              {canExport && (
                <a
                  href="/api/export/incidents"
                  className="min-h-[44px] rounded-md border border-ui-border-strong bg-ui-surface px-4 py-2 text-sm font-medium text-ui-muted hover:bg-ui-subtle inline-flex items-center"
                >
                  {INCIDENT_PAGE_LABELS.export}
                </a>
              )}
              {canWriteIncidents && (
                <Link href="/incidents/new" className="btn-primary">
                  {INCIDENT_PAGE_LABELS.newIncident}
                </Link>
              )}
            </>
          }
        />
      </div>

      {/* Critical Incidents Alert */}
      {stats.critical > 0 && (
        <div className="mb-6 p-4 bg-status-error/8 border border-status-error/25 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle
              className="w-6 h-6 text-status-error shrink-0"
              aria-label={UI_LABELS.warning}
            />
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
          href={
            statusFilter === 'open'
              ? '/incidents'
              : `/incidents?status=open${categoryFilter !== 'all' ? `&category=${categoryFilter}` : ''}`
          }
        />
        <StatCard
          label={INCIDENT_SEVERITY_LABELS.CRITICAL}
          value={stats.critical}
          trend={stats.critical > 0 ? 'warning' : 'neutral'}
        />
        <StatCard label={INCIDENT_CATEGORY_LABELS.INTERPERSONAL} value={stats.interpersonal} />
        <StatCard label={INCIDENT_CATEGORY_LABELS.SAFETY} value={stats.safety} />
      </div>

      {/* Active filter indicator */}
      {statusFilter === 'open' && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-ui-muted">{INCIDENT_PAGE_LABELS.filterOpen}:</span>
          <a
            href={`/incidents${categoryFilter !== 'all' ? `?category=${categoryFilter}` : ''}`}
            className="chip-info gap-1 hover:bg-status-info/25 transition-colors"
            aria-label="Filter entfernen"
          >
            {UI_LABELS.open}
            <X className="w-3 h-3" aria-hidden="true" />
          </a>
        </div>
      )}

      {/* Category Tabs - Note: Maintenance requests have their own page (/maintenance) */}
      <div className="mb-6">
        <TabLinkGroup label={UI_LABELS.filterNav} variant="underline">
          <TabLink
            href={`/incidents${statusQS ? `?${statusQS.slice(1)}` : ''}`}
            label={UI_LABELS.all}
            count={tabTotal}
            active={categoryFilter === 'all'}
          />
          {categoryTabs.map((tab) => (
            <TabLink
              key={tab.category}
              href={`/incidents?category=${tab.category}${statusQS}`}
              label={tab.label}
              count={tab.count}
              active={categoryFilter === tab.category}
            />
          ))}
        </TabLinkGroup>
      </div>

      {/* Incidents List */}
      {incidents.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-ui-muted mb-4">
            {statusFilter === 'open' && categoryFilter === 'all'
              ? INCIDENT_PAGE_LABELS.noIncidentsOpen
              : categoryFilter !== 'all'
                ? INCIDENT_PAGE_LABELS.noIncidentsCategory(
                    getLabel(INCIDENT_CATEGORY_LABELS, categoryFilter),
                  )
                : INCIDENT_PAGE_LABELS.noIncidents}
          </p>
          {statusFilter === 'open' ? (
            <Link href="/incidents" className="btn-outline">
              {INCIDENT_PAGE_LABELS.clearFilter}
            </Link>
          ) : (
            // An empty board offers the fix to whoever can perform it. For a
            // reader it stays an empty board, which is the honest rendering.
            canWriteIncidents && (
              <Link href="/incidents/new" className="btn-primary">
                {INCIDENT_PAGE_LABELS.createIncident}
              </Link>
            )
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
  reportedBy: NamedResident | null
  subject: NamedResident | null
  _count: { followUps: number }
}

function IncidentRow({ incident }: { incident: IncidentRowData }) {
  const categoryIcon = INCIDENT_CATEGORY_ICONS[incident.category] || '💬'
  const isOverdue =
    incident.nextFollowUpDate &&
    new Date(incident.nextFollowUpDate) < new Date() &&
    !incident.resolvedAt

  return (
    <Link
      href={`/incidents/${incident.id}`}
      className={`card p-4 border-l-4 ${getSeverityBorderClass(
        incident.severity,
      )} block transition-colors`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <span
            className="text-2xl shrink-0"
            role="img"
            aria-label={INCIDENT_CATEGORY_LABELS[incident.category] || 'Vorfall'}
          >
            {categoryIcon}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-ui-text">
                {getLabel(INCIDENT_TYPE_LABELS, incident.type)}
              </h3>
              <span
                className={`w-2 h-2 rounded-full ${getSeverityDotClass(incident.severity)}`}
                title={getLabel(INCIDENT_SEVERITY_LABELS, incident.severity)}
              />
              {isOverdue && (
                <span className="chip-error inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" aria-hidden="true" /> {INCIDENT_PAGE_LABELS.overdue}
                </span>
              )}
              {incident._count?.followUps > 0 && (
                <span className="text-xs text-ui-muted">
                  {incident._count.followUps} Follow-ups
                </span>
              )}
              {incident.category === 'INTERPERSONAL' &&
                !incident.resolvedAt &&
                !incident.mediationMinutes && (
                  <span className="chip-info inline-flex items-center gap-1">
                    <Timer className="w-3 h-3" aria-hidden="true" /> Mediationszeit fehlt
                  </span>
                )}
            </div>
            <p className="text-sm text-ui-muted mt-1 line-clamp-2">{incident.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-ui-muted">
              <span className="hover:text-brand-primary inline-flex items-center gap-1">
                <Home className="w-3.5 h-3.5" aria-hidden="true" /> {incident.housingUnit.code}
              </span>
              {incident.reportedBy && (
                <span
                  className="hover:text-brand-primary inline-flex items-center gap-1"
                  title={INCIDENT_PAGE_LABELS.reportedByTitle}
                >
                  <Megaphone className="w-3.5 h-3.5" aria-hidden="true" />{' '}
                  {residentName(incident.reportedBy)}
                </span>
              )}
              {incident.subject && (
                <span
                  className="hover:text-brand-primary font-medium inline-flex items-center gap-1"
                  title={INCIDENT_PAGE_LABELS.subjectTitle}
                >
                  <User className="w-3.5 h-3.5" aria-hidden="true" />{' '}
                  {residentName(incident.subject)}
                </span>
              )}
              <span>{formatRelativeDate(incident.date)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
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
