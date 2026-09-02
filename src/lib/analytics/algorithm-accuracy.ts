/**
 * Algorithm Accuracy Tracking
 *
 * Compares compatibility predictions with actual outcomes
 * to measure and improve the matching algorithm.
 *
 * Answers: "Does higher compatibility actually lead to better outcomes?"
 */

import { eq, ne } from 'drizzle-orm'
import { db, incident, placement } from '@/lib/db'
import { SCORE_THRESHOLDS } from '@/lib/config/thresholds'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TierAccuracy {
  tier: string
  label: string
  totalPlacements: number
  conflictEnds: number
  conflictRate: number // 0-100%
  avgSatisfaction: number | null // 1-5
  avgDurationDays: number | null
}

export interface PredictionAccuracy {
  predictableConflicts: number // incidents marked predictable=true
  unpredictableConflicts: number // incidents marked predictable=false
  unmarked: number // incidents where predictable is null
  accuracy: number | null // % of ended-with-conflict that were predicted
}

export interface SatisfactionCorrelation {
  tier: string
  label: string
  scoreRange: string
  avgSatisfaction: number | null
  avgRoommateRelations: number | null
  placementCount: number
  checkInCount: number
}

export interface AlgorithmAccuracyReport {
  totalEndedPlacements: number
  totalWithScores: number
  tieredAccuracy: TierAccuracy[]
  predictionAccuracy: PredictionAccuracy
  satisfactionCorrelation: SatisfactionCorrelation[]
  avgScoreConflictEnds: number | null
  avgScoreSuccessfulEnds: number | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Score Tiers
// ─────────────────────────────────────────────────────────────────────────────

const TIERS = [
  { tier: 'critical', label: 'Kritisch', min: 0, max: SCORE_THRESHOLDS.low },
  { tier: 'low', label: 'Niedrig', min: SCORE_THRESHOLDS.low, max: SCORE_THRESHOLDS.moderate },
  { tier: 'medium', label: 'Mittel', min: SCORE_THRESHOLDS.moderate, max: SCORE_THRESHOLDS.good },
  { tier: 'good', label: 'Gut', min: SCORE_THRESHOLDS.good, max: SCORE_THRESHOLDS.excellent },
  { tier: 'excellent', label: 'Sehr gut', min: SCORE_THRESHOLDS.excellent, max: 101 },
]

// ─────────────────────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate comprehensive algorithm accuracy report.
 *
 * Queries all ended placements with compatibility scores and
 * correlates scores with actual outcomes (conflict rate, satisfaction, duration).
 */
export async function calculateAlgorithmAccuracy(): Promise<AlgorithmAccuracyReport> {
  // Fetch all ended placements with their scores and check-ins
  const endedPlacements = await db.query.placement.findMany({
    where: ne(placement.status, 'ACTIVE'),
    columns: {
      id: true,
      compatibilityScore: true,
      startDate: true,
      endDate: true,
      endReason: true,
      conflictGap: true,
      wasPredictable: true,
      satisfactionRating: true,
    },
    with: {
      checkIns: {
        columns: {
          overallSatisfaction: true,
          roommateRelations: true,
        },
      },
    },
  })

  const totalEnded = endedPlacements.length
  const withScores = endedPlacements.filter((p) => p.compatibilityScore !== null)

  // ── Tiered Accuracy ──────────────────────────────────────────────────

  const tieredAccuracy: TierAccuracy[] = TIERS.map(({ tier, label, min, max }) => {
    const inTier = withScores.filter(
      (p) => p.compatibilityScore! >= min && p.compatibilityScore! < max,
    )
    const conflictEnds = inTier.filter((p) => p.endReason === 'CONFLICT')

    // Average satisfaction from check-ins
    const allCheckIns = inTier.flatMap((p) => p.checkIns)
    const avgSat =
      allCheckIns.length > 0
        ? allCheckIns.reduce((s, c) => s + c.overallSatisfaction, 0) / allCheckIns.length
        : null

    // Average placement duration
    const durations = inTier
      .filter((p) => p.endDate)
      .map(
        (p) =>
          (new Date(p.endDate!).getTime() - new Date(p.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    const avgDuration =
      durations.length > 0 ? durations.reduce((s, d) => s + d, 0) / durations.length : null

    return {
      tier,
      label,
      totalPlacements: inTier.length,
      conflictEnds: conflictEnds.length,
      conflictRate: inTier.length > 0 ? Math.round((conflictEnds.length / inTier.length) * 100) : 0,
      avgSatisfaction: avgSat ? Math.round(avgSat * 10) / 10 : null,
      avgDurationDays: avgDuration ? Math.round(avgDuration) : null,
    }
  })

  // ── Prediction Accuracy ──────────────────────────────────────────────

  const conflictIncidents = await db.query.incident.findMany({
    where: eq(incident.category, 'INTERPERSONAL'),
    columns: { predictable: true },
  })

  const predictable = conflictIncidents.filter((i) => i.predictable === true).length
  const unpredictable = conflictIncidents.filter((i) => i.predictable === false).length
  const unmarked = conflictIncidents.filter((i) => i.predictable === null).length

  const conflictEndPlacements = withScores.filter((p) => p.endReason === 'CONFLICT')
  const predictedConflictEnds = conflictEndPlacements.filter((p) => p.wasPredictable === true)

  const predictionAccuracy: PredictionAccuracy = {
    predictableConflicts: predictable,
    unpredictableConflicts: unpredictable,
    unmarked,
    accuracy:
      conflictEndPlacements.length > 0
        ? Math.round((predictedConflictEnds.length / conflictEndPlacements.length) * 100)
        : null,
  }

  // ── Score comparison: conflict vs successful ends ────────────────────

  const successfulEnds = withScores.filter((p) => p.endReason !== 'CONFLICT')
  const avgConflict =
    conflictEndPlacements.length > 0
      ? Math.round(
          conflictEndPlacements.reduce((s, p) => s + p.compatibilityScore!, 0) /
            conflictEndPlacements.length,
        )
      : null
  const avgSuccessful =
    successfulEnds.length > 0
      ? Math.round(
          successfulEnds.reduce((s, p) => s + p.compatibilityScore!, 0) / successfulEnds.length,
        )
      : null

  // ── Satisfaction Correlation ─────────────────────────────────────────

  const satisfactionCorrelation: SatisfactionCorrelation[] = TIERS.map(
    ({ tier, label, min, max }) => {
      const inTier = withScores.filter(
        (p) => p.compatibilityScore! >= min && p.compatibilityScore! < max,
      )
      const allCheckIns = inTier.flatMap((p) => p.checkIns)
      const withRoommate = allCheckIns.filter((c) => c.roommateRelations !== null)

      return {
        tier,
        label,
        scoreRange: `${min}-${max - 1}`,
        avgSatisfaction:
          allCheckIns.length > 0
            ? Math.round(
                (allCheckIns.reduce((s, c) => s + c.overallSatisfaction, 0) / allCheckIns.length) *
                  10,
              ) / 10
            : null,
        avgRoommateRelations:
          withRoommate.length > 0
            ? Math.round(
                (withRoommate.reduce((s, c) => s + c.roommateRelations!, 0) / withRoommate.length) *
                  10,
              ) / 10
            : null,
        placementCount: inTier.length,
        checkInCount: allCheckIns.length,
      }
    },
  )

  return {
    totalEndedPlacements: totalEnded,
    totalWithScores: withScores.length,
    tieredAccuracy,
    predictionAccuracy,
    satisfactionCorrelation,
    avgScoreConflictEnds: avgConflict,
    avgScoreSuccessfulEnds: avgSuccessful,
  }
}
