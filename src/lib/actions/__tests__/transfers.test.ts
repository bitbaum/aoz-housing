/**
 * Unit tests for transfer request server actions
 *
 * Tests getTransferRequests (read-only), denyTransferRequest (status flip +
 * audit log), and approveTransferRequest — which now EXECUTES the move when
 * the request names a target unit (end old placement, create new placement,
 * spot + unit status updates, request → COMPLETED) and falls back to a pure
 * APPROVED status flip when no target unit is set.
 */

import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import {
  getTransferRequests,
  approveTransferRequest,
  denyTransferRequest,
} from '../transfers'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// =============================================================================
// MOCKS
// =============================================================================

jest.mock('@/lib/db', () => ({
  prisma: {
    transferRequest: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('@/lib/audit', () => ({
  logAudit: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({ id: 'staff-1', email: 'admin@test.com', name: 'Test Admin', role: 'ADMIN' as const }),
  requireStaffAuth: jest.fn().mockResolvedValue({ id: 'staff-1', email: 'admin@test.com', name: 'Test Admin', role: 'ADMIN' as const }),
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

const mockCalculateApartmentFit = jest.fn()
jest.mock('@/lib/compatibility', () => ({
  calculateCompatibility: jest.fn().mockReturnValue({ overall: 80, strengths: [], concerns: [] }),
  saveBidirectionalAssessment: jest.fn(),
}))
jest.mock('@/lib/compatibility/convert', () => ({
  toResidentProfile: jest.fn((r: unknown) => r),
}))
jest.mock('@/lib/compatibility/aggregate', () => ({
  calculateApartmentProfile: jest.fn(() => ({})),
  calculateApartmentFit: (...args: unknown[]) => mockCalculateApartmentFit(...args),
}))
jest.mock('@/lib/compatibility/placement-scores', () => ({
  calculateAverageScores: jest.fn(() => ({
    compatibilityScore: 75,
    lifestyleScore: 75,
    socialScore: 75,
    practicalScore: 75,
    riskScore: 75,
  })),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

/** Transaction client mock handed to the $transaction callback */
function makeTx() {
  return {
    transferRequest: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      update: jest.fn().mockResolvedValue({}),
    },
    placement: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'pl-1',
        residentId: 'res-1',
        housingUnitId: 'unit-old',
        spotId: 'spot-old',
        status: 'ACTIVE',
      }),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({ id: 'pl-2' }),
    },
    placementSpot: {
      findFirst: jest.fn().mockResolvedValue({ id: 'spot-new' }),
      update: jest.fn().mockResolvedValue({}),
    },
    resident: {
      findUnique: jest.fn().mockResolvedValue({ id: 'res-1' }),
    },
    housingUnit: {
      findUnique: jest
        .fn()
        .mockResolvedValueOnce({ id: 'unit-old', status: 'FULL' })
        .mockResolvedValueOnce({ id: 'unit-new', spots: [{ id: 'spot-x' }] }),
      update: jest.fn().mockResolvedValue({}),
    },
  }
}

function mockTransactionWith(tx: ReturnType<typeof makeTx>) {
  ;(mockPrisma.$transaction as jest.Mock).mockImplementation(
    async (cb: (tx: unknown) => Promise<unknown>) => cb(tx)
  )
}

const pendingWithTarget = {
  id: 'clxxxxxxxxxxxxxxxxx0001',
  status: 'PENDING',
  residentId: 'res-1',
  targetUnitId: 'unit-new',
  currentPlacementId: 'pl-1',
}

const pendingWithoutTarget = {
  ...pendingWithTarget,
  targetUnitId: null,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCalculateApartmentFit.mockReturnValue({ fitScore: 80, conflicts: [] })
})

// =============================================================================
// getTransferRequests
// =============================================================================

describe('getTransferRequests', () => {
  it('returns all transfer requests when no status filter is provided', async () => {
    const mockRequests = [
      { id: 'tr-1', status: 'PENDING', reason: 'Lärm' },
      { id: 'tr-2', status: 'APPROVED', reason: 'Platzwechsel' },
    ]
    ;(mockPrisma.transferRequest.findMany as jest.Mock).mockResolvedValue(mockRequests)

    const result = await getTransferRequests()

    expect(result).toEqual(mockRequests)
    expect(mockPrisma.transferRequest.findMany).toHaveBeenCalledWith({
      where: {},
      include: {
        resident: { select: { id: true, code: true, supportLevel: true } },
        currentPlacement: {
          select: {
            id: true,
            status: true,
            housingUnit: { select: { id: true, code: true, address: true } },
          },
        },
        targetUnit: { select: { id: true, code: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('filters by status when provided', async () => {
    ;(mockPrisma.transferRequest.findMany as jest.Mock).mockResolvedValue([])

    await getTransferRequests('PENDING')

    expect(mockPrisma.transferRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'PENDING' },
      })
    )
  })

  it('returns empty array when no requests exist', async () => {
    ;(mockPrisma.transferRequest.findMany as jest.Mock).mockResolvedValue([])

    const result = await getTransferRequests()

    expect(result).toEqual([])
  })
})

// =============================================================================
// approveTransferRequest — approval-only path (no target unit)
// =============================================================================

describe('approveTransferRequest without target unit', () => {
  const validInput = { requestId: 'clxxxxxxxxxxxxxxxxx0001', staffNotes: 'Genehmigt' }

  it('approves a pending request atomically and returns success without executing', async () => {
    ;(mockPrisma.transferRequest.findUnique as jest.Mock).mockResolvedValue(pendingWithoutTarget)
    ;(mockPrisma.transferRequest.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

    const result = await approveTransferRequest(validInput)

    expect(result).toEqual({ success: true, executed: false })
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()

    expect(mockPrisma.transferRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 'clxxxxxxxxxxxxxxxxx0001', status: 'PENDING' },
      data: {
        status: 'APPROVED',
        staffNotes: 'Genehmigt',
        reviewedBy: 'staff-1',
        reviewedAt: expect.any(Date),
      },
    })
  })

  it('calls logAudit with userId on approval', async () => {
    ;(mockPrisma.transferRequest.findUnique as jest.Mock).mockResolvedValue(pendingWithoutTarget)
    ;(mockPrisma.transferRequest.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

    await approveTransferRequest(validInput)

    expect(logAudit).toHaveBeenCalledWith({
      action: 'UPDATE',
      entity: 'TRANSFER_REQUEST',
      entityId: 'clxxxxxxxxxxxxxxxxx0001',
      userId: 'staff-1',
      changes: { status: 'APPROVED', staffNotes: 'Genehmigt' },
    })
  })

  it('returns error when request is not found', async () => {
    ;(mockPrisma.transferRequest.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await approveTransferRequest(validInput)

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_NOT_FOUND })
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('returns error when request has already been reviewed', async () => {
    ;(mockPrisma.transferRequest.findUnique as jest.Mock).mockResolvedValue({
      ...pendingWithoutTarget,
      status: 'APPROVED',
    })

    const result = await approveTransferRequest(validInput)

    expect(result).toEqual({ success: false, error: 'Anfrage wurde bereits bearbeitet' })
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('returns generic error when prisma fails', async () => {
    ;(mockPrisma.transferRequest.findUnique as jest.Mock).mockResolvedValue(pendingWithoutTarget)
    ;(mockPrisma.transferRequest.updateMany as jest.Mock).mockRejectedValue(
      new Error('DB error')
    )

    const result = await approveTransferRequest(validInput)

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_REVIEW_ERROR })
  })
})

// =============================================================================
// approveTransferRequest — executing path (target unit set)
// =============================================================================

describe('approveTransferRequest with target unit', () => {
  const validInput = { requestId: 'clxxxxxxxxxxxxxxxxx0001', staffNotes: 'Passt' }

  it('executes the transfer and marks the request COMPLETED', async () => {
    ;(mockPrisma.transferRequest.findUnique as jest.Mock).mockResolvedValue(pendingWithTarget)
    const tx = makeTx()
    mockTransactionWith(tx)

    const result = await approveTransferRequest(validInput)

    expect(result).toEqual({ success: true, executed: true })

    // Atomic claim inside the transaction
    expect(tx.transferRequest.updateMany).toHaveBeenCalledWith({
      where: { id: pendingWithTarget.id, status: 'PENDING' },
      data: expect.objectContaining({ status: 'APPROVED', reviewedBy: 'staff-1' }),
    })
    // Old placement ended as TRANSFERRED
    expect(tx.placement.update).toHaveBeenCalledWith({
      where: { id: 'pl-1' },
      data: expect.objectContaining({ status: 'TRANSFERRED', endReason: 'REQUEST' }),
    })
    // Old spot freed, new spot occupied
    expect(tx.placementSpot.update).toHaveBeenCalledWith({
      where: { id: 'spot-old' },
      data: { status: 'AVAILABLE' },
    })
    expect(tx.placementSpot.update).toHaveBeenCalledWith({
      where: { id: 'spot-new' },
      data: { status: 'OCCUPIED' },
    })
    // New placement created in the target unit with server-computed scores
    expect(tx.placement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        residentId: 'res-1',
        housingUnitId: 'unit-new',
        spotId: 'spot-new',
        status: 'ACTIVE',
        compatibilityScore: 75,
      }),
    })
    // Formerly-full old unit reopened
    expect(tx.housingUnit.update).toHaveBeenCalledWith({
      where: { id: 'unit-old' },
      data: { status: 'AVAILABLE' },
    })
    // Request finished, not merely approved
    expect(tx.transferRequest.update).toHaveBeenCalledWith({
      where: { id: pendingWithTarget.id },
      data: { status: 'COMPLETED' },
    })
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'TRANSFER',
        entity: 'TRANSFER_REQUEST',
        changes: expect.objectContaining({
          status: 'COMPLETED',
          fromHousingUnitId: 'unit-old',
          toHousingUnitId: 'unit-new',
        }),
      })
    )
  })

  it('fails when the target unit has no free spot', async () => {
    ;(mockPrisma.transferRequest.findUnique as jest.Mock).mockResolvedValue(pendingWithTarget)
    const tx = makeTx()
    tx.placementSpot.findFirst.mockResolvedValue(null)
    mockTransactionWith(tx)

    const result = await approveTransferRequest(validInput)

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.TRANSFER_TARGET_NO_SPOT })
    expect(tx.placement.create).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('fails with a blocking-conflict message when the target unit is incompatible', async () => {
    ;(mockPrisma.transferRequest.findUnique as jest.Mock).mockResolvedValue(pendingWithTarget)
    mockCalculateApartmentFit.mockReturnValue({
      fitScore: 10,
      conflicts: [{ severity: 'BLOCKING', message: 'Raucher in Nichtraucher-Einheit' }],
    })
    const tx = makeTx()
    mockTransactionWith(tx)

    const result = await approveTransferRequest(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Verlegung blockiert')
    expect(result.error).toContain('Raucher in Nichtraucher-Einheit')
    expect(tx.placement.create).not.toHaveBeenCalled()
  })

  it('fails when the resident already lives in the target unit', async () => {
    ;(mockPrisma.transferRequest.findUnique as jest.Mock).mockResolvedValue(pendingWithTarget)
    const tx = makeTx()
    tx.placement.findFirst.mockResolvedValue({
      id: 'pl-1',
      residentId: 'res-1',
      housingUnitId: 'unit-new',
      spotId: 'spot-old',
      status: 'ACTIVE',
    })
    mockTransactionWith(tx)

    const result = await approveTransferRequest(validInput)

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.TRANSFER_SAME_UNIT })
  })

  it('falls back to approval-only when the resident has no active placement', async () => {
    ;(mockPrisma.transferRequest.findUnique as jest.Mock).mockResolvedValue(pendingWithTarget)
    const tx = makeTx()
    tx.placement.findFirst.mockResolvedValue(null)
    mockTransactionWith(tx)

    const result = await approveTransferRequest(validInput)

    expect(result).toEqual({
      success: false,
      error: ERROR_MESSAGES.TRANSFER_REQUEST_NO_PLACEMENT,
    })
  })

  it('returns generic transfer error on unexpected failure', async () => {
    ;(mockPrisma.transferRequest.findUnique as jest.Mock).mockResolvedValue(pendingWithTarget)
    ;(mockPrisma.$transaction as jest.Mock).mockRejectedValue(new Error('DB down'))

    const result = await approveTransferRequest(validInput)

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.TRANSFER_ERROR })
  })
})

// =============================================================================
// denyTransferRequest
// =============================================================================

describe('denyTransferRequest', () => {
  const validInput = { requestId: 'clxxxxxxxxxxxxxxxxx0002', staffNotes: 'Kein Platz verfügbar' }

  it('denies a pending request atomically and returns success', async () => {
    ;(mockPrisma.transferRequest.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

    const result = await denyTransferRequest(validInput)

    expect(result).toEqual({ success: true, executed: false })

    expect(mockPrisma.transferRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 'clxxxxxxxxxxxxxxxxx0002', status: 'PENDING' },
      data: {
        status: 'DENIED',
        staffNotes: 'Kein Platz verfügbar',
        reviewedBy: 'staff-1',
        reviewedAt: expect.any(Date),
      },
    })
  })

  it('calls logAudit with userId on denial', async () => {
    ;(mockPrisma.transferRequest.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

    await denyTransferRequest(validInput)

    expect(logAudit).toHaveBeenCalledWith({
      action: 'UPDATE',
      entity: 'TRANSFER_REQUEST',
      entityId: 'clxxxxxxxxxxxxxxxxx0002',
      userId: 'staff-1',
      changes: { status: 'DENIED', staffNotes: 'Kein Platz verfügbar' },
    })
  })

  it('returns error when request is not found', async () => {
    ;(mockPrisma.transferRequest.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(mockPrisma.transferRequest.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await denyTransferRequest(validInput)

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_NOT_FOUND })
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('returns error when request has already been reviewed', async () => {
    ;(mockPrisma.transferRequest.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(mockPrisma.transferRequest.findUnique as jest.Mock).mockResolvedValue({
      id: 'clxxxxxxxxxxxxxxxxx0002',
    })

    const result = await denyTransferRequest(validInput)

    expect(result).toEqual({ success: false, error: 'Anfrage wurde bereits bearbeitet' })
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('returns generic error when prisma fails', async () => {
    ;(mockPrisma.transferRequest.updateMany as jest.Mock).mockRejectedValue(
      new Error('DB error')
    )

    const result = await denyTransferRequest(validInput)

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_REVIEW_ERROR })
  })
})

// =============================================================================
// auth guard
// =============================================================================

describe('auth guard', () => {
  it('rejects unauthenticated approve requests', async () => {
    const { requireStaffAuth: mockRequireStaffAuth } = require('@/lib/auth')
    mockRequireStaffAuth.mockRejectedValueOnce(new Error('Anmeldung erforderlich'))

    await expect(
      approveTransferRequest({ requestId: 'clxxxxxxxxxxxxxxxxx0001' })
    ).rejects.toThrow('Anmeldung erforderlich')
  })

  it('rejects unauthenticated deny requests', async () => {
    const { requireStaffAuth: mockRequireStaffAuth } = require('@/lib/auth')
    mockRequireStaffAuth.mockRejectedValueOnce(new Error('Anmeldung erforderlich'))

    await expect(
      denyTransferRequest({ requestId: 'clxxxxxxxxxxxxxxxxx0001' })
    ).rejects.toThrow('Anmeldung erforderlich')
  })
})
