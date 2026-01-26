/**
 * Unit-level analytics and historical metrics
 *
 * Provides context about unit performance for matching decisions
 */

import { prisma } from '@/lib/db'

export interface UnitMetrics {
  unitId: string
  unitCode: string

  // Historical performance
  conflictRate: number          // Conflicts per month (last 6 months)
  recentConflicts: number        // Count in last 30 days
  totalConflicts: number         // All-time count

  // Stability metrics
  avgPlacementDuration: number   // Days residents stay
  turnoverRate: number           // % of placements that ended early
  successRate: number            // % of placements that lasted 6+ months

  // Current state
  currentOccupancy: number       // How many residents now
  occupancyRate: number          // % of beds filled

  // Quality indicators
  avgSatisfaction: number | null // From check-ins (1-5)
  incidentFreeMonths: number     // Consecutive months without incidents

  // Classification
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  label: string                  // "Stable", "Improving", "Concerning", etc.
}

/**
 * Calculate comprehensive metrics for a housing unit
 */
export async function calculateUnitMetrics(unitId: string): Promise<UnitMetrics> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

  // Fetch unit with related data
  const unit = await prisma.housingUnit.findUnique({
    where: { id: unitId },
    include: {
      placements: {
        where: {
          startDate: { gte: sixMonthsAgo }
        },
        include: {
          checkIns: {
            select: {
              overallSatisfaction: true
            }
          }
        }
      },
      incidents: {
        where: {
          category: 'INTERPERSONAL',
          date: { gte: sixMonthsAgo }
        }
      },
    },
  })

  if (!unit) {
    throw new Error(`Unit ${unitId} not found`)
  }

  // Calculate conflict rate (per month over last 6 months)
  const monthsSinceOldest = 6
  const conflictRate = unit.incidents.length / monthsSinceOldest

  // Recent conflicts (last 30 days)
  const recentConflicts = unit.incidents.filter(i =>
    new Date(i.date) >= thirtyDaysAgo
  ).length

  // Total conflicts (all incidents)
  const totalConflicts = await prisma.incident.count({
    where: {
      housingUnitId: unitId,
      category: 'INTERPERSONAL'
    }
  })

  // Placement duration analysis
  const endedPlacements = unit.placements.filter(p => p.endDate !== null)
  const avgDuration = endedPlacements.length > 0
    ? endedPlacements.reduce((sum, p) => {
        const duration = (new Date(p.endDate!).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24)
        return sum + duration
      }, 0) / endedPlacements.length
    : 0

  // Success rate (6+ months)
  const successfulPlacements = endedPlacements.filter(p => {
    const duration = (new Date(p.endDate!).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24)
    return duration >= 180 // 6 months
  })
  const successRate = endedPlacements.length > 0
    ? (successfulPlacements.length / endedPlacements.length) * 100
    : 100 // No data = assume good

  // Turnover rate (ended due to conflict)
  const conflictEnds = endedPlacements.filter(p =>
    p.endReason === 'CONFLICT' || p.endReason === 'REQUEST'
  )
  const turnoverRate = endedPlacements.length > 0
    ? (conflictEnds.length / endedPlacements.length) * 100
    : 0

  // Current occupancy
  const activePlacements = await prisma.placement.count({
    where: {
      housingUnitId: unitId,
      status: 'ACTIVE'
    }
  })
  const occupancyRate = (activePlacements / unit.totalBeds) * 100

  // Average satisfaction from check-ins
  const allCheckIns = unit.placements.flatMap(p => p.checkIns)
  const avgSatisfaction = allCheckIns.length > 0
    ? allCheckIns.reduce((sum, c) => sum + c.overallSatisfaction, 0) / allCheckIns.length
    : null

  // Incident-free months
  const monthsToCheck = 12
  let incidentFreeMonths = 0
  for (let i = 0; i < monthsToCheck; i++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

    const incidentsInMonth = await prisma.incident.count({
      where: {
        housingUnitId: unitId,
        category: 'INTERPERSONAL',
        date: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    })

    if (incidentsInMonth === 0) {
      incidentFreeMonths++
    } else {
      break // Stop at first month with incident
    }
  }

  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  if (conflictRate >= 3) {
    riskLevel = 'CRITICAL'
  } else if (conflictRate >= 2 || recentConflicts >= 3) {
    riskLevel = 'HIGH'
  } else if (conflictRate >= 1 || recentConflicts >= 2) {
    riskLevel = 'MEDIUM'
  } else {
    riskLevel = 'LOW'
  }

  // Generate label
  let label: string
  if (incidentFreeMonths >= 6) {
    label = 'Sehr stabil'
  } else if (incidentFreeMonths >= 3) {
    label = 'Stabil'
  } else if (recentConflicts < unit.incidents.filter(i => {
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    return new Date(i.date) >= twoMonthsAgo && new Date(i.date) < thirtyDaysAgo
  }).length) {
    label = 'Verbesserung'
  } else if (recentConflicts > 2) {
    label = 'Kritisch'
  } else if (conflictRate > 1) {
    label = 'Beobachten'
  } else {
    label = 'Normal'
  }

  return {
    unitId,
    unitCode: unit.code,
    conflictRate: Math.round(conflictRate * 10) / 10,
    recentConflicts,
    totalConflicts,
    avgPlacementDuration: Math.round(avgDuration),
    turnoverRate: Math.round(turnoverRate),
    successRate: Math.round(successRate),
    currentOccupancy: activePlacements,
    occupancyRate: Math.round(occupancyRate),
    avgSatisfaction: avgSatisfaction ? Math.round(avgSatisfaction * 10) / 10 : null,
    incidentFreeMonths,
    riskLevel,
    label,
  }
}

/**
 * Calculate metrics for all units (for dashboard)
 */
export async function calculateAllUnitMetrics(): Promise<UnitMetrics[]> {
  const units = await prisma.housingUnit.findMany({
    where: { status: { in: ['AVAILABLE', 'FULL'] } },
    select: { id: true }
  })

  const metrics = await Promise.all(
    units.map(u => calculateUnitMetrics(u.id))
  )

  return metrics
}

/**
 * Get success rate for placements with similar compatibility scores
 */
export async function getSimilarPlacementSuccessRate(
  compatibilityScore: number,
  range: number = 10
): Promise<{
  successRate: number
  totalPlacements: number
  successfulPlacements: number
}> {
  const placements = await prisma.placement.findMany({
    where: {
      compatibilityScore: {
        gte: compatibilityScore - range,
        lte: compatibilityScore + range
      },
      endDate: { not: null }
    }
  })

  if (placements.length === 0) {
    return {
      successRate: 0,
      totalPlacements: 0,
      successfulPlacements: 0
    }
  }

  const successful = placements.filter(p => {
    const duration = (new Date(p.endDate!).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24)
    return duration >= 180 && p.endReason !== 'CONFLICT'
  })

  return {
    successRate: Math.round((successful.length / placements.length) * 100),
    totalPlacements: placements.length,
    successfulPlacements: successful.length
  }
}
