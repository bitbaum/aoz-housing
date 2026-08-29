import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { daysSinceCeil, getDateDaysAgo } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }
import { ActionDashboard } from '@/components/dashboard/ActionDashboard'
import { DASHBOARD_LABELS } from '@/lib/constants/labels'
import { dayPartAt, formatWeekdayDate, type DayPart } from '@/lib/utils/local-time'
import { getCurrentUser } from '@/lib/auth'

/** Which greeting belongs to which part of the day. */
const GREETING_BY_DAY_PART: Record<DayPart, 'greetingMorning' | 'greetingDay' | 'greetingEvening'> =
  {
    morning: 'greetingMorning',
    day: 'greetingDay',
    evening: 'greetingEvening',
  }
import { RESIDENT_NAME_SELECT } from '@/lib/utils/resident-name'
import { getCheckInInterval, VERY_OVERDUE_THRESHOLD_DAYS } from '@/lib/config/checkin-intervals'
import {
  PROBLEM_DETECTION,
  INCIDENT_SEVERITY_WEIGHTS,
  DISPLAY_LIMITS,
} from '@/lib/config/thresholds'
import { sectionVisible, type DashboardSection } from '@/lib/config/dashboard'
import { LEARNING_PULSE_WINDOW_DAYS } from '@/lib/config/learning'
import { getProposalsAwaitingStaff } from '@/lib/governance/queries'
import type { StaffRole } from '@/lib/auth/role-policy'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const now = new Date()
  const user = await getCurrentUser()

  // Middleware guards this route, so `user` is only null in the moment
  // between session expiry and redirect; defaulting to ADMIN there matches
  // the old show-everything behavior for that dying render.
  const role: StaffRole = user?.role ?? 'ADMIN'
  const show = (section: DashboardSection) => sectionVisible(role, section)

  // Fetch only what this role's dashboard renders (config/dashboard.ts is
  // the SSOT for that mapping) — a Jobcoach's dashboard runs the learning
  // queries and none of the housing ones.
  const [
    // How many people and units EXIST — not how many need something. The
    // dashboard cannot otherwise tell an empty workspace from a finished one,
    // and reports a database nobody has filled in as "Alles erledigt".
    //
    // Deliberately NOT derived from the `residents` list below: that one is
    // gated on placements:write, so a Jobcoach would see zero residents and
    // be told the workspace is empty while 24 people sit in it. Every staff
    // role holds residents:read, so this count is safe for all of them.
    residentCount,
    housingUnitCount,
    residents,
    units,
    // Occupancy is derived from placements, but the free-beds stat must stay
    // correct for roles that read housing WITHOUT reading placements
    // (Sozialarbeit) — so the aggregate count is its own query, gated with
    // the occupancy section rather than the check-in list.
    occupiedBeds,
    placements,
    recentIncidents,
    openMaintenanceCount,
    pendingTransfersRaw,
    proposalsRaw,
    learningInProgressCount,
    learningRecentCompletions,
    upcomingEventsCount,
    activeStaffCount,
    neverSignedInStaffCount,
  ] = await Promise.all([
    prisma.resident.count(),
    // Only used to pick the first setup step, which requires housing:write —
    // a subset of the housing:read this section is gated on.
    show('occupancy') ? prisma.housingUnit.count() : 0,
    show('matching')
      ? prisma.resident.findMany({
          where: { status: { in: ['ACTIVE', 'PLACED'] } },
          select: { ...RESIDENT_NAME_SELECT, status: true, createdAt: true },
        })
      : [],
    show('occupancy')
      ? prisma.housingUnit.findMany({
          select: { totalBeds: true, status: true },
        })
      : [],
    show('occupancy') ? prisma.placement.count({ where: { status: 'ACTIVE' } }) : 0,
    show('checkIns')
      ? prisma.placement.findMany({
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            startDate: true,
            resident: {
              select: { ...RESIDENT_NAME_SELECT, supportLevel: true },
            },
            housingUnit: {
              select: { code: true },
            },
            checkIns: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { createdAt: true },
            },
          },
        })
      : [],
    show('incidents')
      ? prisma.incident.findMany({
          where: {
            date: { gte: getDateDaysAgo(PROBLEM_DETECTION.recentIncidentsDays) },
          },
          select: {
            id: true,
            type: true,
            category: true,
            severity: true,
            date: true,
            resolvedAt: true,
            housingUnitId: true,
            housingUnit: { select: { code: true } },
          },
          orderBy: { date: 'desc' },
        })
      : [],
    show('maintenance')
      ? prisma.maintenanceRequest.count({
          where: {
            status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'] },
          },
        })
      : 0,
    show('transferRequests')
      ? prisma.transferRequest.findMany({
          where: { status: 'PENDING' },
          select: {
            id: true,
            createdAt: true,
            resident: { select: RESIDENT_NAME_SELECT },
            currentPlacement: {
              select: { housingUnit: { select: { code: true } } },
            },
          },
          orderBy: { createdAt: 'asc' },
        })
      : [],
    show('proposals') ? getProposalsAwaitingStaff() : [],
    show('learning') ? prisma.learningRecord.count({ where: { status: 'IN_PROGRESS' } }) : 0,
    show('learning')
      ? prisma.learningRecord.count({
          where: {
            status: 'COMPLETED',
            completedAt: { gte: getDateDaysAgo(LEARNING_PULSE_WINDOW_DAYS) },
          },
        })
      : 0,
    show('events')
      ? prisma.houseEvent.count({
          where: { status: 'PUBLISHED', startsAt: { gte: now } },
        })
      : 0,
    show('team') ? prisma.user.count({ where: { active: true } }) : 0,
    // Provisioned and never used. A staff code that was issued but never
    // signed in with is invisible everywhere else in the product — it is not
    // an error, it is an unfinished handover, and only Leitung can close it.
    show('team') ? prisma.user.count({ where: { active: true, lastLoginAt: null } }) : 0,
  ])

  // =============================================================================
  // Calculate Core Stats
  // =============================================================================

  const totalBeds = units.reduce((sum, u) => sum + u.totalBeds, 0)

  // =============================================================================
  // Overdue Check-ins (using config intervals)
  // =============================================================================

  // Calculate check-in status for all placements
  const checkInStatuses = placements.map((p) => {
    const supportLevel = p.resident.supportLevel || 'STANDARD'
    const intervalDays = getCheckInInterval(supportLevel)
    const lastCheckIn = p.checkIns?.[0]
    const daysSinceCheckIn = lastCheckIn
      ? daysSinceCeil(lastCheckIn.createdAt, now)
      : daysSinceCeil(p.startDate, now)

    const daysUntilDue = intervalDays - daysSinceCheckIn
    const isOverdue = daysSinceCheckIn > intervalDays
    const isVeryOverdue = daysSinceCheckIn > intervalDays + VERY_OVERDUE_THRESHOLD_DAYS
    const isDueSoon = !isOverdue && daysUntilDue <= 7 && daysUntilDue >= 0

    return {
      id: p.id,
      residentCode: p.resident.code,
      residentDisplayName: p.resident.displayName,
      residentId: p.resident.id,
      unitCode: p.housingUnit.code,
      daysSinceLastCheckIn: daysSinceCheckIn,
      daysUntilDue,
      supportLevel,
      isOverdue,
      isVeryOverdue,
      isDueSoon,
    }
  })

  const overdueCheckIns = checkInStatuses
    .filter((p) => p.isOverdue)
    .sort((a, b) => b.daysSinceLastCheckIn - a.daysSinceLastCheckIn)

  const dueSoonCheckIns = checkInStatuses
    .filter((p) => p.isDueSoon)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)

  const totalPlacements = placements.length

  // =============================================================================
  // Unplaced Residents
  // =============================================================================

  const unplacedResidents = residents
    .filter((r) => r.status === 'ACTIVE')
    .map((r) => ({
      id: r.id,
      code: r.code,
      displayName: r.displayName,
      createdAt: r.createdAt,
    }))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  // =============================================================================
  // Critical Incidents (Unresolved)
  // =============================================================================

  const criticalIncidents = recentIncidents
    .filter((i) => i.severity === 'CRITICAL' && !i.resolvedAt)
    .map((i) => ({
      id: i.id,
      type: i.type,
      unitCode: i.housingUnit?.code || 'Unbekannt',
      unitId: i.housingUnitId,
      daysSinceCreated: daysSinceCeil(i.date, now),
    }))

  // =============================================================================
  // Conflict-free Days (Interpersonal incidents only)
  // =============================================================================

  const interpersonalIncidents = recentIncidents.filter((i) => i.category === 'INTERPERSONAL')
  let conflictFreeDays: number = PROBLEM_DETECTION.recentIncidentsDays

  if (interpersonalIncidents.length > 0) {
    const mostRecent = interpersonalIncidents[0] // already sorted by date desc
    conflictFreeDays = daysSinceCeil(mostRecent.date, now)
  }

  // =============================================================================
  // Problem Units - EVIDENCE-BASED (actual incidents, not theoretical compatibility)
  // =============================================================================

  // Group incidents by unit and calculate problem score
  // Element-level type: `typeof recentIncidents` is now a union with the
  // empty-array branch of the role-gated fetch, and pushing into a union of
  // arrays collapses to never.
  const unitIncidentMap = new Map<
    string,
    {
      code: string
      incidentCount: number
      problemScore: number
      recentIncidents: (typeof recentIncidents)[number][]
      unresolvedCount: number
    }
  >()

  for (const incident of interpersonalIncidents) {
    const unitId = incident.housingUnitId
    const existing = unitIncidentMap.get(unitId) || {
      code: incident.housingUnit?.code || 'Unbekannt',
      incidentCount: 0,
      problemScore: 0,
      recentIncidents: [],
      unresolvedCount: 0,
    }

    existing.incidentCount++
    existing.problemScore +=
      INCIDENT_SEVERITY_WEIGHTS[incident.severity as keyof typeof INCIDENT_SEVERITY_WEIGHTS] || 1
    existing.recentIncidents.push(incident)
    if (!incident.resolvedAt) {
      existing.unresolvedCount++
    }

    unitIncidentMap.set(unitId, existing)
  }

  // Only flag units with sufficient incidents
  const problemUnits = Array.from(unitIncidentMap.entries())
    .filter(([, data]) => data.incidentCount >= PROBLEM_DETECTION.minIncidentsToFlag)
    .map(([id, data]) => ({
      id,
      code: data.code,
      incidentCount: data.incidentCount,
      problemScore: data.problemScore,
      unresolvedCount: data.unresolvedCount,
      // Show most common incident type
      primaryIssue: getMostCommonIncidentType(data.recentIncidents),
    }))
    .sort((a, b) => b.problemScore - a.problemScore)
    .slice(0, DISPLAY_LIMITS.problemUnits)

  // =============================================================================
  // Cross-pillar queues (transfers, governance)
  // =============================================================================

  const pendingTransfers = pendingTransfersRaw.map((t) => ({
    id: t.id,
    residentCode: t.resident.code,
    residentDisplayName: t.resident.displayName,
    unitCode: t.currentPlacement?.housingUnit.code ?? null,
    daysSinceCreated: daysSinceCeil(t.createdAt, now),
  }))

  const proposalsAwaitingStaff = proposalsRaw.map((p) => ({
    id: p.id,
    title: p.title,
    unitCode: p.housingUnit.code,
    daysWaiting: daysSinceCeil(p.decidedAt ?? p.updatedAt, now),
  }))

  return (
    <ActionDashboard
      role={role}
      residentCount={residentCount}
      housingUnitCount={housingUnitCount}
      occupiedBeds={occupiedBeds}
      totalBeds={totalBeds}
      totalPlacements={totalPlacements}
      overdueCheckIns={overdueCheckIns}
      dueSoonCheckIns={dueSoonCheckIns}
      unplacedResidents={unplacedResidents}
      criticalIncidents={criticalIncidents}
      problemUnits={problemUnits}
      pendingTransfers={pendingTransfers}
      proposalsAwaitingStaff={proposalsAwaitingStaff}
      conflictFreeDays={conflictFreeDays}
      openMaintenanceCount={openMaintenanceCount}
      learningInProgressCount={learningInProgressCount}
      learningRecentCompletions={learningRecentCompletions}
      upcomingEventsCount={upcomingEventsCount}
      activeStaffCount={activeStaffCount}
      neverSignedInStaffCount={neverSignedInStaffCount}
      greeting={buildGreeting(DASHBOARD_LABELS[GREETING_BY_DAY_PART[dayPartAt(now)]], user)}
      todayLabel={formatWeekdayDate(now)}
    />
  )
}

function buildGreeting(greeting: string, user: Awaited<ReturnType<typeof getCurrentUser>>): string {
  if (!user) return greeting

  const raw = user.name?.trim() || user.email?.split('@')[0]?.trim() || ''
  if (!raw) return greeting

  const cleaned = raw.replace(/[_-]+/g, ' ')
  if (/^admin$/i.test(cleaned)) return greeting

  const firstToken = cleaned.split(/\s+/)[0]
  const pretty = firstToken.charAt(0).toUpperCase() + firstToken.slice(1)

  return `${greeting}, ${pretty}`
}

/**
 * Get the most common incident type from a list of incidents
 */
function getMostCommonIncidentType(incidents: { type: string }[]): string {
  const typeCounts = new Map<string, number>()
  for (const i of incidents) {
    typeCounts.set(i.type, (typeCounts.get(i.type) || 0) + 1)
  }

  let maxType = ''
  let maxCount = 0
  typeCounts.forEach((count, type) => {
    if (count > maxCount) {
      maxType = type
      maxCount = count
    }
  })

  return maxType
}
