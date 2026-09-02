/**
 * Unit tests for placement server actions
 *
 * Tests createPlacement (returns result object).
 * endPlacement and transferPlacement use redirect() which throws, so they are not tested here.
 */

import { getTableName } from 'drizzle-orm'
import { housingUnit, placementSpot, resident } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { createPlacement } from '../placements'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// =============================================================================
// MOCKS
// =============================================================================

const mockTransaction = jest.fn()

jest.mock('@/lib/db', () => ({
  ...jest.requireActual<object>('@/lib/db'),
  db: {
    transaction: (fn: (tx: unknown) => unknown) => mockTransaction(fn),
  },
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

jest.mock('@/lib/audit', () => ({
  logAudit: jest.fn(),
}))

const mockStaffUser = {
  id: 'staff-1',
  email: 'admin@test.com',
  name: 'Test Admin',
  role: 'ADMIN' as const,
}

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({
    id: 'staff-1',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'ADMIN' as const,
  }),
  requireStaffAuth: jest.fn().mockResolvedValue({
    id: 'staff-1',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'ADMIN' as const,
  }),
  requirePermission: jest.fn().mockResolvedValue({
    id: 'staff-1',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'ADMIN' as const,
  }),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    errorWithCause: jest.fn(),
  },
}))

jest.mock('@/lib/compatibility', () => ({
  calculateCompatibility: jest.fn().mockReturnValue({
    overall: 75,
    lifestyle: 80,
    social: 70,
    practical: 75,
    risk: 65,
    strengths: [],
    concerns: [],
  }),
  saveBidirectionalAssessment: jest.fn(),
}))

jest.mock('@/lib/compatibility/convert', () => ({
  toResidentProfile: jest.fn().mockReturnValue({}),
}))

jest.mock('@/lib/compatibility/placement-scores', () => ({
  calculateAverageScores: jest.fn().mockReturnValue({
    compatibilityScore: 75,
    lifestyleScore: 80,
    socialScore: 70,
    practicalScore: 75,
    riskScore: 65,
  }),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

// =============================================================================
// Helper to set up db.transaction mock
// =============================================================================

interface MockTx {
  query: {
    resident: { findFirst: jest.Mock }
    placement: { findFirst: jest.Mock; findMany: jest.Mock }
    placementSpot: { findFirst: jest.Mock }
    housingUnit: { findFirst: jest.Mock }
  }
  /** Resolves the rows returned by tx.insert(…).values(…).returning() */
  insertReturning: jest.Mock
  /** Records every tx.update(table).set(payload) as (tableName, payload) */
  updateSet: jest.Mock
}

/**
 * Configures db.transaction to execute the callback with a mock tx object.
 * Each mock method on tx is configurable via the txSetup callback.
 */
function setupTransaction(txSetup: (tx: MockTx) => void) {
  const tx: MockTx = {
    query: {
      resident: { findFirst: jest.fn() },
      placement: { findFirst: jest.fn(), findMany: jest.fn() },
      placementSpot: { findFirst: jest.fn() },
      housingUnit: { findFirst: jest.fn() },
    },
    insertReturning: jest.fn().mockResolvedValue([{}]),
    updateSet: jest.fn(),
  }
  txSetup(tx)

  const txSurface = {
    query: tx.query,
    insert: jest.fn(() => ({
      values: (v: unknown) => ({
        returning: (): Promise<unknown[]> => tx.insertReturning(v),
      }),
    })),
    update: jest.fn((table: unknown) => ({
      set: (v: unknown) => {
        tx.updateSet(getTableName(table as any), v)
        return { where: () => Promise.resolve([]) }
      },
    })),
  }
  mockTransaction.mockImplementation(async (cb: (t: unknown) => unknown) => {
    return cb(txSurface)
  })
  return tx
}

const baseInput = {
  residentId: 'res-1',
  housingUnitId: 'hu-1',
  spotId: 'spot-1',
  startDate: new Date('2025-06-01'),
  notes: 'Test placement',
}

// =============================================================================
// createPlacement
// =============================================================================

describe('createPlacement', () => {
  it('returns error when resident not found', async () => {
    setupTransaction((tx) => {
      tx.query.resident.findFirst.mockResolvedValue(null)
    })

    const result = await createPlacement(baseInput)

    expect(result.success).toBe(false)
    expect(result.error).toBe(ERROR_MESSAGES.RESIDENT_NOT_FOUND)
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('returns error when resident already has active placement', async () => {
    setupTransaction((tx) => {
      tx.query.resident.findFirst.mockResolvedValue({ id: 'res-1', code: 'RES-001' })
      tx.query.placement.findFirst.mockResolvedValue({ id: 'pl-existing', status: 'ACTIVE' })
    })

    const result = await createPlacement(baseInput)

    expect(result.success).toBe(false)
    expect(result.error).toBe(ERROR_MESSAGES.RESIDENT_HAS_ACTIVE_PLACEMENT)
  })

  it('returns error when spot not found', async () => {
    setupTransaction((tx) => {
      tx.query.resident.findFirst.mockResolvedValue({ id: 'res-1', code: 'RES-001' })
      tx.query.placement.findFirst.mockResolvedValue(null)
      tx.query.placementSpot.findFirst.mockResolvedValue(null)
    })

    const result = await createPlacement(baseInput)

    expect(result.success).toBe(false)
    expect(result.error).toBe(ERROR_MESSAGES.SPOT_NOT_FOUND)
  })

  it('returns error when spot is not available', async () => {
    setupTransaction((tx) => {
      tx.query.resident.findFirst.mockResolvedValue({ id: 'res-1', code: 'RES-001' })
      tx.query.placement.findFirst.mockResolvedValue(null)
      tx.query.placementSpot.findFirst.mockResolvedValue({ id: 'spot-1', status: 'OCCUPIED' })
    })

    const result = await createPlacement(baseInput)

    expect(result.success).toBe(false)
    expect(result.error).toBe(ERROR_MESSAGES.SPOT_NOT_AVAILABLE)
  })

  it('succeeds and creates placement with correct data', async () => {
    const newPlacement = { id: 'pl-new', residentId: 'res-1' }

    setupTransaction((tx) => {
      tx.query.resident.findFirst.mockResolvedValue({ id: 'res-1', code: 'RES-001' })
      tx.query.placement.findFirst.mockResolvedValue(null)
      tx.query.placementSpot.findFirst.mockResolvedValue({ id: 'spot-1', status: 'AVAILABLE' })
      tx.query.placement.findMany.mockResolvedValue([]) // no existing placements in unit
      tx.insertReturning.mockResolvedValue([newPlacement])
      tx.query.housingUnit.findFirst.mockResolvedValue({
        id: 'hu-1',
        spots: [{ id: 'spot-2', status: 'AVAILABLE' }], // still spots available
      })
    })

    const result = await createPlacement(baseInput)

    expect(result).toEqual({ success: true, placementId: 'pl-new' })
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        entity: 'PLACEMENT',
        entityId: 'pl-new',
        changes: { residentId: 'res-1', housingUnitId: 'hu-1', spotId: 'spot-1' },
      }),
    )
  })

  it('marks housing unit as FULL when no available spots remain', async () => {
    const newPlacement = { id: 'pl-new', residentId: 'res-1' }

    const tx = setupTransaction((tx) => {
      tx.query.resident.findFirst.mockResolvedValue({ id: 'res-1', code: 'RES-001' })
      tx.query.placement.findFirst.mockResolvedValue(null)
      tx.query.placementSpot.findFirst.mockResolvedValue({ id: 'spot-1', status: 'AVAILABLE' })
      tx.query.placement.findMany.mockResolvedValue([])
      tx.insertReturning.mockResolvedValue([newPlacement])
      // No remaining available spots
      tx.query.housingUnit.findFirst.mockResolvedValue({
        id: 'hu-1',
        spots: [],
      })
    })

    const result = await createPlacement(baseInput)

    expect(result.success).toBe(true)
    expect(tx.updateSet).toHaveBeenCalledWith(getTableName(housingUnit), { status: 'FULL' })
    // spot occupied + resident placed still happen alongside the FULL update
    expect(tx.updateSet).toHaveBeenCalledWith(getTableName(placementSpot), { status: 'OCCUPIED' })
    expect(tx.updateSet).toHaveBeenCalledWith(getTableName(resident), { status: 'PLACED' })
  })
})

// =============================================================================
// auth guard
// =============================================================================

describe('auth guard', () => {
  it('rejects unauthenticated requests', async () => {
    const { requirePermission: mockRequirePermission } = require('@/lib/auth')
    mockRequirePermission.mockRejectedValueOnce(new Error('Anmeldung erforderlich'))

    await expect(
      createPlacement({
        residentId: 'r1',
        housingUnitId: 'h1',
        spotId: 's1',
        startDate: new Date(),
      }),
    ).rejects.toThrow('Anmeldung erforderlich')
  })
})
