import { prisma } from '@/lib/db'
import { getDateDaysAgo } from '@/lib/utils'
import { ActionDashboard } from '@/components/dashboard/ActionDashboard'
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
    maintenanceRequests,
  ] = await Promise.all([
    prisma.resident.findMany({
      where: { status: { in: ['ACTIVE', 'PLACED'] } },
    }),
    prisma.housingUnit.findMany({
      include: {
        placements: {
          where: { status: 'ACTIVE' },
          include: { resident: true },
        },
      },
    }),
    prisma.placement.findMany({
      where: { status: 'ACTIVE' },
      include: {
        resident: true,
        housingUnit: true,
        spot: true,
        checkIns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
    // Get incidents from configured window
    prisma.incident.findMany({
      where: {
        date: { gte: getDateDaysAgo(PROBLEM_DETECTION.recentIncidentsDays) },
      },
      include: {
        housingUnit: true,
        subject: true,
        involvedResidents: { include: { resident: true } },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.maintenanceRequest.findMany({
      where: {
        status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'] },
      },
      include: { housingUnit: true },
      orderBy: { createdAt: 'asc' },
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
      ? Math.ceil((now.getTime() - new Date(lastCheckIn.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : Math.ceil((now.getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24))

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
      daysSinceCreated: Math.ceil((now.getTime() - new Date(i.date).getTime()) / (1000 * 60 * 60 * 24)),
    }))

  // =============================================================================
  // Conflict-free Days (Interpersonal incidents only)
  // =============================================================================

  const interpersonalIncidents = recentIncidents.filter(i => i.category === 'INTERPERSONAL')
  let conflictFreeDays = PROBLEM_DETECTION.recentIncidentsDays

  if (interpersonalIncidents.length > 0) {
    const mostRecent = interpersonalIncidents[0] // already sorted by date desc
    conflictFreeDays = Math.ceil((now.getTime() - new Date(mostRecent.date).getTime()) / (1000 * 60 * 60 * 24))
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

  const openMaintenanceCount = maintenanceRequests.length

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
  for (const [type, count] of typeCounts.entries()) {
    if (count > maxCount) {
      maxType = type
      maxCount = count
    }
  }

  return maxType
}
