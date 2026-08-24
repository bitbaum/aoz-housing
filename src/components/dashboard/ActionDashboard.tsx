'use client'

import { Bed, Clock, Check, Wrench, Smile, GraduationCap, CalendarClock } from 'lucide-react'
import { urgencyForGoodStreak, urgencyForOpenCount } from '@/lib/config/urgency'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'
import {
  sectionVisible,
  fallbackCta,
  workspaceState,
  type DashboardSection,
} from '@/lib/config/dashboard'
import type { StaffRole } from '@/lib/auth/role-policy'
import { INCIDENT_TYPE_LABELS_SHORT, DASHBOARD_LABELS } from '@/lib/constants/labels'
import { daysSinceCeil } from '@/lib/utils'
import { residentName } from '@/lib/utils/resident-name'
import { HeroAction, CriticalAlertBanner, determinePrimaryAction } from './PrimaryActionHero'
import { QuickStat } from './QuickStatsRow'
import { ActionTile } from './ActionTilesGrid'
import { AllClearState } from './AllClearState'
import { EmptyWorkspaceState } from './EmptyWorkspaceState'
import type {
  OverdueCheckIn,
  DueSoonCheckIn,
  UnplacedResident,
  CriticalIncident,
  ProblemUnit,
  PendingTransferRequest,
  ProposalAwaitingStaff,
} from './types'

// =============================================================================
// Types
// =============================================================================

interface ActionDashboardProps {
  /** Gates which sections render — @see lib/config/dashboard.ts */
  role: StaffRole

  // Core stats
  occupiedBeds: number
  totalBeds: number
  totalPlacements: number

  /**
   * How many people and units exist AT ALL — not how many need something.
   * Without these the dashboard cannot tell "nothing to do" from "no data
   * yet", and reports an untouched database as finished work.
   * @see lib/config/dashboard.ts — workspaceState()
   */
  residentCount: number
  housingUnitCount: number

  // Action items
  overdueCheckIns: OverdueCheckIn[]
  dueSoonCheckIns: DueSoonCheckIn[]
  unplacedResidents: UnplacedResident[]
  criticalIncidents: CriticalIncident[]
  problemUnits: ProblemUnit[]
  pendingTransfers: PendingTransferRequest[]
  proposalsAwaitingStaff: ProposalAwaitingStaff[]

  // Health indicators
  conflictFreeDays: number
  openMaintenanceCount: number
  learningInProgressCount: number
  learningRecentCompletions: number
  upcomingEventsCount: number

  /**
   * Computed on the server and passed in, NOT derived here. This component is
   * server-rendered as well as hydrated, and `new Date()` means UTC in the
   * container and Europe/Zurich in the browser — a difference that made React
   * discard the whole tree and rebuild it. @see lib/utils/local-time.ts
   */
  greeting: string
  todayLabel: string
}

// =============================================================================
// Utilities
// =============================================================================

/** "Tag" for one, "Tage" for anything else. */
function daysWord(count: number): string {
  return count === 1 ? DASHBOARD_LABELS.statDaySuffixSingular : DASHBOARD_LABELS.statDaysSuffix
}

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
  role,
  residentCount,
  housingUnitCount,
  occupiedBeds,
  totalBeds,
  totalPlacements,
  overdueCheckIns,
  dueSoonCheckIns,
  unplacedResidents,
  criticalIncidents,
  problemUnits,
  pendingTransfers,
  proposalsAwaitingStaff,
  conflictFreeDays,
  openMaintenanceCount,
  learningInProgressCount,
  learningRecentCompletions,
  upcomingEventsCount,
  greeting,
  todayLabel,
}: ActionDashboardProps) {
  const show = (section: DashboardSection) => sectionVisible(role, section)
  const freeBeds = totalBeds - occupiedBeds
  const onTimeCheckIns = totalPlacements - overdueCheckIns.length

  // Determine primary action
  const primaryAction = determinePrimaryAction({
    criticalIncidents,
    overdueCheckIns,
    unplacedResidents,
    freeBeds,
    problemUnits,
    proposalsAwaitingStaff,
    role,
  })

  // Count total issues — every queue that waits on a staff answer, not just
  // the placement ones.
  const totalIssues =
    criticalIncidents.length +
    overdueCheckIns.length +
    unplacedResidents.length +
    pendingTransfers.length +
    proposalsAwaitingStaff.length

  // "Nothing to do" and "nothing entered yet" are different facts and get
  // different screens. @see lib/config/dashboard.ts
  const state = workspaceState({
    residentCount,
    openTaskCount: totalIssues + problemUnits.length,
  })

  return (
    <div className="space-y-6">
      {/* Header with greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ui-text">{greeting}!</h1>
          <p className="text-ui-muted">
            {state === 'empty'
              ? DASHBOARD_LABELS.emptySummary
              : totalIssues === 0
                ? DASHBOARD_LABELS.allClearSummary
                : totalIssues === 1
                  ? DASHBOARD_LABELS.oneTaskWaiting
                  : `${totalIssues} ${DASHBOARD_LABELS.tasksWaitingSuffix}`}
          </p>
        </div>
        <div className="text-right text-sm text-ui-muted">{todayLabel}</div>
      </div>

      {/* Critical Alert Banner - Only shows when there are critical incidents */}
      {criticalIncidents.length > 0 && (
        <CriticalAlertBanner incidents={criticalIncidents} />
      )}

      {/* Exactly ONE summary panel. All three used to render together on a
          quiet day: the hero ("Alles erledigt!"), the all-clear block
          ("Alles unter Kontrolle!") and the greeting line — three sentences
          and two identical buttons for one fact. The hero names the next
          ACTION, so when there is none it has nothing to say and yields to
          the block that carries the actual numbers. */}
      {state === 'empty' ? (
        <EmptyWorkspaceState role={role} housingUnitCount={housingUnitCount} />
      ) : state === 'quiet' ? (
        <AllClearState
          freeBeds={show('occupancy') ? freeBeds : null}
          conflictFreeDays={show('incidents') ? conflictFreeDays : null}
          ctaHref={fallbackCta(role).href}
          ctaLabel={DASHBOARD_LABELS[fallbackCta(role).labelKey]}
        />
      ) : (
        <HeroAction action={primaryAction} />
      )}

      {/* Quick Stats Row — one pulse tile per pillar the role works in.
          Which tiles exist is the config's decision, not this component's. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {show('occupancy') && (
          <QuickStat
            label={DASHBOARD_LABELS.statFreeBeds}
            value={freeBeds}
            total={totalBeds}
            href="/housing?status=AVAILABLE"
            urgency="neutral"
            icon={<Bed className="w-5 h-5" />}
            subtext={`${occupiedBeds}/${totalBeds} ${DASHBOARD_LABELS.occupancyOccupied}`}
          />
        )}
        {show('checkIns') && (
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
        )}
        {show('incidents') && (
          <QuickStat
            label={DASHBOARD_LABELS.statHarmony}
            value={conflictFreeDays}
            suffix={` ${daysWord(conflictFreeDays)}`}
            href="/incidents"
            urgency={urgencyForGoodStreak(conflictFreeDays)}
            icon={<Smile className="w-5 h-5" />}
            subtext={DASHBOARD_LABELS.statNoConflicts}
          />
        )}
        {show('maintenance') && (
          <QuickStat
            label={DASHBOARD_LABELS.statMaintenance}
            value={openMaintenanceCount}
            suffix={` ${DASHBOARD_LABELS.statOpenSuffix}`}
            href="/maintenance"
            urgency={urgencyForOpenCount(openMaintenanceCount)}
            icon={openMaintenanceCount === 0 ? <Check className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
          />
        )}
        {show('learning') && (
          <QuickStat
            label={DASHBOARD_LABELS.statLearning}
            value={learningInProgressCount}
            suffix={` ${DASHBOARD_LABELS.statRunningSuffix}`}
            href="/learning"
            urgency="neutral"
            icon={<GraduationCap className="w-5 h-5" />}
            subtext={DASHBOARD_LABELS.statLearningCompletions(learningRecentCompletions)}
          />
        )}
        {show('events') && (
          <QuickStat
            label={DASHBOARD_LABELS.statEvents}
            value={upcomingEventsCount}
            suffix={` ${DASHBOARD_LABELS.statPlannedSuffix}`}
            href="/events"
            urgency="neutral"
            icon={<CalendarClock className="w-5 h-5" />}
          />
        )}
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
              description={`${overdueCheckIns[0] ? residentName({ code: overdueCheckIns[0].residentCode, displayName: overdueCheckIns[0].residentDisplayName }) : ''} ${DASHBOARD_LABELS.tileWaitingLongestSuffix}`}
              href={`/residents/${overdueCheckIns[0]?.residentId}`}
              urgency={urgencyForOpenCount(overdueCheckIns.length)}
              items={overdueCheckIns.slice(0, DISPLAY_LIMITS.dashboardItems).map(c => ({
                label: residentName({ code: c.residentCode, displayName: c.residentDisplayName }),
                sublabel: `${c.daysSinceLastCheckIn} ${daysWord(c.daysSinceLastCheckIn)} · ${c.unitCode}`,
                href: `/residents/${c.residentId}`,
              }))}
              allHref="/placements?status=active&overdue=1"
            />
          )}

          {unplacedResidents.length > 0 && (
            <ActionTile
              title={DASHBOARD_LABELS.tilePlaceResidents}
              count={unplacedResidents.length}
              description={`${unplacedResidents[0] ? residentName(unplacedResidents[0]) : ''} ${DASHBOARD_LABELS.tileWaitingLongestSuffix}`}
              href="/matching"
              urgency="neutral"
              items={unplacedResidents.slice(0, DISPLAY_LIMITS.dashboardItems).map(r => ({
                label: residentName(r),
                sublabel: `${DASHBOARD_LABELS.tileSincePrefix} ${formatDaysAgo(r.createdAt)}`,
                href: `/matching?resident=${r.id}`,
              }))}
              allHref="/matching"
            />
          )}

          {pendingTransfers.length > 0 && (
            <ActionTile
              title={DASHBOARD_LABELS.tileTransferRequests}
              count={pendingTransfers.length}
              description={DASHBOARD_LABELS.tileTransferRequestsDesc}
              href="/transfer-requests"
              urgency={urgencyForOpenCount(pendingTransfers.length)}
              items={pendingTransfers.slice(0, DISPLAY_LIMITS.dashboardItems).map(t => ({
                label: residentName({ code: t.residentCode, displayName: t.residentDisplayName }),
                sublabel: `${t.unitCode ? `${t.unitCode} · ` : ''}${DASHBOARD_LABELS.tileSincePrefix} ${t.daysSinceCreated} ${daysWord(t.daysSinceCreated)}`,
                href: '/transfer-requests',
              }))}
              allHref="/transfer-requests"
            />
          )}

          {proposalsAwaitingStaff.length > 0 && (
            <ActionTile
              title={DASHBOARD_LABELS.tileProposals}
              count={proposalsAwaitingStaff.length}
              description={DASHBOARD_LABELS.tileProposalsDesc}
              href="/rules"
              urgency={urgencyForOpenCount(proposalsAwaitingStaff.length)}
              items={proposalsAwaitingStaff.slice(0, DISPLAY_LIMITS.dashboardItems).map(p => ({
                label: p.title,
                sublabel: `${p.unitCode} · ${DASHBOARD_LABELS.tileSincePrefix} ${p.daysWaiting} ${daysWord(p.daysWaiting)}`,
                href: '/rules',
              }))}
              allHref="/rules"
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
                label: residentName({ code: c.residentCode, displayName: c.residentDisplayName }),
                sublabel: c.daysUntilDue === 0 ? `${DASHBOARD_LABELS.dueTodayPrefix} · ${c.unitCode}` : c.daysUntilDue === 1 ? `${DASHBOARD_LABELS.dueTomorrowPrefix} · ${c.unitCode}` : `${DASHBOARD_LABELS.dueInPrefix} ${c.daysUntilDue} ${DASHBOARD_LABELS.dueInSuffix} · ${c.unitCode}`,
                href: `/residents/${c.residentId}`,
              }))}
              allHref="/placements?status=active"
            />
          </div>
        </div>
      )}

    </div>
  )
}

export default ActionDashboard
