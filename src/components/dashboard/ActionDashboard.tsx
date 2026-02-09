'use client'

import Link from 'next/link'
import { useState } from 'react'
import { VERY_OVERDUE_THRESHOLD_DAYS } from '@/lib/config/checkin-intervals'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import { INCIDENT_TYPE_LABELS_SHORT } from '@/lib/constants/labels'

// =============================================================================
// Types
// =============================================================================

interface OverdueCheckIn {
  id: string
  residentCode: string
  residentId: string
  unitCode: string
  daysSinceLastCheckIn: number
  supportLevel: string
  isVeryOverdue?: boolean
}

interface DueSoonCheckIn {
  id: string
  residentCode: string
  residentId: string
  unitCode: string
  daysUntilDue: number
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

/**
 * Problem unit based on ACTUAL incidents (evidence-based)
 */
interface ProblemUnit {
  id: string
  code: string
  /** Number of interpersonal incidents in the last 30 days */
  incidentCount: number
  /** Weighted score based on incident severity */
  problemScore: number
  /** Number of unresolved incidents */
  unresolvedCount: number
  /** Most common type of incident (e.g., NOISE_COMPLAINT) */
  primaryIssue: string
}

interface ActionDashboardProps {
  // Core stats
  occupiedBeds: number
  totalBeds: number
  availableUnits: number
  totalPlacements: number

  // Action items
  overdueCheckIns: OverdueCheckIn[]
  dueSoonCheckIns: DueSoonCheckIn[]
  unplacedResidents: UnplacedResident[]
  criticalIncidents: CriticalIncident[]
  problemUnits: ProblemUnit[]

  // Health indicators
  conflictFreeDays: number
  openMaintenanceCount: number
}

// =============================================================================
// Main Component
// =============================================================================

export function ActionDashboard({
  occupiedBeds,
  totalBeds,
  availableUnits,
  totalPlacements,
  overdueCheckIns,
  dueSoonCheckIns,
  unplacedResidents,
  criticalIncidents,
  problemUnits,
  conflictFreeDays,
  openMaintenanceCount,
}: ActionDashboardProps) {
  const freeBeds = totalBeds - occupiedBeds
  const onTimeCheckIns = totalPlacements - overdueCheckIns.length

  // Determine primary action
  const primaryAction = determinePrimaryAction({
    criticalIncidents,
    overdueCheckIns,
    unplacedResidents,
    freeBeds,
    problemUnits,
  })

  // Count total issues
  const totalIssues = criticalIncidents.length + overdueCheckIns.length + unplacedResidents.length

  // Greeting based on time of day (using client time)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'

  return (
    <div className="space-y-6">
      {/* Header with greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}!</h1>
          <p className="text-gray-500">
            {totalIssues === 0
              ? 'Alles unter Kontrolle heute.'
              : totalIssues === 1
                ? '1 Aufgabe wartet auf Sie.'
                : `${totalIssues} Aufgaben warten auf Sie.`}
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          {new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Schnellaktionen - Prominent at top */}
      <QuickActionsBar unplacedCount={unplacedResidents.length} freeBeds={freeBeds} />

      {/* Critical Alert Banner - Only shows when there are critical incidents */}
      {criticalIncidents.length > 0 && (
        <CriticalAlertBanner incidents={criticalIncidents} />
      )}

      {/* Hero Section - Primary Action */}
      <HeroAction action={primaryAction} />

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat
          label="Freie Plätze"
          value={freeBeds}
          total={totalBeds}
          href="/housing?status=AVAILABLE"
          color={freeBeds > 0 ? 'blue' : 'gray'}
          icon="🛏️"
        />
        <QuickStat
          label="Check-ins"
          value={overdueCheckIns.length}
          suffix=" überfällig"
          href="/placements?status=active"
          color={overdueCheckIns.length === 0 ? 'green' : overdueCheckIns.length <= 3 ? 'yellow' : 'red'}
          icon={overdueCheckIns.length === 0 ? '✓' : '⏰'}
          subtext={`${onTimeCheckIns}/${totalPlacements} aktuell`}
        />
        <QuickStat
          label="Harmonie"
          value={conflictFreeDays}
          suffix=" Tage"
          href="/incidents"
          color={conflictFreeDays >= 7 ? 'green' : conflictFreeDays >= 3 ? 'yellow' : 'red'}
          icon={conflictFreeDays >= 7 ? '😊' : conflictFreeDays >= 3 ? '😐' : '😟'}
          subtext="ohne Konflikte"
        />
        <QuickStat
          label="Wartung"
          value={openMaintenanceCount}
          suffix=" offen"
          href="/maintenance"
          color={openMaintenanceCount === 0 ? 'green' : openMaintenanceCount <= 3 ? 'yellow' : 'red'}
          icon={openMaintenanceCount === 0 ? '✓' : '🔧'}
        />
      </div>

      {/* Action Tiles - Only show what needs action */}
      {(totalIssues > 0 || problemUnits.length > 0) && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Offene Aufgaben</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {overdueCheckIns.length > 0 && (
            <ActionTile
              title="Check-ins durchführen"
              count={overdueCheckIns.length}
              description={`${overdueCheckIns[0]?.residentCode} wartet am längsten`}
              href={`/residents/${overdueCheckIns[0]?.residentId}`}
              color="orange"
              items={overdueCheckIns.slice(0, DISPLAY_LIMITS.dashboardItems).map(c => ({
                label: c.residentCode,
                sublabel: `${c.daysSinceLastCheckIn} Tage · ${c.unitCode}`,
                href: `/residents/${c.residentId}`,
              }))}
              allHref="/placements?status=active"
            />
          )}

          {unplacedResidents.length > 0 && (
            <ActionTile
              title="Bewohner platzieren"
              count={unplacedResidents.length}
              description="Warten auf Wohnplatz"
              href="/matching"
              color="blue"
              items={unplacedResidents.slice(0, DISPLAY_LIMITS.dashboardItems).map(r => ({
                label: r.code,
                sublabel: `Seit ${formatDaysAgo(r.createdAt)}`,
                href: `/matching?resident=${r.id}`,
              }))}
              allHref="/matching"
            />
          )}

          {problemUnits.length > 0 && (
            <ActionTile
              title="Einheiten mit Konflikten"
              count={problemUnits.length}
              description="Wiederholte Vorfälle in den letzten 30 Tagen"
              href={`/housing/${problemUnits[0]?.id}`}
              color="red"
              items={problemUnits.slice(0, DISPLAY_LIMITS.dashboardItems).map(u => ({
                label: u.code,
                sublabel: `${u.incidentCount} Vorfälle · ${INCIDENT_TYPE_LABELS_SHORT[u.primaryIssue] || u.primaryIssue}`,
                href: `/housing/${u.id}`,
              }))}
              allHref="/incidents"
            />
          )}
          </div>
        </div>
      )}

      {/* Bald fällig - Proactive section */}
      {dueSoonCheckIns.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Bald fällig</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionTile
              title="Check-ins diese Woche"
              count={dueSoonCheckIns.length}
              description="Proaktiv planen"
              href={`/residents/${dueSoonCheckIns[0]?.residentId}`}
              color="green"
              items={dueSoonCheckIns.slice(0, DISPLAY_LIMITS.dashboardItems).map(c => ({
                label: c.residentCode,
                sublabel: c.daysUntilDue === 0 ? `Heute fällig · ${c.unitCode}` : c.daysUntilDue === 1 ? `Morgen fällig · ${c.unitCode}` : `In ${c.daysUntilDue} Tagen · ${c.unitCode}`,
                href: `/residents/${c.residentId}`,
              }))}
              allHref="/placements?status=active"
            />
          </div>
        </div>
      )}

      {/* All Clear State */}
      {totalIssues === 0 && criticalIncidents.length === 0 && problemUnits.length === 0 && (
        <AllClearState
          freeBeds={freeBeds}
          conflictFreeDays={conflictFreeDays}
        />
      )}
    </div>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

interface PrimaryActionType {
  type: 'critical' | 'checkin' | 'place' | 'problem' | 'allclear'
  title: string
  description: string
  href: string
  buttonText: string
  count?: number
}

function determinePrimaryAction({
  criticalIncidents,
  overdueCheckIns,
  unplacedResidents,
  freeBeds,
  problemUnits,
}: {
  criticalIncidents: CriticalIncident[]
  overdueCheckIns: OverdueCheckIn[]
  unplacedResidents: UnplacedResident[]
  freeBeds: number
  problemUnits: ProblemUnit[]
}): PrimaryActionType {
  // Priority 1: Critical incidents
  if (criticalIncidents.length > 0) {
    return {
      type: 'critical',
      title: `${criticalIncidents.length} kritische Vorfälle`,
      description: `${INCIDENT_TYPE_LABELS_SHORT[criticalIncidents[0].type] || criticalIncidents[0].type} in ${criticalIncidents[0].unitCode}`,
      href: `/incidents/${criticalIncidents[0].id}`,
      buttonText: 'Sofort bearbeiten',
      count: criticalIncidents.length,
    }
  }

  // Priority 2: Very overdue check-ins (using config threshold)
  const veryOverdue = overdueCheckIns.filter(c => c.isVeryOverdue || c.daysSinceLastCheckIn > VERY_OVERDUE_THRESHOLD_DAYS + 28)
  if (veryOverdue.length > 0) {
    return {
      type: 'checkin',
      title: `Check-in dringend: ${veryOverdue[0].residentCode}`,
      description: `Seit ${veryOverdue[0].daysSinceLastCheckIn} Tagen nicht gesehen`,
      href: `/residents/${veryOverdue[0].residentId}`,
      buttonText: 'Check-in starten',
      count: veryOverdue.length,
    }
  }

  // Priority 3: Unplaced residents with available beds
  if (unplacedResidents.length > 0 && freeBeds > 0) {
    return {
      type: 'place',
      title: `${unplacedResidents.length} Bewohner platzieren`,
      description: `${freeBeds} freie Plätze verfügbar`,
      href: '/matching',
      buttonText: 'Matching starten',
      count: unplacedResidents.length,
    }
  }

  // Priority 4: Problem units with unresolved incidents
  const unitsWithUnresolved = problemUnits.filter(u => u.unresolvedCount > 0)
  if (unitsWithUnresolved.length > 0) {
    const topUnit = unitsWithUnresolved[0]
    return {
      type: 'problem',
      title: `${topUnit.code}: ${topUnit.unresolvedCount} offene Konflikte`,
      description: `Hauptproblem: ${INCIDENT_TYPE_LABELS_SHORT[topUnit.primaryIssue] || topUnit.primaryIssue}`,
      href: `/housing/${topUnit.id}`,
      buttonText: 'Analysieren',
      count: unitsWithUnresolved.length,
    }
  }

  // Priority 5: Regular overdue check-ins
  if (overdueCheckIns.length > 0) {
    return {
      type: 'checkin',
      title: `${overdueCheckIns.length} Check-ins anstehend`,
      description: `Nächster: ${overdueCheckIns[0].residentCode}`,
      href: `/residents/${overdueCheckIns[0].residentId}`,
      buttonText: 'Check-in starten',
      count: overdueCheckIns.length,
    }
  }

  // Priority 6: Problem units (all resolved but worth monitoring)
  if (problemUnits.length > 0) {
    return {
      type: 'problem',
      title: `${problemUnits.length} Einheiten beobachten`,
      description: `${problemUnits[0].code} hatte ${problemUnits[0].incidentCount} Vorfälle`,
      href: `/housing/${problemUnits[0].id}`,
      buttonText: 'Überprüfen',
      count: problemUnits.length,
    }
  }

  // All clear!
  return {
    type: 'allclear',
    title: 'Alles erledigt!',
    description: 'Keine dringenden Aufgaben',
    href: '/residents/new',
    buttonText: 'Neuen Bewohner erfassen',
  }
}

function HeroAction({ action }: { action: PrimaryActionType }) {
  const colorStyles = {
    critical: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
    checkin: 'bg-gradient-to-r from-orange-400 to-orange-500 text-white',
    place: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
    problem: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
    allclear: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white',
  }

  const icons = {
    critical: '🚨',
    checkin: '👋',
    place: '🏠',
    problem: '⚠️',
    allclear: '✨',
  }

  return (
    <Link
      href={action.href}
      className={`block rounded-2xl p-6 md:p-8 ${colorStyles[action.type]} shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{icons[action.type]}</span>
          <div>
            <h2 className="text-xl md:text-2xl font-bold">{action.title}</h2>
            <p className="text-white/80 mt-1">{action.description}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <span className="px-4 py-2 bg-white/20 rounded-lg font-semibold">
            {action.buttonText} →
          </span>
        </div>
      </div>
      <div className="md:hidden mt-4">
        <span className="inline-block px-4 py-2 bg-white/20 rounded-lg font-semibold">
          {action.buttonText} →
        </span>
      </div>
    </Link>
  )
}

function CriticalAlertBanner({ incidents }: { incidents: CriticalIncident[] }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const incidentLabel = INCIDENT_TYPE_LABELS_SHORT[incidents[0].type] || incidents[0].type

  return (
    <div className="bg-red-600 text-white px-4 py-3 rounded-lg flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🚨</span>
        <div>
          <span className="font-bold">{incidents.length} kritische Vorfälle erfordern sofortige Aufmerksamkeit</span>
          <span className="ml-2 opacity-80">• {incidentLabel} in {incidents[0].unitCode}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={`/incidents/${incidents[0].id}`}
          className="px-3 py-1 bg-white text-red-600 rounded font-medium hover:bg-red-50"
        >
          Bearbeiten
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-red-500 rounded"
          aria-label="Schliessen"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

interface QuickStatProps {
  label: string
  value: number
  total?: number
  suffix?: string
  subtext?: string
  href: string
  color: 'green' | 'yellow' | 'red' | 'blue' | 'gray'
  icon: string
}

function QuickStat({ label, value, total, suffix, subtext, href, color, icon }: QuickStatProps) {
  const colorStyles = {
    green: 'border-green-200 bg-green-50 text-green-700',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    gray: 'border-gray-200 bg-gray-50 text-gray-600',
  }

  const valueColorStyles = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    gray: 'text-gray-500',
  }

  return (
    <Link
      href={href}
      className={`block p-4 rounded-xl border-2 ${colorStyles[color]} hover:shadow-md transition-all`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xl">{icon}</span>
        <span className={`text-2xl font-bold ${valueColorStyles[color]}`}>
          {value}{suffix}
        </span>
      </div>
      <div className="text-sm font-medium">{label}</div>
      {subtext && (
        <div className="text-xs opacity-70 mt-0.5">{subtext}</div>
      )}
      {total !== undefined && (
        <div className="mt-2 h-1.5 bg-white/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-current rounded-full transition-all"
            style={{ width: `${(value / total) * 100}%` }}
          />
        </div>
      )}
    </Link>
  )
}

interface ActionTileProps {
  title: string
  count: number
  description: string
  href: string
  color: 'orange' | 'blue' | 'red' | 'green'
  items: { label: string; sublabel: string; href: string }[]
  allHref: string
}

function ActionTile({ title, count, description, href, color, items, allHref }: ActionTileProps) {
  const colorStyles = {
    orange: 'border-orange-200 hover:border-orange-300',
    blue: 'border-blue-200 hover:border-blue-300',
    red: 'border-red-200 hover:border-red-300',
    green: 'border-green-200 hover:border-green-300',
  }

  const badgeStyles = {
    orange: 'bg-orange-100 text-orange-700',
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
    green: 'bg-green-100 text-green-700',
  }

  return (
    <div className={`card border-2 ${colorStyles[color]} transition-colors`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-sm font-bold ${badgeStyles[color]}`}>
          {count}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div>
              <span className="font-medium text-gray-900 text-sm">{item.label}</span>
              <span className="text-gray-500 text-sm ml-2">{item.sublabel}</span>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
        ))}
      </div>

      {count > DISPLAY_LIMITS.dashboardItems && (
        <Link
          href={allHref}
          className="block text-center mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600 hover:text-gray-900"
        >
          Alle {count} anzeigen →
        </Link>
      )}
    </div>
  )
}

function AllClearState({ freeBeds, conflictFreeDays }: { freeBeds: number; conflictFreeDays: number }) {
  return (
    <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 text-center py-12">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-green-800 mb-2">Alles unter Kontrolle!</h2>
      <p className="text-green-600 mb-6">
        {conflictFreeDays > 0 && `${conflictFreeDays} Tage ohne Konflikte. `}
        {freeBeds > 0 ? `${freeBeds} Plätze für neue Bewohner bereit.` : 'Alle Plätze belegt.'}
      </p>
      <div className="flex justify-center gap-4">
        <Link href="/residents/new" className="btn-primary bg-green-600 hover:bg-green-700">
          Neuen Bewohner erfassen
        </Link>
        <Link href="/analytics" className="btn-outline text-green-700 border-green-300 hover:bg-green-100">
          Statistiken ansehen
        </Link>
      </div>
    </div>
  )
}

function QuickActionsBar({ unplacedCount, freeBeds }: { unplacedCount: number; freeBeds: number }) {
  const showMatchingHighlight = unplacedCount > 0 && freeBeds > 0

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Schnellaktionen</h2>
        {freeBeds > 0 && (
          <span className="text-xs text-gray-400">{freeBeds} Plätze frei</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <QuickActionButton href="/residents/new" icon="+" label="Neuer Bewohner" variant="primary" />
        <QuickActionButton href="/housing/new" icon="+" label="Neue Einheit" variant="primary" />
        <QuickActionButton
          href="/matching"
          icon="🔄"
          label="Matching starten"
          variant={showMatchingHighlight ? 'highlight' : 'secondary'}
          badge={showMatchingHighlight ? unplacedCount : undefined}
        />
        <QuickActionButton href="/incidents/new" icon="📝" label="Vorfall melden" variant="secondary" />
        <QuickActionButton href="/maintenance/new" icon="🔧" label="Wartungsticket" variant="secondary" />
      </div>
    </div>
  )
}

function QuickActionButton({
  href,
  icon,
  label,
  variant = 'secondary',
  badge,
}: {
  href: string
  icon: string
  label: string
  variant?: 'primary' | 'secondary' | 'highlight'
  badge?: number
}) {
  const variantStyles = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    highlight: 'bg-blue-600 text-white hover:bg-blue-700',
  }

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${variantStyles[variant]}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </Link>
  )
}

// =============================================================================
// Utilities
// =============================================================================

function formatDaysAgo(date: Date): string {
  const days = Math.ceil((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'heute'
  if (days === 1) return 'gestern'
  return `${days} Tagen`
}

export default ActionDashboard
