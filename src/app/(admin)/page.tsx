import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { daysSinceCeil, getDateDaysAgo } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }
import { ActionDashboard } from '@/components/dashboard/ActionDashboard'
import { DASHBOARD_LABELS } from '@/lib/constants/labels'
import { dayPartAt, formatWeekdayDate, type DayPart } from '@/lib/utils/local-time'

/** Which greeting belongs to which part of the day. */
const GREETING_BY_DAY_PART: Record<DayPart, 'greetingMorning' | 'greetingDay' | 'greetingEvening'> = {
  morning: 'greetingMorning',
  day: 'greetingDay',
  evening: 'greetingEvening',
}
import { RESIDENT_NAME_SELECT } from '@/lib/utils/resident-name'
import {
  getCheckInInterval,
  VERY_OVERDUE_THRESHOLD_DAYS,
} from '@/lib/config/checkin-intervals'
import {
  PROBLEM_DETECTION,
  INCIDENT_SEVERITY_WEIGHTS,
  DISPLAY_LIMITS,
} from '@/lib/config/thresholds'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const now = new Date()

  // Fetch all data in parallel
  const [
    residents,
    units,
    placements,
    recentIncidents,
    openMaintenanceCount,
  ] = await Promise.all([
    prisma.resident.findMany({
      where: { status: { in: ['ACTIVE', 'PLACED'] } },
      select: { ...RESIDENT_NAME_SELECT, status: true, createdAt: true },
    }),
    prisma.housingUnit.findMany({
      select: { totalBeds: true, status: true },
    }),
    prisma.placement.findMany({
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
    }),
    prisma.incident.findMany({
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
    }),
    prisma.maintenanceRequest.count({
      where: {
        status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'] },
      },
    }),
  ])

  // =============================================================================
  // Calculate Core Stats
  // =============================================================================

  const totalBeds = units.reduce((sum, u) => sum + u.totalBeds, 0)
  const occupiedBeds = placements.length
  const availableUnits = units.filter(u => u.status === 'AVAILABLE').length

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
    .filter(r => r.status === 'ACTIVE')
    .map(r => ({
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
    .filter(i => i.severity === 'CRITICAL' && !i.resolvedAt)
    .map(i => ({
      id: i.id,
      type: i.type,
      unitCode: i.housingUnit?.code || 'Unbekannt',
      unitId: i.housingUnitId,
      daysSinceCreated: daysSinceCeil(i.date, now),
    }))

  // =============================================================================
  // Conflict-free Days (Interpersonal incidents only)
  // =============================================================================

  const interpersonalIncidents = recentIncidents.filter(i => i.category === 'INTERPERSONAL')
  let conflictFreeDays: number = PROBLEM_DETECTION.recentIncidentsDays

  if (interpersonalIncidents.length > 0) {
    const mostRecent = interpersonalIncidents[0] // already sorted by date desc
    conflictFreeDays = daysSinceCeil(mostRecent.date, now)
  }

  // =============================================================================
  // Problem Units - EVIDENCE-BASED (actual incidents, not theoretical compatibility)
  // =============================================================================

  // Group incidents by unit and calculate problem score
  const unitIncidentMap = new Map<string, {
    code: string
    incidentCount: number
    problemScore: number
    recentIncidents: typeof recentIncidents
    unresolvedCount: number
  }>()

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
    existing.problemScore += INCIDENT_SEVERITY_WEIGHTS[incident.severity as keyof typeof INCIDENT_SEVERITY_WEIGHTS] || 1
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
  // Open Maintenance
  // =============================================================================

  return (
    <ActionDashboard
      occupiedBeds={occupiedBeds}
      totalBeds={totalBeds}
      availableUnits={availableUnits}
      totalPlacements={totalPlacements}
      overdueCheckIns={overdueCheckIns}
      dueSoonCheckIns={dueSoonCheckIns}
      unplacedResidents={unplacedResidents}
      criticalIncidents={criticalIncidents}
      problemUnits={problemUnits}
      conflictFreeDays={conflictFreeDays}
      openMaintenanceCount={openMaintenanceCount}
      greeting={DASHBOARD_LABELS[GREETING_BY_DAY_PART[dayPartAt(now)]]}
      todayLabel={formatWeekdayDate(now)}
    />
  )
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
