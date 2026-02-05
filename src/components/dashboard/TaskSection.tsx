'use client'

import Link from 'next/link'

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
        <h2 className="text-lg font-semibold text-gray-900">Aufgaben</h2>
        {allClear && (
          <span className="text-sm text-green-600 font-medium">Alles erledigt!</span>
        )}
      </div>

      <div className="space-y-4">
        {/* Critical Incidents - Highest Priority */}
        {hasCritical ? (
          <TaskCategory
            icon="🚨"
            title={`${criticalIncidents.length} kritische Vorfälle offen`}
            href="/incidents?severity=CRITICAL&resolved=false"
            variant="critical"
          >
            {criticalIncidents.slice(0, 3).map((incident) => (
              <TaskItem
                key={incident.id}
                href={`/incidents/${incident.id}`}
                primary={incident.type}
                secondary={`${incident.unitCode} • Vor ${incident.daysSinceCreated} Tagen`}
              />
            ))}
            {criticalIncidents.length > 3 && (
              <MoreItems count={criticalIncidents.length - 3} href="/incidents?severity=CRITICAL&resolved=false" />
            )}
          </TaskCategory>
        ) : (
          <CompletedCategory icon="🚨" title="Keine kritischen Vorfälle" />
        )}

        {/* Overdue Check-ins */}
        {hasOverdueCheckIns ? (
          <TaskCategory
            icon="⚠️"
            title={`${overdueCheckIns.length} Check-ins überfällig`}
            href="/placements?status=active"
            variant="warning"
          >
            {overdueCheckIns.slice(0, 3).map((checkIn) => (
              <TaskItem
                key={checkIn.id}
                href={`/residents/${checkIn.residentId}`}
                primary={checkIn.residentCode}
                secondary={`Woche ${checkIn.weekNumber} • ${checkIn.unitCode}`}
              />
            ))}
            {overdueCheckIns.length > 3 && (
              <MoreItems count={overdueCheckIns.length - 3} href="/placements?status=active" />
            )}
          </TaskCategory>
        ) : (
          <CompletedCategory icon="⚠️" title="Alle Check-ins aktuell" />
        )}

        {/* Unplaced Residents */}
        {hasUnplaced ? (
          <TaskCategory
            icon="🏠"
            title={`${unplacedResidents.length} Bewohner warten auf Platzierung`}
            href="/matching"
            variant="warning"
          >
            {unplacedResidents.slice(0, 3).map((resident) => (
              <TaskItem
                key={resident.id}
                href={`/residents/${resident.id}`}
                primary={resident.code}
                secondary={`Seit ${formatDateShort(resident.createdAt)}`}
              />
            ))}
            {unplacedResidents.length > 3 && (
              <MoreItems count={unplacedResidents.length - 3} href="/matching" />
            )}
          </TaskCategory>
        ) : (
          <CompletedCategory icon="🏠" title="Alle Bewohner platziert" />
        )}

        {/* Overdue Maintenance */}
        {hasOverdueMaintenance ? (
          <TaskCategory
            icon="🔧"
            title={`${overdueMaintenance.length} Wartungstickets überfällig`}
            href="/maintenance"
            variant="info"
          >
            {overdueMaintenance.slice(0, 3).map((ticket) => (
              <TaskItem
                key={ticket.id}
                href={`/maintenance/${ticket.id}`}
                primary={ticket.title}
                secondary={`${ticket.unitCode} • Vor ${ticket.daysSinceCreated} Tagen`}
              />
            ))}
            {overdueMaintenance.length > 3 && (
              <MoreItems count={overdueMaintenance.length - 3} href="/maintenance" />
            )}
          </TaskCategory>
        ) : (
          <CompletedCategory icon="🔧" title="Wartung aktuell" />
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
    critical: 'border-red-200 bg-red-50',
    warning: 'border-orange-200 bg-orange-50',
    info: 'border-yellow-200 bg-yellow-50',
  }

  const textStyles = {
    critical: 'text-red-800',
    warning: 'text-orange-800',
    info: 'text-yellow-800',
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
          Alle →
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
    <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-green-50 border border-green-200">
      <span className="text-green-600">✓</span>
      <span className="text-lg opacity-50">{icon}</span>
      <span className="text-green-700">{title}</span>
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
      className="flex items-center justify-between py-2 px-3 bg-white/60 rounded hover:bg-white/80 transition-colors"
    >
      <div>
        <span className="font-medium text-gray-900 text-sm">{primary}</span>
        <span className="text-gray-500 text-sm ml-2">{secondary}</span>
      </div>
      <span className="text-gray-400">→</span>
    </Link>
  )
}

function MoreItems({ count, href }: { count: number; href: string }) {
  return (
    <Link
      href={href}
      className="block text-center py-2 text-sm text-gray-600 hover:text-gray-900"
    >
      + {count} weitere
    </Link>
  )
}

function formatDateShort(date: Date): string {
  return new Date(date).toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'short',
  })
}
