/**
 * Unit-level analytics and historical metrics
 *
 * Provides context about unit performance for matching decisions.
 *
 * The batch functions (`calculateUnitMetricsBatch`, `getSimilarPlacementSuccessRateBatch`)
 * run a CONSTANT number of queries regardless of how many units/scores are requested.
 * The single-item exports delegate to them, so all callers share one code path.
 */

import { prisma } from '@/lib/db'
import { zurichMonthKey } from '@/lib/utils'

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
 * Minimal unit fields the metrics calculation needs.
 * Callers that already loaded the unit (e.g. the matching page) can pass
 * these directly to avoid re-fetching rows they already hold.
 */
export interface UnitMetricsSource {
  id: string
  code: string
  totalBeds: number
}

/** Success rate for placements with similar compatibility scores */
export interface PlacementSuccessRate {
  successRate: number
  totalPlacements: number
  successfulPlacements: number
}

const MONTHS_TO_CHECK = 12
const DAY_MS = 24 * 60 * 60 * 1000

interface PlacementForMetrics {
  startDate: Date
  endDate: Date | null
  endReason: string | null
  checkIns: { overallSatisfaction: number }[]
}

/**
 * Calculate comprehensive metrics for a set of housing units with a
 * constant number of queries (instead of ~4 sequential queries per unit).
 *
 * Accepts unit ids and/or already-loaded `{ id, code, totalBeds }` objects.
 * Units that don't exist are simply absent from the returned map.
 */
export async function calculateUnitMetricsBatch(
  units: ReadonlyArray<string | UnitMetricsSource>
): Promise<Map<string, UnitMetrics>> {
  const result = new Map<string, UnitMetrics>()
  if (units.length === 0) return result

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS)
  const sixMonthsAgo = new Date(now.getTime() - 180 * DAY_MS)
  // 12-month window (first of month) — superset of the 6-month conflict window,
  // so ONE incident query serves both the conflict stats and the
  // incident-free-months bucketing.
  const monthsWindowStart = new Date(now.getFullYear(), now.getMonth() - MONTHS_TO_CHECK, 1)

  // Resolve unit rows: use already-loaded data where given, fetch the rest in one query
  const preloaded = units.filter((u): u is UnitMetricsSource => typeof u !== 'string')
  const idsToFetch = units.filter((u): u is string => typeof u === 'string')
  const fetched = idsToFetch.length > 0
    ? await prisma.housingUnit.findMany({
        where: { id: { in: idsToFetch } },
        select: { id: true, code: true, totalBeds: true },
      })
    : []
  const unitRows = [...preloaded, ...fetched]
  const unitIds = unitRows.map(u => u.id)

  // Constant number of queries for the whole batch — all independent, run in parallel
  const [placements, interpersonalIncidents, totalConflictGroups, activePlacementGroups] =
    await Promise.all([
      prisma.placement.findMany({
        where: {
          housingUnitId: { in: unitIds },
          startDate: { gte: sixMonthsAgo },
        },
        select: {
          housingUnitId: true,
          startDate: true,
          endDate: true,
          endReason: true,
          checkIns: { select: { overallSatisfaction: true } },
        },
      }),
      prisma.incident.findMany({
        where: {
          housingUnitId: { in: unitIds },
          category: 'INTERPERSONAL',
          date: { gte: monthsWindowStart },
        },
        select: { housingUnitId: true, date: true },
      }),
      prisma.incident.groupBy({
        by: ['housingUnitId'],
        where: { housingUnitId: { in: unitIds }, category: 'INTERPERSONAL' },
        _count: { _all: true },
      }),
      prisma.placement.groupBy({
        by: ['housingUnitId'],
        where: { housingUnitId: { in: unitIds }, status: 'ACTIVE' },
        _count: { _all: true },
      }),
    ])

  // Bucket rows per unit in JS
  const placementsByUnit = new Map<string, PlacementForMetrics[]>()
  for (const p of placements) {
    const list = placementsByUnit.get(p.housingUnitId) ?? []
    list.push(p)
    placementsByUnit.set(p.housingUnitId, list)
  }

  const incidentDatesByUnit = new Map<string, Date[]>()
  for (const i of interpersonalIncidents) {
    const list = incidentDatesByUnit.get(i.housingUnitId) ?? []
    list.push(i.date)
    incidentDatesByUnit.set(i.housingUnitId, list)
  }

  const totalConflictsByUnit = new Map<string, number>(
    totalConflictGroups.map(g => [g.housingUnitId, g._count._all])
  )
  const activePlacementsByUnit = new Map<string, number>(
    activePlacementGroups.map(g => [g.housingUnitId, g._count._all])
  )

  for (const unit of unitRows) {
    result.set(
      unit.id,
      computeUnitMetrics({
        unit,
        placements: placementsByUnit.get(unit.id) ?? [],
        incidentDates: incidentDatesByUnit.get(unit.id) ?? [],
        totalConflicts: totalConflictsByUnit.get(unit.id) ?? 0,
        activePlacements: activePlacementsByUnit.get(unit.id) ?? 0,
        now,
        thirtyDaysAgo,
        sixMonthsAgo,
      })
    )
  }

  return result
}

/**
 * Pure per-unit metric math (no queries). Shared by the batch path.
 */
function computeUnitMetrics({
  unit,
  placements,
  incidentDates,
  totalConflicts,
  activePlacements,
  now,
  thirtyDaysAgo,
  sixMonthsAgo,
}: {
  unit: UnitMetricsSource
  placements: PlacementForMetrics[]
  incidentDates: Date[]           // INTERPERSONAL incidents in the last 12 months
  totalConflicts: number
  activePlacements: number
  now: Date
  thirtyDaysAgo: Date
  sixMonthsAgo: Date
}): UnitMetrics {
  // Conflict window (last 6 months) — derived from the 12-month fetch
  const sixMonthIncidents = incidentDates.filter(d => new Date(d) >= sixMonthsAgo)

  // Calculate conflict rate (per month over last 6 months)
  const monthsSinceOldest = 6
  const conflictRate = sixMonthIncidents.length / monthsSinceOldest

  // Recent conflicts (last 30 days)
  const recentConflicts = sixMonthIncidents.filter(d => new Date(d) >= thirtyDaysAgo).length

  // Placement duration analysis
  const endedPlacements = placements.filter(p => p.endDate !== null)
  const avgDuration = endedPlacements.length > 0
    ? endedPlacements.reduce((sum, p) => {
        const duration = (new Date(p.endDate!).getTime() - new Date(p.startDate).getTime()) / DAY_MS
        return sum + duration
      }, 0) / endedPlacements.length
    : 0

  // Success rate (6+ months)
  const successfulPlacements = endedPlacements.filter(p => {
    const duration = (new Date(p.endDate!).getTime() - new Date(p.startDate).getTime()) / DAY_MS
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
  const occupancyRate = (activePlacements / unit.totalBeds) * 100

  // Average satisfaction from check-ins
  const allCheckIns = placements.flatMap(p => p.checkIns)
  const avgSatisfaction = allCheckIns.length > 0
    ? allCheckIns.reduce((sum, c) => sum + c.overallSatisfaction, 0) / allCheckIns.length
    : null

  // Incident-free months — bucketed in JS in Zurich timezone
  const monthsWithIncidents = new Set(incidentDates.map(d => zurichMonthKey(d)))
  let incidentFreeMonths = 0
  for (let i = 0; i < MONTHS_TO_CHECK; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = zurichMonthKey(monthDate)
    if (monthsWithIncidents.has(key)) break
    incidentFreeMonths++
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
  const twoMonthsAgo = new Date(now.getTime() - 60 * DAY_MS)
  const previousMonthConflicts = sixMonthIncidents.filter(d => {
    const date = new Date(d)
    return date >= twoMonthsAgo && date < thirtyDaysAgo
  }).length

  let label: string
  if (incidentFreeMonths >= 6) {
    label = 'Sehr stabil'
  } else if (incidentFreeMonths >= 3) {
    label = 'Stabil'
  } else if (recentConflicts < previousMonthConflicts) {
    label = 'Verbesserung'
  } else if (recentConflicts > 2) {
    label = 'Kritisch'
  } else if (conflictRate > 1) {
    label = 'Beobachten'
  } else {
    label = 'Normal'
  }

  return {
    unitId: unit.id,
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
 * Calculate comprehensive metrics for a single housing unit.
 * Delegates to the batch implementation.
 */
export async function calculateUnitMetrics(unitId: string): Promise<UnitMetrics> {
  const metrics = (await calculateUnitMetricsBatch([unitId])).get(unitId)

  if (!metrics) {
    throw new Error(`Unit ${unitId} not found`)
  }

  return metrics
}

/**
 * Calculate metrics for all units (for dashboard)
 */
export async function calculateAllUnitMetrics(): Promise<UnitMetrics[]> {
  const units = await prisma.housingUnit.findMany({
    where: { status: { in: ['AVAILABLE', 'FULL'] } },
    select: { id: true, code: true, totalBeds: true },
  })

  const metricsByUnit = await calculateUnitMetricsBatch(units)

  return units.flatMap(u => metricsByUnit.get(u.id) ?? [])
}

/**
 * Get success rates for placements with similar compatibility scores,
 * for many target scores at once with a SINGLE query: ended placements
 * within the min/max score envelope are fetched once (narrow select) and
 * bucketed per requested score in JS.
 */
export async function getSimilarPlacementSuccessRateBatch(
  compatibilityScores: ReadonlyArray<number>,
  range: number = 10
): Promise<Map<number, PlacementSuccessRate>> {
  const result = new Map<number, PlacementSuccessRate>()
  if (compatibilityScores.length === 0) return result

  const uniqueScores = Array.from(new Set(compatibilityScores))

  const placements = await prisma.placement.findMany({
    where: {
      compatibilityScore: {
        gte: Math.min(...uniqueScores) - range,
        lte: Math.max(...uniqueScores) + range,
      },
      endDate: { not: null },
    },
    select: {
      compatibilityScore: true,
      startDate: true,
      endDate: true,
      endReason: true,
    },
  })

  for (const score of uniqueScores) {
    const similar = placements.filter(p =>
      p.compatibilityScore != null &&
      p.compatibilityScore >= score - range &&
      p.compatibilityScore <= score + range
    )

    if (similar.length === 0) {
      result.set(score, { successRate: 0, totalPlacements: 0, successfulPlacements: 0 })
      continue
    }

    const successful = similar.filter(p => {
      const duration = (new Date(p.endDate!).getTime() - new Date(p.startDate).getTime()) / DAY_MS
      return duration >= 180 && p.endReason !== 'CONFLICT'
    })

    result.set(score, {
      successRate: Math.round((successful.length / similar.length) * 100),
      totalPlacements: similar.length,
      successfulPlacements: successful.length,
    })
  }

  return result
}

/**
 * Get success rate for placements with similar compatibility scores.
 * Delegates to the batch implementation.
 */
export async function getSimilarPlacementSuccessRate(
  compatibilityScore: number,
  range: number = 10
): Promise<PlacementSuccessRate> {
  const result = (await getSimilarPlacementSuccessRateBatch([compatibilityScore], range))
    .get(compatibilityScore)

  // Batch always sets an entry for every requested score
  return result ?? { successRate: 0, totalPlacements: 0, successfulPlacements: 0 }
}
