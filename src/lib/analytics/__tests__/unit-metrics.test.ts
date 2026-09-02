/**
 * Unit tests for unit-metrics analytics
 *
 * Tests calculateUnitMetrics, calculateAllUnitMetrics, and
 * getSimilarPlacementSuccessRate with the db module mocked.
 */

import { and, gte, inArray, isNotNull, lte } from 'drizzle-orm'
import { housingUnit, placement } from '@/lib/db'
import {
  calculateUnitMetrics,
  calculateAllUnitMetrics,
  getSimilarPlacementSuccessRate,
} from '../unit-metrics'

// =============================================================================
// MOCKS
// =============================================================================

const mockHousingUnitFindFirst = jest.fn()
const mockHousingUnitFindMany = jest.fn()
const mockIncidentCount = jest.fn()
const mockIncidentFindMany = jest.fn().mockResolvedValue([])
const mockPlacementCount = jest.fn()
const mockPlacementFindMany = jest.fn()

jest.mock('@/lib/db', () => {
  const actual = jest.requireActual<typeof import('@/lib/db')>('@/lib/db')
  return {
    ...actual,
    db: {
      query: {
        housingUnit: {
          findFirst: (...a: unknown[]) => mockHousingUnitFindFirst(...a),
          findMany: (...a: unknown[]) => mockHousingUnitFindMany(...a),
        },
        incident: { findMany: (...a: unknown[]) => mockIncidentFindMany(...a) },
        placement: { findMany: (...a: unknown[]) => mockPlacementFindMany(...a) },
      },
      // `db.$count(table, where)` — dispatched on the table object, so the
      // totalConflicts and activePlacements counts stay separately primeable.
      $count: (table: unknown, where?: unknown) =>
        table === actual.incident ? mockIncidentCount(where) : mockPlacementCount(where),
    },
  }
})

/** Same accessor shape the Prisma-era test used, so the test bodies read unchanged. */
const mockDb = {
  housingUnit: { findUnique: mockHousingUnitFindFirst, findMany: mockHousingUnitFindMany },
  incident: { count: mockIncidentCount, findMany: mockIncidentFindMany },
  placement: { count: mockPlacementCount, findMany: mockPlacementFindMany },
}

// =============================================================================
// FIXED TIME
// =============================================================================

// Pin time to 2025-07-15T12:00:00Z so all date math is deterministic
const FIXED_NOW = new Date('2025-07-15T12:00:00.000Z')

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  jest.setSystemTime(FIXED_NOW)
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
 * Sets up default mocks for a simple calculateUnitMetrics call.
 * Returns the unit object so tests can override fields.
 */
function setupDefaultMocks(unitOverrides: Record<string, unknown> = {}) {
  const unit = makeUnit(unitOverrides)
  ;(mockDb.housingUnit.findUnique as jest.Mock).mockResolvedValue(unit)
  ;(mockDb.incident.count as jest.Mock).mockResolvedValue(0)
  ;(mockDb.placement.count as jest.Mock).mockResolvedValue(0)
  return unit
}

// =============================================================================
// calculateUnitMetrics
// =============================================================================

describe('calculateUnitMetrics', () => {
  // ---------------------------------------------------------------------------
  // Unit not found
  // ---------------------------------------------------------------------------

  it('throws when unit is not found', async () => {
    ;(mockDb.housingUnit.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(calculateUnitMetrics('nonexistent')).rejects.toThrow('Unit nonexistent not found')
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
      incidentFreeMonths: 12, // All 12 months are incident-free (mock returns 0)
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
        makeIncident(`2025-05-${String(i + 1).padStart(2, '0')}`),
      )
      setupDefaultMocks({ incidents })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.conflictRate).toBe(1.2)
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
      const incidents = [makeIncident('2025-03-01'), makeIncident('2025-02-01')]
      setupDefaultMocks({ incidents })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.recentConflicts).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // Total conflicts (separate prisma.incident.count call)
  // ---------------------------------------------------------------------------

  it('returns totalConflicts from prisma.incident.count', async () => {
    setupDefaultMocks()
    // First call is totalConflicts, subsequent calls are incident-free month checks
    ;(mockDb.incident.count as jest.Mock)
      .mockResolvedValueOnce(42) // totalConflicts
      .mockResolvedValue(0) // incident-free months loop

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
      ;(mockDb.placement.count as jest.Mock).mockResolvedValue(3)

      const result = await calculateUnitMetrics('unit-1')

      expect(result.currentOccupancy).toBe(3)
      expect(result.occupancyRate).toBe(75) // 3/4 * 100
    })

    it('returns 100 when fully occupied', async () => {
      setupDefaultMocks({ totalBeds: 2 })
      ;(mockDb.placement.count as jest.Mock).mockResolvedValue(2)

      const result = await calculateUnitMetrics('unit-1')

      expect(result.occupancyRate).toBe(100)
    })

    it('returns 0 when empty', async () => {
      setupDefaultMocks({ totalBeds: 4 })
      ;(mockDb.placement.count as jest.Mock).mockResolvedValue(0)

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
          checkIns: [{ overallSatisfaction: 4 }, { overallSatisfaction: 5 }],
        }),
        makePlacement({
          id: 'p-2',
          checkIns: [{ overallSatisfaction: 3 }],
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
      // totalConflicts = 0, then 12 months of 0 incidents
      ;(mockDb.incident.count as jest.Mock).mockResolvedValue(0)

      const result = await calculateUnitMetrics('unit-1')

      expect(result.incidentFreeMonths).toBe(12)
    })

    it('returns 0 when current month has incidents', async () => {
      setupDefaultMocks()
      // Refactor: incidentFreeMonths now derives from a single findMany over
      // the last 12 months; the JS loop buckets dates by Zurich month.
      ;(mockDb.incident.findMany as jest.Mock).mockResolvedValueOnce([
        makeIncident('2025-07-10'), // July 2025: current month has an incident
      ])

      const result = await calculateUnitMetrics('unit-1')
      expect(result.incidentFreeMonths).toBe(0)
    })

    it('counts consecutive months backward until an incident is found', async () => {
      setupDefaultMocks()
      ;(mockDb.incident.findMany as jest.Mock).mockResolvedValueOnce([
        makeIncident('2025-04-15'), // April: incident, break after counting 3 free
      ])
      const result = await calculateUnitMetrics('unit-1')
      expect(result.incidentFreeMonths).toBe(3) // July, June, May
    })

    it('stops counting at the first month with incidents', async () => {
      setupDefaultMocks()
      ;(mockDb.incident.findMany as jest.Mock).mockResolvedValueOnce([
        makeIncident('2025-06-15'), // June: incident -> only July counted
        makeIncident('2025-05-10'), // (May also has incidents but we already broke)
      ])
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
        makeIncident(`2025-05-${String((i % 28) + 1).padStart(2, '0')}`),
      )
      setupDefaultMocks({ incidents })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.riskLevel).toBe('CRITICAL')
    })

    it('returns HIGH when conflictRate >= 2', async () => {
      // 12 incidents / 6 = 2.0
      const incidents = Array.from({ length: 12 }, (_, i) =>
        makeIncident(`2025-05-${String((i % 28) + 1).padStart(2, '0')}`),
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
        makeIncident(`2025-05-${String(i + 1).padStart(2, '0')}`),
      )
      setupDefaultMocks({ incidents })

      const result = await calculateUnitMetrics('unit-1')

      expect(result.riskLevel).toBe('MEDIUM')
    })

    it('returns MEDIUM when recentConflicts >= 2 even if conflictRate < 1', async () => {
      // 2 incidents in last 30 days -> conflictRate = 2/6 = 0.33, recentConflicts = 2
      const incidents = [makeIncident('2025-07-10'), makeIncident('2025-07-12')]
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
      // totalConflicts = 0, all 12 months free
      ;(mockDb.incident.count as jest.Mock).mockResolvedValue(0)

      const result = await calculateUnitMetrics('unit-1')

      expect(result.incidentFreeMonths).toBeGreaterThanOrEqual(6)
      expect(result.label).toBe('Sehr stabil')
    })

    /**
     * The refactor replaced the incidentFreeMonths loop's per-month
     * `incident.count` queries with a single `incident.findMany` whose
     * result is bucketed by Zurich month in JS. Tests previously primed
     * `count.mockResolvedValueOnce(...)` per month; they now prime
     * `findMany.mockResolvedValueOnce(incidents)` once.
     */
    it('returns "Stabil" when incidentFreeMonths is 3-5', async () => {
      setupDefaultMocks()
      ;(mockDb.incident.count as jest.Mock).mockResolvedValueOnce(5) // totalConflicts
      ;(mockDb.incident.findMany as jest.Mock).mockResolvedValueOnce([
        makeIncident('2025-04-15'), // April incident -> 3 free months (Jul, Jun, May)
      ])

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
      const incidents = [
        makeIncident('2025-07-10'), // recent (after June 15)
        makeIncident('2025-06-01'), // 30-60 day window (before June 15, after May 16)
        makeIncident('2025-05-20'), // 30-60 day window (before June 15, after May 16)
      ]
      setupDefaultMocks({ incidents })
      ;(mockDb.incident.count as jest.Mock).mockResolvedValueOnce(5) // totalConflicts
      ;(mockDb.incident.findMany as jest.Mock).mockResolvedValueOnce([
        makeIncident('2025-07-10'), // current month -> incidentFreeMonths=0
      ])

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
        makeIncident('2025-07-10'), // recent
        makeIncident('2025-07-11'), // recent
        makeIncident('2025-07-12'), // recent
        makeIncident('2025-06-01'), // 30-60 day window (before June 15)
        makeIncident('2025-05-20'), // 30-60 day window
        makeIncident('2025-05-25'), // 30-60 day window
      ]
      setupDefaultMocks({ incidents })
      ;(mockDb.incident.count as jest.Mock).mockResolvedValueOnce(10) // totalConflicts
      ;(mockDb.incident.findMany as jest.Mock).mockResolvedValueOnce([
        makeIncident('2025-07-10'), // current month -> incidentFreeMonths=0
      ])

      const result = await calculateUnitMetrics('unit-1')

      expect(result.recentConflicts).toBe(3)
      expect(result.label).toBe('Kritisch')
    })

    it('returns "Beobachten" when conflictRate > 1 but recentConflicts <= 2', async () => {
      // 8 incidents total in 6 months -> conflictRate = 1.3
      // Only 1 within last 30 days, 1 in 30-60 day window (not "Verbesserung")
      const incidents = [
        makeIncident('2025-07-01'), // recent
        makeIncident('2025-06-01'), // 30-60 day window
        makeIncident('2025-05-01'),
        makeIncident('2025-04-01'),
        makeIncident('2025-03-01'),
        makeIncident('2025-02-15'),
        makeIncident('2025-02-10'),
      ]
      setupDefaultMocks({ incidents })
      ;(mockDb.incident.count as jest.Mock).mockResolvedValueOnce(20) // totalConflicts
      ;(mockDb.incident.findMany as jest.Mock).mockResolvedValueOnce([makeIncident('2025-07-10')])

      const result = await calculateUnitMetrics('unit-1')

      expect(result.incidentFreeMonths).toBe(0)
      expect(result.conflictRate).toBeGreaterThan(1)
      expect(result.recentConflicts).toBeLessThanOrEqual(2)
      expect(result.label).toBe('Beobachten')
    })

    it('returns "Normal" as fallback', async () => {
      // 1 old incident -> conflictRate = 0.17, recentConflicts = 0
      // incidentFreeMonths = 0 (because current month has incidents via count mock)
      const incidents = [makeIncident('2025-04-01')]
      setupDefaultMocks({ incidents })
      ;(mockDb.incident.count as jest.Mock).mockResolvedValueOnce(1) // totalConflicts
      ;(mockDb.incident.findMany as jest.Mock).mockResolvedValueOnce([makeIncident('2025-07-10')])

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
      ;(mockDb.placement.count as jest.Mock).mockResolvedValue(1)

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
      makeIncident('2025-07-10'), // recent
      makeIncident('2025-06-01'), // not recent
    ]

    ;(mockDb.housingUnit.findUnique as jest.Mock).mockResolvedValue(
      makeUnit({ placements, incidents, totalBeds: 3 }),
    )
    ;(mockDb.incident.count as jest.Mock).mockResolvedValueOnce(8) // totalConflicts
    ;(mockDb.incident.findMany as jest.Mock).mockResolvedValueOnce([
      makeIncident('2025-07-10'), // July: incident -> incidentFreeMonths=0
    ])
    ;(mockDb.placement.count as jest.Mock).mockResolvedValue(1) // 1 active

    const result = await calculateUnitMetrics('unit-1')

    expect(result.conflictRate).toBe(0.3) // 2/6 = 0.333 -> 0.3
    expect(result.recentConflicts).toBe(1)
    expect(result.totalConflicts).toBe(8)
    expect(result.avgPlacementDuration).toBe(106) // (181+31)/2 = 106
    expect(result.successRate).toBe(50) // 1/2 = 50%
    expect(result.turnoverRate).toBe(50) // 1/2 = 50%
    expect(result.currentOccupancy).toBe(1)
    expect(result.occupancyRate).toBe(33) // 1/3 = 33.33 -> 33
    expect(result.avgSatisfaction).toBe(3.5) // (4+5+2+3)/4 = 3.5
    expect(result.incidentFreeMonths).toBe(0)
    expect(result.riskLevel).toBe('LOW')
    expect(result.label).toBe('Normal')
  })
})

// =============================================================================
// calculateAllUnitMetrics
// =============================================================================

describe('calculateAllUnitMetrics', () => {
  it('returns empty array when no units match', async () => {
    ;(mockDb.housingUnit.findMany as jest.Mock).mockResolvedValue([])

    const result = await calculateAllUnitMetrics()

    expect(result).toEqual([])
  })

  it('calls calculateUnitMetrics for each unit with AVAILABLE or FULL status', async () => {
    ;(mockDb.housingUnit.findMany as jest.Mock).mockResolvedValue([
      { id: 'unit-a' },
      { id: 'unit-b' },
    ])

    // Set up mocks for two calls to calculateUnitMetrics
    const unitA = makeUnit({ id: 'unit-a', code: 'WG-A' })
    const unitB = makeUnit({ id: 'unit-b', code: 'WG-B' })

    ;(mockDb.housingUnit.findUnique as jest.Mock)
      .mockResolvedValueOnce(unitA)
      .mockResolvedValueOnce(unitB)
    ;(mockDb.incident.count as jest.Mock).mockResolvedValue(0)
    ;(mockDb.placement.count as jest.Mock).mockResolvedValue(0)

    const result = await calculateAllUnitMetrics()

    expect(result).toHaveLength(2)
    expect(result[0].unitId).toBe('unit-a')
    expect(result[1].unitId).toBe('unit-b')
  })

  it('queries units with status AVAILABLE or FULL', async () => {
    ;(mockDb.housingUnit.findMany as jest.Mock).mockResolvedValue([])

    await calculateAllUnitMetrics()

    // Compared against the REAL drizzle expression — same column, operator
    // and values, without asserting on the SQL tree's internals by hand.
    expect(mockDb.housingUnit.findMany).toHaveBeenCalledWith({
      where: inArray(housingUnit.status, ['AVAILABLE', 'FULL']),
      columns: { id: true },
    })
  })
})

// =============================================================================
// getSimilarPlacementSuccessRate
// =============================================================================

describe('getSimilarPlacementSuccessRate', () => {
  it('returns zeros when no placements found', async () => {
    ;(mockDb.placement.findMany as jest.Mock).mockResolvedValue([])

    const result = await getSimilarPlacementSuccessRate(75)

    expect(result).toEqual({
      successRate: 0,
      totalPlacements: 0,
      successfulPlacements: 0,
    })
  })

  it('queries placements within score +/- range', async () => {
    ;(mockDb.placement.findMany as jest.Mock).mockResolvedValue([])

    await getSimilarPlacementSuccessRate(75, 15)

    expect(mockDb.placement.findMany).toHaveBeenCalledWith({
      where: and(
        gte(placement.compatibilityScore, 60), // 75 - 15
        lte(placement.compatibilityScore, 90), // 75 + 15
        isNotNull(placement.endDate),
      ),
    })
  })

  it('uses default range of 10', async () => {
    ;(mockDb.placement.findMany as jest.Mock).mockResolvedValue([])

    await getSimilarPlacementSuccessRate(80)

    expect(mockDb.placement.findMany).toHaveBeenCalledWith({
      where: and(
        gte(placement.compatibilityScore, 70), // 80 - 10
        lte(placement.compatibilityScore, 90), // 80 + 10
        isNotNull(placement.endDate),
      ),
    })
  })

  it('counts successful placements (180+ days and endReason !== CONFLICT)', async () => {
    const placements = [
      {
        id: 'p-1',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-07-10'), // 190 days
        endReason: 'COMPLETED',
      },
      {
        id: 'p-2',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-07-10'), // 190 days
        endReason: 'CONFLICT', // not successful (endReason is CONFLICT)
      },
      {
        id: 'p-3',
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-06-01'), // 31 days — too short
        endReason: 'COMPLETED',
      },
    ]
    ;(mockDb.placement.findMany as jest.Mock).mockResolvedValue(placements)

    const result = await getSimilarPlacementSuccessRate(75)

    expect(result).toEqual({
      successRate: 33, // 1/3 = 33.33 -> 33
      totalPlacements: 3,
      successfulPlacements: 1,
    })
  })

  it('returns 100% when all placements are successful', async () => {
    const placements = [
      {
        id: 'p-1',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-07-10'), // 190 days
        endReason: 'COMPLETED',
      },
      {
        id: 'p-2',
        startDate: new Date('2024-12-01'),
        endDate: new Date('2025-07-01'), // 212 days
        endReason: 'REQUEST', // not CONFLICT, so still successful
      },
    ]
    ;(mockDb.placement.findMany as jest.Mock).mockResolvedValue(placements)

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
        id: 'p-1',
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-06-01'), // 31 days — too short
        endReason: 'COMPLETED',
      },
      {
        id: 'p-2',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-07-10'), // 190 days but CONFLICT
        endReason: 'CONFLICT',
      },
    ]
    ;(mockDb.placement.findMany as jest.Mock).mockResolvedValue(placements)

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
        id: 'p-1',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-07-10'),
        endReason: 'COMPLETED',
      },
      {
        id: 'p-2',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-07-10'),
        endReason: 'COMPLETED',
      },
      {
        id: 'p-3',
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-06-01'),
        endReason: 'COMPLETED',
      },
    ]
    ;(mockDb.placement.findMany as jest.Mock).mockResolvedValue(placements)

    const result = await getSimilarPlacementSuccessRate(75)

    // 2/3 = 66.66... -> 67
    expect(result.successRate).toBe(67)
  })
})
