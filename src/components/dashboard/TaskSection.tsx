'use client'

import Link from 'next/link'
import { DASHBOARD_LABELS } from '@/lib/constants/labels'

interface OverdueCheckIn {
  id: string
  residentCode: string
  residentId: string
  weekNumber: number
  unitCode: string
  unitId: string
  daysSinceLastCheckIn: number
  supportLevel: string
}

interface UnplacedResident {
  id: string
  code: string
  createdAt: Date
}

interface CriticalIncident {
  id: string
  type: string
  unitCode: string
  unitId: string
  daysSinceCreated: number
}

interface OverdueMaintenance {
  id: string
  title: string
  unitCode: string
  daysSinceCreated: number
}

interface TaskSectionProps {
  overdueCheckIns: OverdueCheckIn[]
  unplacedResidents: UnplacedResident[]
  criticalIncidents: CriticalIncident[]
  overdueMaintenance: OverdueMaintenance[]
}

export function TaskSection({
  overdueCheckIns,
  unplacedResidents,
  criticalIncidents,
  overdueMaintenance,
}: TaskSectionProps) {
  const hasOverdueCheckIns = overdueCheckIns.length > 0
  const hasUnplaced = unplacedResidents.length > 0
  const hasCritical = criticalIncidents.length > 0
  const hasOverdueMaintenance = overdueMaintenance.length > 0

  const allClear = !hasOverdueCheckIns && !hasUnplaced && !hasCritical && !hasOverdueMaintenance

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ui-text">{DASHBOARD_LABELS.sectionTasks}</h2>
        {allClear && (
          <span className="text-sm text-status-success font-medium">{DASHBOARD_LABELS.allClearAllDone}</span>
        )}
      </div>

      <div className="space-y-4">
        {/* Critical Incidents - Highest Priority */}
        {hasCritical ? (
          <TaskCategory
            icon="🚨"
            title={`${criticalIncidents.length} ${DASHBOARD_LABELS.taskCriticalOpenSuffix}`}
            href="/incidents?severity=CRITICAL&resolved=false"
            variant="critical"
          >
            {criticalIncidents.slice(0, 3).map((incident) => (
              <TaskItem
                key={incident.id}
                href={`/incidents/${incident.id}`}
                primary={incident.type}
                secondary={`${incident.unitCode} • ${DASHBOARD_LABELS.taskDaysAgoPrefix} ${incident.daysSinceCreated} ${DASHBOARD_LABELS.daysAgo}`}
              />
            ))}
            {criticalIncidents.length > 3 && (
              <MoreItems count={criticalIncidents.length - 3} href="/incidents?severity=CRITICAL&resolved=false" />
            )}
          </TaskCategory>
        ) : (
          <CompletedCategory icon="🚨" title={DASHBOARD_LABELS.taskNoCritical} />
        )}

        {/* Overdue Check-ins */}
        {hasOverdueCheckIns ? (
          <TaskCategory
            icon="⚠️"
            title={`${overdueCheckIns.length} ${DASHBOARD_LABELS.taskCheckInsOverdueSuffix}`}
            href="/placements?status=active&overdue=1"
            variant="warning"
          >
            {overdueCheckIns.slice(0, 3).map((checkIn) => (
              <TaskItem
                key={checkIn.id}
                href={`/residents/${checkIn.residentId}`}
                primary={checkIn.residentCode}
                secondary={`${DASHBOARD_LABELS.taskWeek} ${checkIn.weekNumber} • ${checkIn.unitCode}`}
              />
            ))}
            {overdueCheckIns.length > 3 && (
              <MoreItems count={overdueCheckIns.length - 3} href="/placements?status=active" />
            )}
          </TaskCategory>
        ) : (
          <CompletedCategory icon="⚠️" title={DASHBOARD_LABELS.taskAllCheckInsCurrent} />
        )}

        {/* Unplaced Residents */}
        {hasUnplaced ? (
          <TaskCategory
            icon="🏠"
            title={`${unplacedResidents.length} ${DASHBOARD_LABELS.taskWaitingPlacementSuffix}`}
            href="/matching"
            variant="warning"
          >
            {unplacedResidents.slice(0, 3).map((resident) => (
              <TaskItem
                key={resident.id}
                href={`/residents/${resident.id}`}
                primary={resident.code}
                secondary={`${DASHBOARD_LABELS.taskSincePrefix} ${formatDateShort(resident.createdAt)}`}
              />
            ))}
            {unplacedResidents.length > 3 && (
              <MoreItems count={unplacedResidents.length - 3} href="/matching" />
            )}
          </TaskCategory>
        ) : (
          <CompletedCategory icon="🏠" title={DASHBOARD_LABELS.taskAllPlaced} />
        )}

        {/* Overdue Maintenance */}
        {hasOverdueMaintenance ? (
          <TaskCategory
            icon="🔧"
            title={`${overdueMaintenance.length} ${DASHBOARD_LABELS.taskMaintenanceOverdueSuffix}`}
            href="/maintenance"
            variant="info"
          >
            {overdueMaintenance.slice(0, 3).map((ticket) => (
              <TaskItem
                key={ticket.id}
                href={`/maintenance/${ticket.id}`}
                primary={ticket.title}
                secondary={`${ticket.unitCode} • ${DASHBOARD_LABELS.taskDaysAgoPrefix} ${ticket.daysSinceCreated} ${DASHBOARD_LABELS.daysAgo}`}
              />
            ))}
            {overdueMaintenance.length > 3 && (
              <MoreItems count={overdueMaintenance.length - 3} href="/maintenance" />
            )}
          </TaskCategory>
        ) : (
          <CompletedCategory icon="🔧" title={DASHBOARD_LABELS.taskMaintenanceCurrent} />
        )}
      </div>
    </div>
  )
}

// Sub-components

interface TaskCategoryProps {
  icon: string
  title: string
  href: string
  variant: 'critical' | 'warning' | 'info'
  children: React.ReactNode
}

function TaskCategory({ icon, title, href, variant, children }: TaskCategoryProps) {
  const variantStyles = {
    critical: 'border-status-error/25 bg-status-error/8',
    warning: 'border-status-warning/25 bg-status-warning/10',
    info: 'border-status-warning/20 bg-status-warning/8',
  }

  const textStyles = {
    critical: 'text-status-error-text',
    warning: 'text-status-warning-text',
    info: 'text-status-warning-text',
  }

  return (
    <div className={`rounded-lg border p-4 ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className={`font-medium ${textStyles[variant]}`}>{title}</span>
        </div>
        <Link
          href={href}
          className={`text-sm ${textStyles[variant]} hover:underline`}
        >
          {DASHBOARD_LABELS.showAllLink} →
        </Link>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

function CompletedCategory({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-status-success/10 border border-status-success/25">
      <span className="text-status-success">✓</span>
      <span className="text-lg opacity-50">{icon}</span>
      <span className="text-status-success-text">{title}</span>
    </div>
  )
}

interface TaskItemProps {
  href: string
  primary: string
  secondary: string
}

function TaskItem({ href, primary, secondary }: TaskItemProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-2 px-3 bg-ui-surface/60 rounded hover:bg-ui-surface/80 transition-colors"
    >
      <div>
        <span className="font-medium text-ui-text text-sm">{primary}</span>
        <span className="text-ui-muted text-sm ml-2">{secondary}</span>
      </div>
      <span className="text-ui-muted">→</span>
    </Link>
  )
}

function MoreItems({ count, href }: { count: number; href: string }) {
  return (
    <Link
      href={href}
      className="block text-center py-2 text-sm text-ui-muted hover:text-ui-text"
    >
      + {count} {DASHBOARD_LABELS.showMoreSuffix}
    </Link>
  )
}

function formatDateShort(date: Date): string {
  return new Date(date).toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'short',
  })
}
