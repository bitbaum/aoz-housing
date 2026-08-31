/**
 * Tests for calculateAlgorithmAccuracy
 *
 * Covers: score tier assignment, conflict rate per tier, prediction accuracy,
 * satisfaction correlation, and average score comparison.
 */

import { calculateAlgorithmAccuracy } from '../algorithm-accuracy'

// =============================================================================
// MOCKS
// =============================================================================

const mockPlacementFindMany = vi.hoisted(() => vi.fn())
const mockIncidentFindMany = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  prisma: {
    placement: { findMany: (...args: unknown[]) => mockPlacementFindMany(...args) },
    incident: { findMany: (...args: unknown[]) => mockIncidentFindMany(...args) },
  },
}))

// =============================================================================
// HELPERS
// =============================================================================

function makePlacement(overrides: {
  id?: string
  compatibilityScore?: number | null
  endReason?: string
  wasPredictable?: boolean | null
  checkIns?: { overallSatisfaction: number; roommateRelations: number | null }[]
  startDate?: Date
  endDate?: Date | null
}) {
  return {
    id: overrides.id ?? 'p-1',
    compatibilityScore: overrides.compatibilityScore ?? null,
    startDate: overrides.startDate ?? new Date('2026-01-01'),
    endDate: overrides.endDate ?? new Date('2026-03-01'),
    endReason: overrides.endReason ?? 'NATURAL',
    conflictGap: null,
    wasPredictable: overrides.wasPredictable ?? null,
    satisfactionRating: null,
    checkIns: overrides.checkIns ?? [],
  }
}

// =============================================================================
// TESTS
// =============================================================================

describe('calculateAlgorithmAccuracy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPlacementFindMany.mockResolvedValue([])
    mockIncidentFindMany.mockResolvedValue([])
  })

  // ── Empty state ───────────────────────────────────────────────────────────

  test('returns zeroed report when no ended placements exist', async () => {
    const report = await calculateAlgorithmAccuracy()

    expect(report.totalEndedPlacements).toBe(0)
    expect(report.totalWithScores).toBe(0)
    expect(report.avgScoreConflictEnds).toBeNull()
    expect(report.avgScoreSuccessfulEnds).toBeNull()
    expect(report.predictionAccuracy.accuracy).toBeNull()
    // All tiers should have 0 placements
    expect(report.tieredAccuracy.every((t) => t.totalPlacements === 0)).toBe(true)
  })

  test('returns 5 tiers always', async () => {
    const report = await calculateAlgorithmAccuracy()

    expect(report.tieredAccuracy).toHaveLength(5)
    expect(report.tieredAccuracy.map((t) => t.tier)).toEqual([
      'critical',
      'low',
      'medium',
      'good',
      'excellent',
    ])
  })

  // ── Score tier assignment ─────────────────────────────────────────────────

  test('assigns placements to correct score tiers', async () => {
    mockPlacementFindMany.mockResolvedValue([
      makePlacement({ id: 'p1', compatibilityScore: 10 }), // critical (0-19)
      makePlacement({ id: 'p2', compatibilityScore: 25 }), // low (20-39)
      makePlacement({ id: 'p3', compatibilityScore: 50 }), // medium (40-59)
      makePlacement({ id: 'p4', compatibilityScore: 70 }), // good (60-79)
      makePlacement({ id: 'p5', compatibilityScore: 90 }), // excellent (80+)
    ])

    const report = await calculateAlgorithmAccuracy()
    const byTier = Object.fromEntries(report.tieredAccuracy.map((t) => [t.tier, t]))

    expect(byTier.critical.totalPlacements).toBe(1)
    expect(byTier.low.totalPlacements).toBe(1)
    expect(byTier.medium.totalPlacements).toBe(1)
    expect(byTier.good.totalPlacements).toBe(1)
    expect(byTier.excellent.totalPlacements).toBe(1)
  })

  test('placements without a score are excluded from tier analysis', async () => {
    mockPlacementFindMany.mockResolvedValue([
      makePlacement({ id: 'p1', compatibilityScore: null }),
      makePlacement({ id: 'p2', compatibilityScore: 75 }),
    ])

    const report = await calculateAlgorithmAccuracy()

    expect(report.totalEndedPlacements).toBe(2)
    expect(report.totalWithScores).toBe(1)
  })

  // ── Conflict rate ─────────────────────────────────────────────────────────

  test('calculates conflict rate per tier correctly', async () => {
    mockPlacementFindMany.mockResolvedValue([
      makePlacement({ id: 'p1', compatibilityScore: 85, endReason: 'CONFLICT' }),
      makePlacement({ id: 'p2', compatibilityScore: 90, endReason: 'NATURAL' }),
      makePlacement({ id: 'p3', compatibilityScore: 92, endReason: 'NATURAL' }),
      makePlacement({ id: 'p4', compatibilityScore: 88, endReason: 'NATURAL' }),
    ])

    const report = await calculateAlgorithmAccuracy()
    const excellent = report.tieredAccuracy.find((t) => t.tier === 'excellent')!

    expect(excellent.totalPlacements).toBe(4)
    expect(excellent.conflictEnds).toBe(1)
    expect(excellent.conflictRate).toBe(25) // 1/4 = 25%
  })

  test('conflict rate is 0 when no conflicts in tier', async () => {
    mockPlacementFindMany.mockResolvedValue([
      makePlacement({ id: 'p1', compatibilityScore: 85, endReason: 'NATURAL' }),
    ])

    const report = await calculateAlgorithmAccuracy()
    const excellent = report.tieredAccuracy.find((t) => t.tier === 'excellent')!

    expect(excellent.conflictRate).toBe(0)
  })

  // ── Average satisfaction ──────────────────────────────────────────────────

  test('calculates average satisfaction from check-ins across tier', async () => {
    mockPlacementFindMany.mockResolvedValue([
      makePlacement({
        id: 'p1',
        compatibilityScore: 85,
        checkIns: [
          { overallSatisfaction: 5, roommateRelations: 5 },
          { overallSatisfaction: 3, roommateRelations: null },
        ],
      }),
    ])

    const report = await calculateAlgorithmAccuracy()
    const excellent = report.tieredAccuracy.find((t) => t.tier === 'excellent')!

    expect(excellent.avgSatisfaction).toBe(4) // (5+3)/2 = 4.0
  })

  test('avgSatisfaction is null when no check-ins exist in tier', async () => {
    mockPlacementFindMany.mockResolvedValue([
      makePlacement({ id: 'p1', compatibilityScore: 85, checkIns: [] }),
    ])

    const report = await calculateAlgorithmAccuracy()
    const excellent = report.tieredAccuracy.find((t) => t.tier === 'excellent')!

    expect(excellent.avgSatisfaction).toBeNull()
  })

  // ── Average duration ──────────────────────────────────────────────────────

  test('calculates average duration in days', async () => {
    const start = new Date('2026-01-01')
    const end = new Date('2026-01-11') // 10 days

    mockPlacementFindMany.mockResolvedValue([
      makePlacement({ id: 'p1', compatibilityScore: 85, startDate: start, endDate: end }),
    ])

    const report = await calculateAlgorithmAccuracy()
    const excellent = report.tieredAccuracy.find((t) => t.tier === 'excellent')!

    expect(excellent.avgDurationDays).toBe(10)
  })

  // ── Score comparison: conflict vs successful ──────────────────────────────

  test('reports lower avg score for conflict ends than successful ends', async () => {
    mockPlacementFindMany.mockResolvedValue([
      makePlacement({ id: 'p1', compatibilityScore: 30, endReason: 'CONFLICT' }),
      makePlacement({ id: 'p2', compatibilityScore: 90, endReason: 'NATURAL' }),
      makePlacement({ id: 'p3', compatibilityScore: 80, endReason: 'NATURAL' }),
    ])

    const report = await calculateAlgorithmAccuracy()

    expect(report.avgScoreConflictEnds).toBe(30)
    expect(report.avgScoreSuccessfulEnds).toBe(85) // (90+80)/2
  })

  test('avgScoreConflictEnds is null when no conflict ends exist', async () => {
    mockPlacementFindMany.mockResolvedValue([
      makePlacement({ id: 'p1', compatibilityScore: 80, endReason: 'NATURAL' }),
    ])

    const report = await calculateAlgorithmAccuracy()

    expect(report.avgScoreConflictEnds).toBeNull()
    expect(report.avgScoreSuccessfulEnds).toBe(80)
  })

  // ── Prediction accuracy ───────────────────────────────────────────────────

  test('counts predictable, unpredictable, and unmarked incidents', async () => {
    mockIncidentFindMany.mockResolvedValue([
      { predictable: true },
      { predictable: true },
      { predictable: false },
      { predictable: null },
    ])

    const report = await calculateAlgorithmAccuracy()

    expect(report.predictionAccuracy.predictableConflicts).toBe(2)
    expect(report.predictionAccuracy.unpredictableConflicts).toBe(1)
    expect(report.predictionAccuracy.unmarked).toBe(1)
  })

  test('calculates prediction accuracy as % of conflict-end placements that were flagged', async () => {
    mockPlacementFindMany.mockResolvedValue([
      makePlacement({
        id: 'p1',
        compatibilityScore: 30,
        endReason: 'CONFLICT',
        wasPredictable: true,
      }),
      makePlacement({
        id: 'p2',
        compatibilityScore: 25,
        endReason: 'CONFLICT',
        wasPredictable: false,
      }),
      makePlacement({
        id: 'p3',
        compatibilityScore: 20,
        endReason: 'CONFLICT',
        wasPredictable: null,
      }),
    ])

    const report = await calculateAlgorithmAccuracy()

    // 1 of 3 conflict ends was predicted → 33%
    expect(report.predictionAccuracy.accuracy).toBe(33)
  })

  test('prediction accuracy is null when no conflict-end placements with scores', async () => {
    mockPlacementFindMany.mockResolvedValue([
      makePlacement({ id: 'p1', compatibilityScore: 80, endReason: 'NATURAL' }),
    ])

    const report = await calculateAlgorithmAccuracy()

    expect(report.predictionAccuracy.accuracy).toBeNull()
  })

  // ── Satisfaction correlation ──────────────────────────────────────────────

  test('satisfaction correlation has 5 tiers with correct scoreRange', async () => {
    const report = await calculateAlgorithmAccuracy()
    const ranges = Object.fromEntries(
      report.satisfactionCorrelation.map((t) => [t.tier, t.scoreRange]),
    )

    expect(ranges.critical).toBe('0-19')
    expect(ranges.low).toBe('20-39')
    expect(ranges.medium).toBe('40-59')
    expect(ranges.good).toBe('60-79')
    expect(ranges.excellent).toBe('80-100')
  })

  test('avgRoommateRelations only averages non-null values', async () => {
    mockPlacementFindMany.mockResolvedValue([
      makePlacement({
        id: 'p1',
        compatibilityScore: 85,
        checkIns: [
          { overallSatisfaction: 4, roommateRelations: 5 },
          { overallSatisfaction: 3, roommateRelations: null }, // excluded from roommate avg
        ],
      }),
    ])

    const report = await calculateAlgorithmAccuracy()
    const excellent = report.satisfactionCorrelation.find((t) => t.tier === 'excellent')!

    expect(excellent.avgRoommateRelations).toBe(5) // only the non-null value
    expect(excellent.avgSatisfaction).toBe(3.5) // (4+3)/2
    expect(excellent.checkInCount).toBe(2)
  })
})
