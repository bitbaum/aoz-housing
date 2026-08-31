/**
 * Unit tests for placement server actions
 *
 * Tests createPlacement (returns result object).
 * endPlacement and transferPlacement use redirect() which throws, so they are not tested here.
 */

import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { createPlacement } from '../placements'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// =============================================================================
// MOCKS
// =============================================================================

jest.mock('@/lib/db', () => ({
  prisma: {
    $transaction: jest.fn(),
    resident: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    placement: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    placementSpot: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    housingUnit: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    compatibilityAssessment: {
      upsert: jest.fn(),
    },
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

const mockPrisma = prisma as jest.Mocked<typeof prisma>

beforeEach(() => {
  jest.clearAllMocks()
})

// =============================================================================
// Helper to set up $transaction mock
// =============================================================================

/**
 * Configures prisma.$transaction to execute the callback with a mock tx object.
 * Each mock method on tx is configurable via the txSetup callback.
 */
function setupTransaction(txSetup: (tx: Record<string, Record<string, jest.Mock>>) => void) {
  const tx: Record<string, Record<string, jest.Mock>> = {
    resident: { findUnique: jest.fn(), update: jest.fn() },
    placement: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    placementSpot: { findUnique: jest.fn(), update: jest.fn() },
    housingUnit: { findUnique: jest.fn(), update: jest.fn() },
    compatibilityAssessment: { upsert: jest.fn() },
  }
  txSetup(tx)
  ;(mockPrisma.$transaction as jest.Mock).mockImplementation(
    async (cb: (tx: unknown) => unknown) => {
      return cb(tx)
    },
  )
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
      tx.resident.findUnique.mockResolvedValue(null)
    })

    const result = await createPlacement(baseInput)

    expect(result.success).toBe(false)
    expect(result.error).toBe(ERROR_MESSAGES.RESIDENT_NOT_FOUND)
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('returns error when resident already has active placement', async () => {
    setupTransaction((tx) => {
      tx.resident.findUnique.mockResolvedValue({ id: 'res-1', code: 'RES-001' })
      tx.placement.findFirst.mockResolvedValue({ id: 'pl-existing', status: 'ACTIVE' })
    })

    const result = await createPlacement(baseInput)

    expect(result.success).toBe(false)
    expect(result.error).toBe(ERROR_MESSAGES.RESIDENT_HAS_ACTIVE_PLACEMENT)
  })

  it('returns error when spot not found', async () => {
    setupTransaction((tx) => {
      tx.resident.findUnique.mockResolvedValue({ id: 'res-1', code: 'RES-001' })
      tx.placement.findFirst.mockResolvedValue(null)
      tx.placementSpot.findUnique.mockResolvedValue(null)
    })

    const result = await createPlacement(baseInput)

    expect(result.success).toBe(false)
    expect(result.error).toBe(ERROR_MESSAGES.SPOT_NOT_FOUND)
  })

  it('returns error when spot is not available', async () => {
    setupTransaction((tx) => {
      tx.resident.findUnique.mockResolvedValue({ id: 'res-1', code: 'RES-001' })
      tx.placement.findFirst.mockResolvedValue(null)
      tx.placementSpot.findUnique.mockResolvedValue({ id: 'spot-1', status: 'OCCUPIED' })
    })

    const result = await createPlacement(baseInput)

    expect(result.success).toBe(false)
    expect(result.error).toBe(ERROR_MESSAGES.SPOT_NOT_AVAILABLE)
  })

  it('succeeds and creates placement with correct data', async () => {
    const newPlacement = { id: 'pl-new', residentId: 'res-1' }

    setupTransaction((tx) => {
      tx.resident.findUnique.mockResolvedValue({ id: 'res-1', code: 'RES-001' })
      tx.placement.findFirst.mockResolvedValue(null)
      tx.placementSpot.findUnique.mockResolvedValue({ id: 'spot-1', status: 'AVAILABLE' })
      tx.placement.findMany.mockResolvedValue([]) // no existing placements in unit
      tx.placement.create.mockResolvedValue(newPlacement)
      tx.placementSpot.update.mockResolvedValue({})
      tx.resident.update.mockResolvedValue({})
      tx.housingUnit.findUnique.mockResolvedValue({
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
      tx.resident.findUnique.mockResolvedValue({ id: 'res-1', code: 'RES-001' })
      tx.placement.findFirst.mockResolvedValue(null)
      tx.placementSpot.findUnique.mockResolvedValue({ id: 'spot-1', status: 'AVAILABLE' })
      tx.placement.findMany.mockResolvedValue([])
      tx.placement.create.mockResolvedValue(newPlacement)
      tx.placementSpot.update.mockResolvedValue({})
      tx.resident.update.mockResolvedValue({})
      // No remaining available spots
      tx.housingUnit.findUnique.mockResolvedValue({
        id: 'hu-1',
        spots: [],
      })
      tx.housingUnit.update.mockResolvedValue({})
    })

    const result = await createPlacement(baseInput)

    expect(result.success).toBe(true)
    expect(tx.housingUnit.update).toHaveBeenCalledWith({
      where: { id: 'hu-1' },
      data: { status: 'FULL' },
    })
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
