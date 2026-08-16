'use client'

import { Bed, Clock, Check, Wrench, Smile } from 'lucide-react'
import { urgencyForGoodStreak, urgencyForOpenCount } from '@/lib/config/urgency'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import { INCIDENT_TYPE_LABELS_SHORT, DASHBOARD_LABELS } from '@/lib/constants/labels'
import { daysSinceCeil } from '@/lib/utils'
import { HeroAction, CriticalAlertBanner, determinePrimaryAction } from './PrimaryActionHero'
import { QuickStat } from './QuickStatsRow'
import { ActionTile } from './ActionTilesGrid'
import { AllClearState } from './AllClearState'
import type { OverdueCheckIn, DueSoonCheckIn, UnplacedResident, CriticalIncident, ProblemUnit } from './types'

// =============================================================================
// Types
// =============================================================================

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
// Utilities
// =============================================================================

function formatDaysAgo(date: Date): string {
  const days = daysSinceCeil(date)
  if (days === 0) return DASHBOARD_LABELS.today
  if (days === 1) return DASHBOARD_LABELS.yesterday
  return `${days} ${DASHBOARD_LABELS.daysAgo}`
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
  const greeting = hour < 12 ? DASHBOARD_LABELS.greetingMorning : hour < 18 ? DASHBOARD_LABELS.greetingDay : DASHBOARD_LABELS.greetingEvening

  return (
    <div className="space-y-6">
      {/* Header with greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ui-text">{greeting}!</h1>
          <p className="text-ui-muted">
            {totalIssues === 0
              ? DASHBOARD_LABELS.allClearSummary
              : totalIssues === 1
                ? DASHBOARD_LABELS.oneTaskWaiting
                : `${totalIssues} ${DASHBOARD_LABELS.tasksWaitingSuffix}`}
          </p>
        </div>
        <div className="text-right text-sm text-ui-muted">
          {new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Critical Alert Banner - Only shows when there are critical incidents */}
      {criticalIncidents.length > 0 && (
        <CriticalAlertBanner incidents={criticalIncidents} />
      )}

      {/* Hero Section - Primary Action */}
      <HeroAction action={primaryAction} />

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <QuickStat
          label={DASHBOARD_LABELS.statFreeBeds}
          value={freeBeds}
          total={totalBeds}
          href="/housing?status=AVAILABLE"
          urgency="neutral"
          icon={<Bed className="w-5 h-5" />}
          subtext={`${occupiedBeds}/${totalBeds} ${DASHBOARD_LABELS.occupancyOccupied}`}
        />
        <QuickStat
          label={DASHBOARD_LABELS.statCheckIns}
          value={overdueCheckIns.length}
          suffix={` ${DASHBOARD_LABELS.statOverdueSuffix}`}
          href="/placements?status=active&overdue=1"
          urgency={urgencyForOpenCount(overdueCheckIns.length)}
          icon={overdueCheckIns.length === 0 ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          subtext={
            onTimeCheckIns === 0
              ? DASHBOARD_LABELS.statNoneCurrent
              : onTimeCheckIns === totalPlacements
              ? DASHBOARD_LABELS.statAllCurrent
              : `${onTimeCheckIns}/${totalPlacements} ${DASHBOARD_LABELS.statCurrentSuffix}`
          }
        />
        <QuickStat
          label={DASHBOARD_LABELS.statHarmony}
          value={conflictFreeDays}
          suffix={` ${DASHBOARD_LABELS.statDaysSuffix}`}
          href="/incidents"
          urgency={urgencyForGoodStreak(conflictFreeDays)}
          icon={<Smile className="w-5 h-5" />}
          subtext={DASHBOARD_LABELS.statNoConflicts}
        />
        <QuickStat
          label={DASHBOARD_LABELS.statMaintenance}
          value={openMaintenanceCount}
          suffix={` ${DASHBOARD_LABELS.statOpenSuffix}`}
          href="/maintenance"
          urgency={urgencyForOpenCount(openMaintenanceCount)}
          icon={openMaintenanceCount === 0 ? <Check className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
        />
      </div>

      {/* Action Tiles - Only show what needs action */}
      {(totalIssues > 0 || problemUnits.length > 0) && (
        <div>
          <h2 className="text-sm font-semibold text-ui-muted uppercase tracking-wide mb-3">{DASHBOARD_LABELS.sectionOpenTasks}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {overdueCheckIns.length > 0 && (
            <ActionTile
              title={DASHBOARD_LABELS.tileCheckIns}
              count={overdueCheckIns.length}
              description={`${overdueCheckIns[0]?.residentCode} ${DASHBOARD_LABELS.tileWaitingLongestSuffix}`}
              href={`/residents/${overdueCheckIns[0]?.residentId}`}
              urgency={urgencyForOpenCount(overdueCheckIns.length)}
              items={overdueCheckIns.slice(0, DISPLAY_LIMITS.dashboardItems).map(c => ({
                label: c.residentCode,
                sublabel: `${c.daysSinceLastCheckIn} ${DASHBOARD_LABELS.statDaysSuffix} · ${c.unitCode}`,
                href: `/residents/${c.residentId}`,
              }))}
              allHref="/placements?status=active&overdue=1"
            />
          )}

          {unplacedResidents.length > 0 && (
            <ActionTile
              title={DASHBOARD_LABELS.tilePlaceResidents}
              count={unplacedResidents.length}
              description={`${unplacedResidents[0]?.code} ${DASHBOARD_LABELS.tileWaitingLongestSuffix}`}
              href="/matching"
              urgency="neutral"
              items={unplacedResidents.slice(0, DISPLAY_LIMITS.dashboardItems).map(r => ({
                label: r.code,
                sublabel: `${DASHBOARD_LABELS.tileSincePrefix} ${formatDaysAgo(r.createdAt)}`,
                href: `/matching?resident=${r.id}`,
              }))}
              allHref="/matching"
            />
          )}

          {problemUnits.length > 0 && (
            <ActionTile
              title={DASHBOARD_LABELS.tileConflictUnits}
              count={problemUnits.length}
              description={DASHBOARD_LABELS.tileConflictUnitsDesc}
              href={`/housing/${problemUnits[0]?.id}`}
              urgency="critical"
              items={problemUnits.slice(0, DISPLAY_LIMITS.dashboardItems).map(u => ({
                label: u.code,
                sublabel: `${u.incidentCount} ${DASHBOARD_LABELS.tileIncidents} · ${INCIDENT_TYPE_LABELS_SHORT[u.primaryIssue] || u.primaryIssue}`,
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
          <h2 className="text-sm font-semibold text-ui-muted uppercase tracking-wide mb-3">{DASHBOARD_LABELS.sectionDueSoon}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionTile
              title={DASHBOARD_LABELS.tileCheckInsThisWeek}
              count={dueSoonCheckIns.length}
              description={DASHBOARD_LABELS.tilePlanProactively}
              href={`/residents/${dueSoonCheckIns[0]?.residentId}`}
              urgency="neutral"
              items={dueSoonCheckIns.slice(0, DISPLAY_LIMITS.dashboardItems).map(c => ({
                label: c.residentCode,
                sublabel: c.daysUntilDue === 0 ? `${DASHBOARD_LABELS.dueTodayPrefix} · ${c.unitCode}` : c.daysUntilDue === 1 ? `${DASHBOARD_LABELS.dueTomorrowPrefix} · ${c.unitCode}` : `${DASHBOARD_LABELS.dueInPrefix} ${c.daysUntilDue} ${DASHBOARD_LABELS.dueInSuffix} · ${c.unitCode}`,
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

export default ActionDashboard
