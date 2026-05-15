import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { updateMaintenanceStatus, assignMaintenanceRequest } from '@/lib/actions'

export const metadata: Metadata = { title: 'Wartungsanfragen' }
import {
  MAINTENANCE_CATEGORY_LABELS,
  MAINTENANCE_CATEGORY_ICONS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_PRIORITY_COLORS,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUS_COLORS,
  MAINTENANCE_STAT_LABELS,
  UI_LABELS,
  getLabel,
} from '@/lib/constants'
import { formatRelativeDate } from '@/lib/utils'
import { StatCard } from '@/components/ui/Card'
import { TabLink } from '@/components/ui/Tabs'
import type { MaintenanceStatus, Prisma } from '@prisma/client'
import { QUERY_LIMITS } from '@/lib/config/thresholds'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function MaintenancePage({ searchParams }: Props) {
  const params = await searchParams
  const statusFilter = params.status || 'active'

  // Build where clause based on status filter
  let whereClause: Prisma.MaintenanceRequestWhereInput = {}
  if (statusFilter === 'active') {
    whereClause.status = { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'] }
  } else if (statusFilter !== 'all') {
    whereClause.status = statusFilter as MaintenanceStatus
  }

  const [requests, allRequests] = await Promise.all([
    prisma.maintenanceRequest.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        priority: true,
        status: true,
        location: true,
        assignedTo: true,
        createdAt: true,
        housingUnitId: true,
        reportedById: true,
        housingUnit: {
          select: { code: true },
        },
        spot: {
          select: { code: true, label: true },
        },
        reportedBy: {
          select: { id: true, code: true },
        },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      take: QUERY_LIMITS.pageList,
    }),
    // Unfiltered for tab counts
    prisma.maintenanceRequest.findMany({
      select: { status: true, priority: true },
    }),
  ])

  const stats = {
    total: allRequests.length,
    open: allRequests.filter((r) => r.status === 'OPEN').length,
    assigned: allRequests.filter((r) => r.status === 'ASSIGNED').length,
    inProgress: allRequests.filter((r) => r.status === 'IN_PROGRESS').length,
    onHold: allRequests.filter((r) => r.status === 'ON_HOLD').length,
    completed: allRequests.filter((r) => r.status === 'COMPLETED').length,
    urgent: allRequests.filter(
      (r) => r.priority === 'URGENT' && !['COMPLETED', 'CANCELLED'].includes(r.status)
    ).length,
    active: allRequests.filter(
      (r) => !['COMPLETED', 'CANCELLED'].includes(r.status)
    ).length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Wartungsanfragen</h1>
        <Link href="/maintenance/new" className="btn-primary">
          Neue Anfrage
        </Link>
      </div>

      {/* Urgent Alert */}
      {stats.urgent > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-semibold text-red-800">
                {stats.urgent} dringende Anfrage{stats.urgent > 1 ? 'n' : ''} erfordern sofortige Aufmerksamkeit
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label={MAINTENANCE_STATUS_LABELS.OPEN} value={stats.open} trend={stats.open > 0 ? 'warning' : 'neutral'} />
        <StatCard label={MAINTENANCE_STATUS_LABELS.IN_PROGRESS} value={stats.inProgress} />
        <StatCard label={MAINTENANCE_PRIORITY_LABELS.URGENT} value={stats.urgent} trend={stats.urgent > 0 ? 'warning' : 'neutral'} />
        <StatCard label={MAINTENANCE_STAT_LABELS.completedThisMonth} value={stats.completed} />
      </div>

      {/* Status Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          <TabLink
            href="/maintenance?status=active"
            label={UI_LABELS.active}
            count={stats.active}
            active={statusFilter === 'active'}
          />
          <TabLink
            href="/maintenance?status=OPEN"
            label={MAINTENANCE_STATUS_LABELS.OPEN}
            count={stats.open}
            active={statusFilter === 'OPEN'}
          />
          <TabLink
            href="/maintenance?status=IN_PROGRESS"
            label={MAINTENANCE_STATUS_LABELS.IN_PROGRESS}
            count={stats.inProgress}
            active={statusFilter === 'IN_PROGRESS'}
          />
          <TabLink
            href="/maintenance?status=COMPLETED"
            label={MAINTENANCE_STATUS_LABELS.COMPLETED}
            count={stats.completed}
            active={statusFilter === 'COMPLETED'}
          />
          <TabLink
            href="/maintenance?status=all"
            label={UI_LABELS.all}
            count={stats.total}
            active={statusFilter === 'all'}
          />
        </div>
      </div>

      {/* Request List */}
      {requests.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            Keine Wartungsanfragen gefunden
          </p>
          <Link href="/maintenance/new" className="btn-primary">
            Anfrage erstellen
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <RequestRow key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  )
}

interface RequestRowData {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  location: string | null
  assignedTo: string | null
  createdAt: Date | string
  housingUnitId: string
  reportedById: string | null
  housingUnit: { code: string }
  spot: { code: string; label: string | null } | null
  reportedBy: { id: string; code: string } | null
}

function RequestRow({ request }: { request: RequestRowData }) {
  const categoryIcon = MAINTENANCE_CATEGORY_ICONS[request.category] || '🔧'
  const priorityClass = MAINTENANCE_PRIORITY_COLORS[request.priority] || ''
  const statusClass = MAINTENANCE_STATUS_COLORS[request.status] || 'badge'

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <span className="text-2xl">{categoryIcon}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/maintenance/${request.id}`}
                className="font-semibold text-gray-900 hover:text-aoz-primary"
              >
                {request.title}
              </Link>
              <span className={`text-xs px-2 py-0.5 rounded ${priorityClass}`}>
                {getLabel(MAINTENANCE_PRIORITY_LABELS, request.priority)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {request.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
              <Link
                href={`/housing/${request.housingUnitId}`}
                className="hover:text-aoz-primary"
              >
                🏠 {request.housingUnit.code}
              </Link>
              {request.spot && (
                <span>{request.spot.label || request.spot.code}</span>
              )}
              {request.location && <span>📍 {request.location}</span>}
              {request.reportedBy && (
                <Link
                  href={`/residents/${request.reportedById}`}
                  className="hover:text-aoz-primary"
                >
                  👤 {request.reportedBy.code}
                </Link>
              )}
              {request.assignedTo && (
                <span className="text-blue-600">🔧 {request.assignedTo}</span>
              )}
              <span>{formatRelativeDate(request.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${statusClass}`}>
            {getLabel(MAINTENANCE_STATUS_LABELS, request.status)}
          </span>
          <QuickActions request={request} />
        </div>
      </div>
    </div>
  )
}

function QuickActions({ request }: { request: Pick<RequestRowData, 'id' | 'status'> }) {
  if (request.status === 'COMPLETED' || request.status === 'CANCELLED') {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {request.status === 'OPEN' && (
        <form action={assignMaintenanceRequest}>
          <input type="hidden" name="requestId" value={request.id} />
          <input
            type="text"
            name="assignedTo"
            placeholder="Zuweisen an..."
            className="input text-sm w-32"
            required
          />
          <button type="submit" className="btn-outline text-sm ml-2">
            Zuweisen
          </button>
        </form>
      )}
      {(request.status === 'ASSIGNED' || request.status === 'ON_HOLD') && (
        <form action={updateMaintenanceStatus}>
          <input type="hidden" name="requestId" value={request.id} />
          <input type="hidden" name="status" value="IN_PROGRESS" />
          <button type="submit" className="btn-outline text-sm">
            Starten
          </button>
        </form>
      )}
      {request.status === 'IN_PROGRESS' && (
        <form action={updateMaintenanceStatus}>
          <input type="hidden" name="requestId" value={request.id} />
          <input type="hidden" name="status" value="COMPLETED" />
          <button type="submit" className="btn-primary text-sm">
            Abschliessen
          </button>
        </form>
      )}
    </div>
  )
}
