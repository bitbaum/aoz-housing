/**
 * Unit tests for transfer request server actions
 *
 * Tests getTransferRequests (read-only, no auth guard),
 * approveTransferRequest and denyTransferRequest (both require auth,
 * update status atomically, create audit log).
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

const mockPrisma = prisma as jest.Mocked<typeof prisma>

beforeEach(() => {
  jest.clearAllMocks()
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
        // displayName comes along so the staff queue can show a name rather
        // than a login code (RESIDENT_NAME_SELECT).
        resident: { select: { id: true, code: true, displayName: true, supportLevel: true } },
        currentPlacement: {
          select: {
            id: true,
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
// approveTransferRequest
// =============================================================================

describe('approveTransferRequest', () => {
  const validInput = { requestId: 'clxxxxxxxxxxxxxxxxx0001', staffNotes: 'Genehmigt' }

  it('approves a pending request atomically and returns success', async () => {
    ;(mockPrisma.transferRequest.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

    const result = await approveTransferRequest(validInput)

    expect(result).toEqual({ success: true })

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
    ;(mockPrisma.transferRequest.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(mockPrisma.transferRequest.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await approveTransferRequest(validInput)

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_NOT_FOUND })
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('returns error when request has already been reviewed', async () => {
    ;(mockPrisma.transferRequest.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(mockPrisma.transferRequest.findUnique as jest.Mock).mockResolvedValue({
      id: 'clxxxxxxxxxxxxxxxxx0001',
    })

    const result = await approveTransferRequest(validInput)

    expect(result).toEqual({ success: false, error: 'Anfrage wurde bereits bearbeitet' })
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('returns generic error when prisma fails', async () => {
    ;(mockPrisma.transferRequest.updateMany as jest.Mock).mockRejectedValue(
      new Error('DB error')
    )

    const result = await approveTransferRequest(validInput)

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_REVIEW_ERROR })
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

    expect(result).toEqual({ success: true })

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
