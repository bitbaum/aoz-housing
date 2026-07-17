/**
 * Unit tests for unit-metrics analytics
 *
 * Tests calculateUnitMetrics, calculateUnitMetricsBatch, calculateAllUnitMetrics,
 * getSimilarPlacementSuccessRate and getSimilarPlacementSuccessRateBatch with
 * Prisma mocked.
 *
 * Query plumbing (batched — constant number of queries per batch):
 * - housingUnit.findMany  → unit rows ({ id, code, totalBeds }) for ids not preloaded
 * - placement.findMany    → placements started in the last 6 months (with check-ins)
 * - incident.findMany     → INTERPERSONAL incidents in the last 12 months
 *                           (drives BOTH the 6-month conflict stats and the
 *                           incident-free-months bucketing)
 * - incident.groupBy      → all-time INTERPERSONAL count per unit (totalConflicts)
 * - placement.groupBy     → ACTIVE placement count per unit (occupancy)
 */

import { prisma } from '@/lib/db'
import {
  calculateUnitMetrics,
  calculateUnitMetricsBatch,
  calculateAllUnitMetrics,
  getSimilarPlacementSuccessRate,
  getSimilarPlacementSuccessRateBatch,
} from '../unit-metrics'

// =============================================================================
// MOCKS
// =============================================================================

jest.mock('@/lib/db', () => ({
  prisma: {
    housingUnit: {
      findMany: jest.fn(),
    },
    incident: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    placement: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

// =============================================================================
// FIXED TIME
// =============================================================================

// Pin time to 2025-07-15T12:00:00Z so all date math is deterministic
const FIXED_NOW = new Date('2025-07-15T12:00:00.000Z')

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  jest.setSystemTime(FIXED_NOW)

  // Safe defaults — every query resolves empty
  ;(mockPrisma.housingUnit.findMany as jest.Mock).mockResolvedValue([])
  ;(mockPrisma.placement.findMany as jest.Mock).mockResolvedValue([])
  ;(mockPrisma.incident.findMany as jest.Mock).mockResolvedValue([])
  ;(mockPrisma.incident.groupBy as unknown as jest.Mock).mockResolvedValue([])
  ;(mockPrisma.placement.groupBy as unknown as jest.Mock).mockResolvedValue([])
})

afterEach(() => {
  jest.useRealTimers()
})

// =============================================================================
// TEST DATA HELPERS
// =============================================================================

function makeUnit(overrides: Record<string, unknown> = {}) {
  return {
    id: 'unit-1',
    code: 'WG-001',
    totalBeds: 4,
    placements: [],
    incidents: [],
    ...overrides,
  }
}

function makePlacement(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p-1',
    startDate: new Date('2025-06-01'),
    endDate: null,
    endReason: null,
    checkIns: [],
    ...overrides,
  }
}

function makeIncident(date: string, overrides: Record<string, unknown> = {}) {
  return {
    id: `i-${date}`,
    date: new Date(date),
    category: 'INTERPERSONAL',
    ...overrides,
  }
}

/**
 * Wires the batched query mocks for a single unit: the unit row, its
 * placements (last 6 months) and its incidents (last 12 months).
 * Returns the unit object so tests can override fields.
 */
function setupDefaultMocks(unitOverrides: Record<string, unknown> = {}) {
  const unit = makeUnit(unitOverrides)
  ;(mockPrisma.housingUnit.findMany as jest.Mock).mockResolvedValue([
    { id: unit.id, code: unit.code, totalBeds: unit.totalBeds },
  ])
  ;(mockPrisma.placement.findMany as jest.Mock).mockResolvedValue(
    (unit.placements as Record<string, unknown>[]).map(p => ({
      ...p,
      housingUnitId: unit.id,
    }))
  )
  ;(mockPrisma.incident.findMany as jest.Mock).mockResolvedValue(
    (unit.incidents as { date: Date }[]).map(i => ({
      housingUnitId: unit.id,
      date: i.date,
    }))
  )
  return unit
}

/** Mocks the all-time INTERPERSONAL incident count (totalConflicts) for a unit */
function mockTotalConflicts(count: number, unitId = 'unit-1') {
  ;(mockPrisma.incident.groupBy as unknown as jest.Mock).mockResolvedValue(
    count > 0 ? [{ housingUnitId: unitId, _count: { _all: count } }] : []
  )
}

/** Mocks the ACTIVE placement count (occupancy) for a unit */
function mockActivePlacements(count: number, unitId = 'unit-1') {
  ;(mockPrisma.placement.groupBy as unknown as jest.Mock).mockResolvedValue(
    count > 0 ? [{ housingUnitId: unitId, _count: { _all: count } }] : []
  )
}

// =============================================================================
// calculateUnitMetrics
// =============================================================================

describe('calculateUnitMetrics', () => {
  // ---------------------------------------------------------------------------
  // Unit not found
  // ---------------------------------------------------------------------------

  it('throws when unit is not found', async () => {
    ;(mockPrisma.housingUnit.findMany as jest.Mock).mockResolvedValue([])

    await expect(calculateUnitMetrics('nonexistent')).rejects.toThrow(
      'Unit nonexistent not found'
    )
  })

  // ---------------------------------------------------------------------------
  // Basic return shape — zero-state unit
  // ---------------------------------------------------------------------------

  it('returns correct metrics for an empty unit with no data', async () => {
    setupDefaultMocks()

    const result = await calculateUnitMetrics('unit-1')

    expect(result).toEqual({
      unitId: 'unit-1',
      unitCode: 'WG-001',
      conflictRate: 0,
      recentConflicts: 0,
      totalConflicts: 0,
      avgPlacementDuration: 0,
      turnoverRate: 0,
      successRate: 100, // No ended placements = assume good
      currentOccupancy: 0,
      occupancyRate: 0,
      avgSatisfaction: null,
      incidentFreeMonths: 12, // All 12 months are incident-free (no incidents mocked)
      riskLevel: 'LOW',
      label: 'Sehr stabil', // 12 incident-free months >= 6
    })
  })

  // ---------------------------------------------------------------------------
  // Conflict rate
  // ---------------------------------------------------------------------------

  describe('conflict rate', () => {
    it('calculates conflict rate as incidents / 6', async () => {
      const incidents = [
        makeIncident('2025-05-01'),
        makeIncident('2025-05-15'),
        makeIncident('2025-06-01'),
      ]
      setupDefaultMocks({ incidents })

      const result = await calculateUnitMetrics('unit-1')

      // 3 incidents / 6 months = 0.5
      expect(result.conflictRate).toBe(0.5)
    })

    it('rounds conflict rate to 1 decimal place', async () => {
      // 7 incidents / 6 = 1.1666... -> 1.2
      const incidents = Array.from({ length: 7 }, (_, i) =>
        makeIncident(`2025-05-${String(i + 1).padStart(2, '0')}`)
      )
      setupDefaultMocks({ incidents })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.conflictRate).toBe(1.2)
    })

    it('ignores incidents older than 6 months for the conflict rate', async () => {
      // sixMonthsAgo = 2025-01-16T12:00:00Z (180 days before fixed now)
      const incidents = [
        makeIncident('2025-05-01'), // in window
        makeIncident('2024-12-01'), // older than 6 months — still in the 12-month fetch
      ]
      setupDefaultMocks({ incidents })

      const result = await calculateUnitMetrics('unit-1')

      // 1 incident / 6 months = 0.17 -> 0.2
      expect(result.conflictRate).toBe(0.2)
    })
  })

  // ---------------------------------------------------------------------------
  // Recent conflicts (last 30 days)
  // ---------------------------------------------------------------------------

  describe('recent conflicts', () => {
    it('counts incidents within the last 30 days', async () => {
      const incidents = [
        makeIncident('2025-07-10'), // 5 days ago — recent
        makeIncident('2025-07-01'), // 14 days ago — recent
        makeIncident('2025-06-01'), // 44 days ago — not recent
        makeIncident('2025-04-01'), // far past — not recent
      ]
      setupDefaultMocks({ incidents })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.recentConflicts).toBe(2)
    })

    it('returns 0 when no incidents are recent', async () => {
      const incidents = [
        makeIncident('2025-03-01'),
        makeIncident('2025-02-01'),
      ]
      setupDefaultMocks({ incidents })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.recentConflicts).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // Total conflicts (all-time count via incident.groupBy)
  // ---------------------------------------------------------------------------

  it('returns totalConflicts from the incident groupBy count', async () => {
    setupDefaultMocks()
    mockTotalConflicts(42)

    const result = await calculateUnitMetrics('unit-1')

    expect(result.totalConflicts).toBe(42)
  })

  // ---------------------------------------------------------------------------
  // Placement duration
  // ---------------------------------------------------------------------------

  describe('average placement duration', () => {
    it('calculates average days of ended placements', async () => {
      const placements = [
        makePlacement({
          id: 'p-1',
          startDate: new Date('2025-03-01'),
          endDate: new Date('2025-06-01'), // 92 days
        }),
        makePlacement({
          id: 'p-2',
          startDate: new Date('2025-04-01'),
          endDate: new Date('2025-05-01'), // 30 days
        }),
      ]
      setupDefaultMocks({ placements })

      const result = await calculateUnitMetrics('unit-1')

      // (92 + 30) / 2 = 61
      expect(result.avgPlacementDuration).toBe(61)
    })

    it('returns 0 when no placements have ended', async () => {
      const placements = [
        makePlacement({ id: 'p-1', endDate: null }),
        makePlacement({ id: 'p-2', endDate: null }),
      ]
      setupDefaultMocks({ placements })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.avgPlacementDuration).toBe(0)
    })

    it('rounds average duration to integer', async () => {
      const placements = [
        makePlacement({
          id: 'p-1',
          startDate: new Date('2025-05-01'),
          endDate: new Date('2025-05-10'), // 9 days
        }),
        makePlacement({
          id: 'p-2',
          startDate: new Date('2025-05-01'),
          endDate: new Date('2025-05-15'), // 14 days
        }),
      ]
      setupDefaultMocks({ placements })

      const result = await calculateUnitMetrics('unit-1')

      // (9 + 14) / 2 = 11.5 -> 12
      expect(result.avgPlacementDuration).toBe(12)
    })
  })

  // ---------------------------------------------------------------------------
  // Success rate
  // ---------------------------------------------------------------------------

  describe('success rate', () => {
    it('returns 100 when no placements have ended', async () => {
      setupDefaultMocks({
        placements: [makePlacement({ endDate: null })],
      })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.successRate).toBe(100)
    })

    it('calculates percentage of placements lasting 180+ days', async () => {
      const placements = [
        makePlacement({
          id: 'p-1',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-07-10'), // 190 days — success
        }),
        makePlacement({
          id: 'p-2',
          startDate: new Date('2025-05-01'),
          endDate: new Date('2025-06-01'), // 31 days — not success
        }),
      ]
      setupDefaultMocks({ placements })

      const result = await calculateUnitMetrics('unit-1')

      // 1/2 = 50%
      expect(result.successRate).toBe(50)
    })

    it('returns 0 when all ended placements are under 180 days', async () => {
      const placements = [
        makePlacement({
          id: 'p-1',
          startDate: new Date('2025-05-01'),
          endDate: new Date('2025-06-01'), // 31 days
        }),
      ]
      setupDefaultMocks({ placements })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.successRate).toBe(0)
    })

    it('returns 100 when all ended placements are 180+ days', async () => {
      const placements = [
        makePlacement({
          id: 'p-1',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-07-10'), // 190 days
        }),
        makePlacement({
          id: 'p-2',
          startDate: new Date('2024-12-01'),
          endDate: new Date('2025-07-01'), // 212 days
        }),
      ]
      setupDefaultMocks({ placements })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.successRate).toBe(100)
    })
  })

  // ---------------------------------------------------------------------------
  // Turnover rate
  // ---------------------------------------------------------------------------

  describe('turnover rate', () => {
    it('returns 0 when no placements have ended', async () => {
      setupDefaultMocks({
        placements: [makePlacement({ endDate: null })],
      })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.turnoverRate).toBe(0)
    })

    it('counts CONFLICT and REQUEST endReasons as turnover', async () => {
      const placements = [
        makePlacement({
          id: 'p-1',
          endDate: new Date('2025-06-01'),
          endReason: 'CONFLICT',
        }),
        makePlacement({
          id: 'p-2',
          endDate: new Date('2025-06-15'),
          endReason: 'REQUEST',
        }),
        makePlacement({
          id: 'p-3',
          endDate: new Date('2025-07-01'),
          endReason: 'COMPLETED',
        }),
      ]
      setupDefaultMocks({ placements })

      const result = await calculateUnitMetrics('unit-1')

      // 2 turnover / 3 total = 66.666... -> 67
      expect(result.turnoverRate).toBe(67)
    })

    it('returns 0 when no placements ended due to CONFLICT or REQUEST', async () => {
      const placements = [
        makePlacement({
          id: 'p-1',
          endDate: new Date('2025-06-01'),
          endReason: 'COMPLETED',
        }),
      ]
      setupDefaultMocks({ placements })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.turnoverRate).toBe(0)
    })

    it('returns 100 when all ended placements are turnover', async () => {
      const placements = [
        makePlacement({
          id: 'p-1',
          endDate: new Date('2025-06-01'),
          endReason: 'CONFLICT',
        }),
      ]
      setupDefaultMocks({ placements })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.turnoverRate).toBe(100)
    })
  })

  // ---------------------------------------------------------------------------
  // Occupancy
  // ---------------------------------------------------------------------------

  describe('occupancy', () => {
    it('calculates occupancy rate from active placements and total beds', async () => {
      setupDefaultMocks({ totalBeds: 4 })
      mockActivePlacements(3)

      const result = await calculateUnitMetrics('unit-1')

      expect(result.currentOccupancy).toBe(3)
      expect(result.occupancyRate).toBe(75) // 3/4 * 100
    })

    it('returns 100 when fully occupied', async () => {
      setupDefaultMocks({ totalBeds: 2 })
      mockActivePlacements(2)

      const result = await calculateUnitMetrics('unit-1')

      expect(result.occupancyRate).toBe(100)
    })

    it('returns 0 when empty', async () => {
      setupDefaultMocks({ totalBeds: 4 })
      mockActivePlacements(0)

      const result = await calculateUnitMetrics('unit-1')

      expect(result.currentOccupancy).toBe(0)
      expect(result.occupancyRate).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // Average satisfaction
  // ---------------------------------------------------------------------------

  describe('average satisfaction', () => {
    it('returns null when no check-ins exist', async () => {
      setupDefaultMocks({
        placements: [makePlacement({ checkIns: [] })],
      })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.avgSatisfaction).toBeNull()
    })

    it('averages satisfaction across all placements check-ins', async () => {
      const placements = [
        makePlacement({
          id: 'p-1',
          checkIns: [
            { overallSatisfaction: 4 },
            { overallSatisfaction: 5 },
          ],
        }),
        makePlacement({
          id: 'p-2',
          checkIns: [
            { overallSatisfaction: 3 },
          ],
        }),
      ]
      setupDefaultMocks({ placements })

      const result = await calculateUnitMetrics('unit-1')

      // (4 + 5 + 3) / 3 = 4.0
      expect(result.avgSatisfaction).toBe(4)
    })

    it('rounds satisfaction to 1 decimal place', async () => {
      const placements = [
        makePlacement({
          id: 'p-1',
          checkIns: [
            { overallSatisfaction: 3 },
            { overallSatisfaction: 4 },
            { overallSatisfaction: 5 },
          ],
        }),
      ]
      setupDefaultMocks({ placements })

      const result = await calculateUnitMetrics('unit-1')

      // (3 + 4 + 5) / 3 = 4.0
      expect(result.avgSatisfaction).toBe(4)
    })

    it('rounds non-even satisfaction correctly', async () => {
      const placements = [
        makePlacement({
          id: 'p-1',
          checkIns: [
            { overallSatisfaction: 3 },
            { overallSatisfaction: 3 },
            { overallSatisfaction: 4 },
          ],
        }),
      ]
      setupDefaultMocks({ placements })

      const result = await calculateUnitMetrics('unit-1')

      // (3 + 3 + 4) / 3 = 3.333... -> 3.3
      expect(result.avgSatisfaction).toBe(3.3)
    })
  })

  // ---------------------------------------------------------------------------
  // Incident-free months
  // ---------------------------------------------------------------------------

  describe('incident-free months', () => {
    it('returns 12 when all months are incident-free', async () => {
      setupDefaultMocks()

      const result = await calculateUnitMetrics('unit-1')

      expect(result.incidentFreeMonths).toBe(12)
    })

    it('returns 0 when current month has incidents', async () => {
      setupDefaultMocks({
        incidents: [makeIncident('2025-07-10')], // July 2025: current month has an incident
      })

      const result = await calculateUnitMetrics('unit-1')
      expect(result.incidentFreeMonths).toBe(0)
    })

    it('counts consecutive months backward until an incident is found', async () => {
      setupDefaultMocks({
        incidents: [makeIncident('2025-04-15')], // April: incident, break after counting 3 free
      })
      const result = await calculateUnitMetrics('unit-1')
      expect(result.incidentFreeMonths).toBe(3) // July, June, May
    })

    it('stops counting at the first month with incidents', async () => {
      setupDefaultMocks({
        incidents: [
          makeIncident('2025-06-15'), // June: incident -> only July counted
          makeIncident('2025-05-10'), // (May also has incidents but we already broke)
        ],
      })
      const result = await calculateUnitMetrics('unit-1')
      expect(result.incidentFreeMonths).toBe(1)
    })
  })

  // ---------------------------------------------------------------------------
  // Risk level classification
  // ---------------------------------------------------------------------------

  describe('risk level', () => {
    it('returns CRITICAL when conflictRate >= 3', async () => {
      // 18 incidents / 6 = 3.0
      const incidents = Array.from({ length: 18 }, (_, i) =>
        makeIncident(`2025-05-${String((i % 28) + 1).padStart(2, '0')}`)
      )
      setupDefaultMocks({ incidents })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.riskLevel).toBe('CRITICAL')
    })

    it('returns HIGH when conflictRate >= 2', async () => {
      // 12 incidents / 6 = 2.0
      const incidents = Array.from({ length: 12 }, (_, i) =>
        makeIncident(`2025-05-${String((i % 28) + 1).padStart(2, '0')}`)
      )
      setupDefaultMocks({ incidents })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.riskLevel).toBe('HIGH')
    })

    it('returns HIGH when recentConflicts >= 3 even if conflictRate < 2', async () => {
      // 3 incidents all within last 30 days -> conflictRate = 3/6 = 0.5
      // but recentConflicts = 3
      const incidents = [
        makeIncident('2025-07-10'),
        makeIncident('2025-07-12'),
        makeIncident('2025-07-14'),
      ]
      setupDefaultMocks({ incidents })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.conflictRate).toBe(0.5)
      expect(result.recentConflicts).toBe(3)
      expect(result.riskLevel).toBe('HIGH')
    })

    it('returns MEDIUM when conflictRate >= 1', async () => {
      // 6 incidents / 6 = 1.0
      const incidents = Array.from({ length: 6 }, (_, i) =>
        makeIncident(`2025-05-${String(i + 1).padStart(2, '0')}`)
      )
      setupDefaultMocks({ incidents })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.riskLevel).toBe('MEDIUM')
    })

    it('returns MEDIUM when recentConflicts >= 2 even if conflictRate < 1', async () => {
      // 2 incidents in last 30 days -> conflictRate = 2/6 = 0.33, recentConflicts = 2
      const incidents = [
        makeIncident('2025-07-10'),
        makeIncident('2025-07-12'),
      ]
      setupDefaultMocks({ incidents })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.conflictRate).toBe(0.3)
      expect(result.recentConflicts).toBe(2)
      expect(result.riskLevel).toBe('MEDIUM')
    })

    it('returns LOW when conflictRate < 1 and recentConflicts < 2', async () => {
      // 1 old incident -> conflictRate = 1/6 = 0.17, recentConflicts = 0
      const incidents = [makeIncident('2025-04-01')]
      setupDefaultMocks({ incidents })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.conflictRate).toBe(0.2)
      expect(result.recentConflicts).toBe(0)
      expect(result.riskLevel).toBe('LOW')
    })
  })

  // ---------------------------------------------------------------------------
  // Label classification
  // ---------------------------------------------------------------------------

  describe('label', () => {
    it('returns "Sehr stabil" when incidentFreeMonths >= 6', async () => {
      setupDefaultMocks()

      const result = await calculateUnitMetrics('unit-1')

      expect(result.incidentFreeMonths).toBeGreaterThanOrEqual(6)
      expect(result.label).toBe('Sehr stabil')
    })

    it('returns "Stabil" when incidentFreeMonths is 3-5', async () => {
      setupDefaultMocks({
        incidents: [makeIncident('2025-04-15')], // April incident -> 3 free months (Jul, Jun, May)
      })
      mockTotalConflicts(5)

      const result = await calculateUnitMetrics('unit-1')

      expect(result.incidentFreeMonths).toBe(3)
      expect(result.label).toBe('Stabil')
    })

    it('returns "Verbesserung" when recent conflicts < previous month conflicts', async () => {
      // Fixed now = 2025-07-15T12:00:00Z
      // thirtyDaysAgo = 2025-06-15T12:00:00Z
      // twoMonthsAgo = 2025-05-16T12:00:00Z
      //
      // "Previous month" window: >= twoMonthsAgo AND < thirtyDaysAgo
      // "Recent" window: >= thirtyDaysAgo
      //
      // 1 incident in last 30 days, 2 incidents in 30-60 day window
      // -> recentConflicts=1 < previousMonthConflicts=2 -> "Verbesserung"
      // (July incident also makes the current month non-incident-free)
      const incidents = [
        makeIncident('2025-07-10'),    // recent (after June 15)
        makeIncident('2025-06-01'),    // 30-60 day window (before June 15, after May 16)
        makeIncident('2025-05-20'),    // 30-60 day window (before June 15, after May 16)
      ]
      setupDefaultMocks({ incidents })
      mockTotalConflicts(5)

      const result = await calculateUnitMetrics('unit-1')

      expect(result.incidentFreeMonths).toBeLessThan(3)
      expect(result.recentConflicts).toBe(1)
      expect(result.label).toBe('Verbesserung')
    })

    it('returns "Kritisch" when recentConflicts > 2', async () => {
      // Fixed now = 2025-07-15T12:00:00Z
      // thirtyDaysAgo = 2025-06-15T12:00:00Z
      //
      // 3 incidents in last 30 days, 3 in previous window (so not "Verbesserung")
      // recentConflicts=3 > 2 -> "Kritisch"
      const incidents = [
        makeIncident('2025-07-10'),  // recent
        makeIncident('2025-07-11'),  // recent
        makeIncident('2025-07-12'),  // recent
        makeIncident('2025-06-01'),  // 30-60 day window (before June 15)
        makeIncident('2025-05-20'),  // 30-60 day window
        makeIncident('2025-05-25'),  // 30-60 day window
      ]
      setupDefaultMocks({ incidents })
      mockTotalConflicts(10)

      const result = await calculateUnitMetrics('unit-1')

      expect(result.recentConflicts).toBe(3)
      expect(result.label).toBe('Kritisch')
    })

    it('returns "Beobachten" when conflictRate > 1 but recentConflicts <= 2', async () => {
      // 7 incidents total in 6 months -> conflictRate = 1.2
      // Only 1 within last 30 days, 1 in 30-60 day window (not "Verbesserung")
      // July incident -> incidentFreeMonths = 0
      const incidents = [
        makeIncident('2025-07-01'),  // recent
        makeIncident('2025-06-01'),  // 30-60 day window
        makeIncident('2025-05-01'),
        makeIncident('2025-04-01'),
        makeIncident('2025-03-01'),
        makeIncident('2025-02-15'),
        makeIncident('2025-02-10'),
      ]
      setupDefaultMocks({ incidents })
      mockTotalConflicts(20)

      const result = await calculateUnitMetrics('unit-1')

      expect(result.incidentFreeMonths).toBe(0)
      expect(result.conflictRate).toBeGreaterThan(1)
      expect(result.recentConflicts).toBeLessThanOrEqual(2)
      expect(result.label).toBe('Beobachten')
    })

    it('returns "Normal" as fallback', async () => {
      // 1 recent incident -> conflictRate = 0.2, recentConflicts = 1
      // Current month (July) has the incident -> incidentFreeMonths = 0
      // recent(1) is not < previous window(0), recent <= 2, conflictRate <= 1 -> "Normal"
      const incidents = [makeIncident('2025-07-10')]
      setupDefaultMocks({ incidents })
      mockTotalConflicts(1)

      const result = await calculateUnitMetrics('unit-1')

      expect(result.incidentFreeMonths).toBe(0)
      expect(result.conflictRate).toBeLessThanOrEqual(1)
      expect(result.recentConflicts).toBeLessThanOrEqual(2)
      expect(result.label).toBe('Normal')
    })
  })

  // ---------------------------------------------------------------------------
  // Rounding
  // ---------------------------------------------------------------------------

  describe('rounding', () => {
    it('rounds occupancyRate to integer', async () => {
      setupDefaultMocks({ totalBeds: 3 })
      mockActivePlacements(1)

      const result = await calculateUnitMetrics('unit-1')

      // 1/3 * 100 = 33.33... -> 33
      expect(result.occupancyRate).toBe(33)
    })

    it('rounds turnoverRate to integer', async () => {
      const placements = [
        makePlacement({ id: 'p-1', endDate: new Date('2025-06-01'), endReason: 'CONFLICT' }),
        makePlacement({ id: 'p-2', endDate: new Date('2025-06-15'), endReason: 'COMPLETED' }),
        makePlacement({ id: 'p-3', endDate: new Date('2025-07-01'), endReason: 'COMPLETED' }),
      ]
      setupDefaultMocks({ placements })

      const result = await calculateUnitMetrics('unit-1')

      // 1/3 = 33.33... -> 33
      expect(result.turnoverRate).toBe(33)
    })
  })

  // ---------------------------------------------------------------------------
  // Integration: complex scenario
  // ---------------------------------------------------------------------------

  it('handles a unit with mixed data correctly', async () => {
    const placements = [
      makePlacement({
        id: 'p-1',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-07-01'), // 181 days — success
        endReason: 'COMPLETED',
        checkIns: [{ overallSatisfaction: 4 }, { overallSatisfaction: 5 }],
      }),
      makePlacement({
        id: 'p-2',
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-06-01'), // 31 days — not success
        endReason: 'CONFLICT',
        checkIns: [{ overallSatisfaction: 2 }],
      }),
      makePlacement({
        id: 'p-3',
        endDate: null, // active
        checkIns: [{ overallSatisfaction: 3 }],
      }),
    ]
    const incidents = [
      makeIncident('2025-07-10'), // recent (July -> incidentFreeMonths = 0)
      makeIncident('2025-06-01'), // not recent
    ]

    setupDefaultMocks({ placements, incidents, totalBeds: 3 })
    mockTotalConflicts(8)
    mockActivePlacements(1)

    const result = await calculateUnitMetrics('unit-1')

    expect(result.conflictRate).toBe(0.3)          // 2/6 = 0.333 -> 0.3
    expect(result.recentConflicts).toBe(1)
    expect(result.totalConflicts).toBe(8)
    expect(result.avgPlacementDuration).toBe(106)   // (181+31)/2 = 106
    expect(result.successRate).toBe(50)             // 1/2 = 50%
    expect(result.turnoverRate).toBe(50)            // 1/2 = 50%
    expect(result.currentOccupancy).toBe(1)
    expect(result.occupancyRate).toBe(33)           // 1/3 = 33.33 -> 33
    expect(result.avgSatisfaction).toBe(3.5)        // (4+5+2+3)/4 = 3.5
    expect(result.incidentFreeMonths).toBe(0)
    expect(result.riskLevel).toBe('LOW')
    expect(result.label).toBe('Normal')
  })
})

// =============================================================================
// calculateUnitMetricsBatch
// =============================================================================

describe('calculateUnitMetricsBatch', () => {
  it('returns an empty map without querying when given no units', async () => {
    const result = await calculateUnitMetricsBatch([])

    expect(result.size).toBe(0)
    expect(mockPrisma.housingUnit.findMany).not.toHaveBeenCalled()
    expect(mockPrisma.placement.findMany).not.toHaveBeenCalled()
    expect(mockPrisma.incident.findMany).not.toHaveBeenCalled()
  })

  it('does not re-fetch units passed as already-loaded objects', async () => {
    const result = await calculateUnitMetricsBatch([
      { id: 'unit-1', code: 'WG-001', totalBeds: 4 },
      { id: 'unit-2', code: 'WG-002', totalBeds: 2 },
    ])

    expect(mockPrisma.housingUnit.findMany).not.toHaveBeenCalled()
    expect(result.size).toBe(2)
    expect(result.get('unit-1')?.unitCode).toBe('WG-001')
    expect(result.get('unit-2')?.unitCode).toBe('WG-002')
  })

  it('fetches unit rows for ids in a single query', async () => {
    ;(mockPrisma.housingUnit.findMany as jest.Mock).mockResolvedValue([
      { id: 'unit-1', code: 'WG-001', totalBeds: 4 },
      { id: 'unit-2', code: 'WG-002', totalBeds: 2 },
    ])

    const result = await calculateUnitMetricsBatch(['unit-1', 'unit-2'])

    expect(mockPrisma.housingUnit.findMany).toHaveBeenCalledTimes(1)
    expect(mockPrisma.housingUnit.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['unit-1', 'unit-2'] } },
      select: { id: true, code: true, totalBeds: true },
    })
    expect(result.size).toBe(2)
  })

  it('runs a constant number of data queries regardless of unit count', async () => {
    await calculateUnitMetricsBatch([
      { id: 'unit-1', code: 'WG-001', totalBeds: 4 },
      { id: 'unit-2', code: 'WG-002', totalBeds: 2 },
      { id: 'unit-3', code: 'WG-003', totalBeds: 6 },
    ])

    expect(mockPrisma.placement.findMany).toHaveBeenCalledTimes(1)
    expect(mockPrisma.incident.findMany).toHaveBeenCalledTimes(1)
    expect(mockPrisma.incident.groupBy).toHaveBeenCalledTimes(1)
    expect(mockPrisma.placement.groupBy).toHaveBeenCalledTimes(1)
  })

  it('buckets placements and incidents per unit', async () => {
    ;(mockPrisma.placement.findMany as jest.Mock).mockResolvedValue([
      {
        housingUnitId: 'unit-1',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-06-01'), // 92 days -> unit-1 avg
        endReason: 'COMPLETED',
        checkIns: [{ overallSatisfaction: 4 }],
      },
      {
        housingUnitId: 'unit-2',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-05-01'), // 30 days -> unit-2 avg
        endReason: 'CONFLICT',
        checkIns: [{ overallSatisfaction: 2 }],
      },
    ])
    ;(mockPrisma.incident.findMany as jest.Mock).mockResolvedValue([
      { housingUnitId: 'unit-2', date: new Date('2025-07-10') }, // recent, unit-2 only
    ])
    ;(mockPrisma.incident.groupBy as unknown as jest.Mock).mockResolvedValue([
      { housingUnitId: 'unit-2', _count: { _all: 3 } },
    ])
    ;(mockPrisma.placement.groupBy as unknown as jest.Mock).mockResolvedValue([
      { housingUnitId: 'unit-1', _count: { _all: 2 } },
    ])

    const result = await calculateUnitMetricsBatch([
      { id: 'unit-1', code: 'WG-001', totalBeds: 4 },
      { id: 'unit-2', code: 'WG-002', totalBeds: 2 },
    ])

    const unit1 = result.get('unit-1')!
    expect(unit1.avgPlacementDuration).toBe(92)
    expect(unit1.avgSatisfaction).toBe(4)
    expect(unit1.recentConflicts).toBe(0)
    expect(unit1.totalConflicts).toBe(0)
    expect(unit1.currentOccupancy).toBe(2)
    expect(unit1.occupancyRate).toBe(50)
    expect(unit1.incidentFreeMonths).toBe(12)

    const unit2 = result.get('unit-2')!
    expect(unit2.avgPlacementDuration).toBe(30)
    expect(unit2.avgSatisfaction).toBe(2)
    expect(unit2.recentConflicts).toBe(1)
    expect(unit2.totalConflicts).toBe(3)
    expect(unit2.currentOccupancy).toBe(0)
    expect(unit2.turnoverRate).toBe(100)
    expect(unit2.incidentFreeMonths).toBe(0)
  })

  it('omits units that do not exist from the result', async () => {
    ;(mockPrisma.housingUnit.findMany as jest.Mock).mockResolvedValue([
      { id: 'unit-1', code: 'WG-001', totalBeds: 4 },
    ])

    const result = await calculateUnitMetricsBatch(['unit-1', 'ghost-unit'])

    expect(result.has('unit-1')).toBe(true)
    expect(result.has('ghost-unit')).toBe(false)
  })
})

// =============================================================================
// calculateAllUnitMetrics
// =============================================================================

describe('calculateAllUnitMetrics', () => {
  it('returns empty array when no units match', async () => {
    ;(mockPrisma.housingUnit.findMany as jest.Mock).mockResolvedValue([])

    const result = await calculateAllUnitMetrics()

    expect(result).toEqual([])
  })

  it('calculates metrics for each unit with AVAILABLE or FULL status', async () => {
    ;(mockPrisma.housingUnit.findMany as jest.Mock).mockResolvedValue([
      { id: 'unit-a', code: 'WG-A', totalBeds: 4 },
      { id: 'unit-b', code: 'WG-B', totalBeds: 4 },
    ])

    const result = await calculateAllUnitMetrics()

    expect(result).toHaveLength(2)
    expect(result[0].unitId).toBe('unit-a')
    expect(result[1].unitId).toBe('unit-b')
    // Units are passed to the batch as already-loaded rows — one query total
    expect(mockPrisma.housingUnit.findMany).toHaveBeenCalledTimes(1)
  })

  it('queries units with status AVAILABLE or FULL', async () => {
    ;(mockPrisma.housingUnit.findMany as jest.Mock).mockResolvedValue([])

    await calculateAllUnitMetrics()

    expect(mockPrisma.housingUnit.findMany).toHaveBeenCalledWith({
      where: { status: { in: ['AVAILABLE', 'FULL'] } },
      select: { id: true, code: true, totalBeds: true },
    })
  })
})

// =============================================================================
// getSimilarPlacementSuccessRate
// =============================================================================

const SUCCESS_RATE_SELECT = {
  compatibilityScore: true,
  startDate: true,
  endDate: true,
  endReason: true,
}

describe('getSimilarPlacementSuccessRate', () => {
  it('returns zeros when no placements found', async () => {
    ;(mockPrisma.placement.findMany as jest.Mock).mockResolvedValue([])

    const result = await getSimilarPlacementSuccessRate(75)

    expect(result).toEqual({
      successRate: 0,
      totalPlacements: 0,
      successfulPlacements: 0,
    })
  })

  it('queries placements within score +/- range with a narrow select', async () => {
    ;(mockPrisma.placement.findMany as jest.Mock).mockResolvedValue([])

    await getSimilarPlacementSuccessRate(75, 15)

    expect(mockPrisma.placement.findMany).toHaveBeenCalledWith({
      where: {
        compatibilityScore: {
          gte: 60,  // 75 - 15
          lte: 90,  // 75 + 15
        },
        endDate: { not: null },
      },
      select: SUCCESS_RATE_SELECT,
    })
  })

  it('uses default range of 10', async () => {
    ;(mockPrisma.placement.findMany as jest.Mock).mockResolvedValue([])

    await getSimilarPlacementSuccessRate(80)

    expect(mockPrisma.placement.findMany).toHaveBeenCalledWith({
      where: {
        compatibilityScore: {
          gte: 70,  // 80 - 10
          lte: 90,  // 80 + 10
        },
        endDate: { not: null },
      },
      select: SUCCESS_RATE_SELECT,
    })
  })

  it('counts successful placements (180+ days and endReason !== CONFLICT)', async () => {
    const placements = [
      {
        compatibilityScore: 75,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-07-10'), // 190 days
        endReason: 'COMPLETED',
      },
      {
        compatibilityScore: 72,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-07-10'), // 190 days
        endReason: 'CONFLICT', // not successful (endReason is CONFLICT)
      },
      {
        compatibilityScore: 80,
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-06-01'), // 31 days — too short
        endReason: 'COMPLETED',
      },
    ]
    ;(mockPrisma.placement.findMany as jest.Mock).mockResolvedValue(placements)

    const result = await getSimilarPlacementSuccessRate(75)

    expect(result).toEqual({
      successRate: 33,           // 1/3 = 33.33 -> 33
      totalPlacements: 3,
      successfulPlacements: 1,
    })
  })

  it('returns 100% when all placements are successful', async () => {
    const placements = [
      {
        compatibilityScore: 75,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-07-10'), // 190 days
        endReason: 'COMPLETED',
      },
      {
        compatibilityScore: 78,
        startDate: new Date('2024-12-01'),
        endDate: new Date('2025-07-01'), // 212 days
        endReason: 'REQUEST', // not CONFLICT, so still successful
      },
    ]
    ;(mockPrisma.placement.findMany as jest.Mock).mockResolvedValue(placements)

    const result = await getSimilarPlacementSuccessRate(75)

    expect(result).toEqual({
      successRate: 100,
      totalPlacements: 2,
      successfulPlacements: 2,
    })
  })

  it('returns 0% when no placements meet success criteria', async () => {
    const placements = [
      {
        compatibilityScore: 70,
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-06-01'), // 31 days — too short
        endReason: 'COMPLETED',
      },
      {
        compatibilityScore: 75,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-07-10'), // 190 days but CONFLICT
        endReason: 'CONFLICT',
      },
    ]
    ;(mockPrisma.placement.findMany as jest.Mock).mockResolvedValue(placements)

    const result = await getSimilarPlacementSuccessRate(75)

    expect(result).toEqual({
      successRate: 0,
      totalPlacements: 2,
      successfulPlacements: 0,
    })
  })

  it('rounds success rate to integer', async () => {
    const placements = [
      {
        compatibilityScore: 75,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-07-10'),
        endReason: 'COMPLETED',
      },
      {
        compatibilityScore: 75,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-07-10'),
        endReason: 'COMPLETED',
      },
      {
        compatibilityScore: 75,
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-06-01'),
        endReason: 'COMPLETED',
      },
    ]
    ;(mockPrisma.placement.findMany as jest.Mock).mockResolvedValue(placements)

    const result = await getSimilarPlacementSuccessRate(75)

    // 2/3 = 66.66... -> 67
    expect(result.successRate).toBe(67)
  })
})

// =============================================================================
// getSimilarPlacementSuccessRateBatch
// =============================================================================

describe('getSimilarPlacementSuccessRateBatch', () => {
  it('returns an empty map without querying when given no scores', async () => {
    const result = await getSimilarPlacementSuccessRateBatch([])

    expect(result.size).toBe(0)
    expect(mockPrisma.placement.findMany).not.toHaveBeenCalled()
  })

  it('fetches the min/max score envelope in a single query', async () => {
    ;(mockPrisma.placement.findMany as jest.Mock).mockResolvedValue([])

    await getSimilarPlacementSuccessRateBatch([40, 90, 65], 10)

    expect(mockPrisma.placement.findMany).toHaveBeenCalledTimes(1)
    expect(mockPrisma.placement.findMany).toHaveBeenCalledWith({
      where: {
        compatibilityScore: {
          gte: 30,   // min(40, 90, 65) - 10
          lte: 100,  // max(40, 90, 65) + 10
        },
        endDate: { not: null },
      },
      select: SUCCESS_RATE_SELECT,
    })
  })

  it('buckets placements per requested score', async () => {
    const placements = [
      {
        compatibilityScore: 45, // only in the 40-bucket (35-55)
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-07-10'), // 190 days — success
        endReason: 'COMPLETED',
      },
      {
        compatibilityScore: 85, // only in the 90-bucket (80-100)
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-06-01'), // 31 days — not success
        endReason: 'CONFLICT',
      },
    ]
    ;(mockPrisma.placement.findMany as jest.Mock).mockResolvedValue(placements)

    const result = await getSimilarPlacementSuccessRateBatch([40, 90], 10)

    expect(result.get(40)).toEqual({
      successRate: 100,
      totalPlacements: 1,
      successfulPlacements: 1,
    })
    expect(result.get(90)).toEqual({
      successRate: 0,
      totalPlacements: 1,
      successfulPlacements: 0,
    })
  })

  it('returns zeros for scores with no similar placements', async () => {
    ;(mockPrisma.placement.findMany as jest.Mock).mockResolvedValue([
      {
        compatibilityScore: 95,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-07-10'),
        endReason: 'COMPLETED',
      },
    ])

    const result = await getSimilarPlacementSuccessRateBatch([20, 95], 10)

    expect(result.get(20)).toEqual({
      successRate: 0,
      totalPlacements: 0,
      successfulPlacements: 0,
    })
    expect(result.get(95)?.totalPlacements).toBe(1)
  })
})
