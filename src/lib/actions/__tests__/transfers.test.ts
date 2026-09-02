/**
 * Unit tests for transfer request server actions
 *
 * Tests getTransferRequests (read-only, no auth guard),
 * approveTransferRequest and denyTransferRequest (both require auth,
 * update status atomically, create audit log).
 */

import { and, desc, eq } from 'drizzle-orm'
import { transferRequest } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { getTransferRequests, approveTransferRequest, denyTransferRequest } from '../transfers'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// =============================================================================
// MOCKS
// =============================================================================

const mockTransferFindMany = jest.fn()
const mockTransferFindFirst = jest.fn()
// Receives (setPayload, whereExpr) and resolves the updated-row array
const mockTransferUpdate = jest.fn()

jest.mock('@/lib/db', () => ({
  ...jest.requireActual<object>('@/lib/db'),
  db: {
    query: {
      transferRequest: {
        findMany: (...a: unknown[]) => mockTransferFindMany(...a),
        findFirst: (...a: unknown[]) => mockTransferFindFirst(...a),
      },
    },
    update: jest.fn(() => ({
      set: (v: unknown) => ({
        where: (w: unknown) => ({
          returning: (): Promise<unknown[]> => mockTransferUpdate(v, w),
        }),
      }),
    })),
  },
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('@/lib/audit', () => ({
  logAudit: jest.fn(),
}))

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
    mockTransferFindMany.mockResolvedValue(mockRequests)

    const result = await getTransferRequests()

    expect(result).toEqual(mockRequests)
    expect(mockTransferFindMany).toHaveBeenCalledWith({
      where: undefined,
      with: {
        // displayName comes along so the staff queue can show a name rather
        // than a login code (RESIDENT_NAME_SELECT).
        resident: { columns: { id: true, code: true, displayName: true, supportLevel: true } },
        currentPlacement: {
          columns: { id: true },
          with: {
            housingUnit: { columns: { id: true, code: true, address: true } },
          },
        },
        targetUnit: { columns: { id: true, code: true, address: true } },
      },
      orderBy: [desc(transferRequest.createdAt)],
    })
  })

  it('filters by status when provided', async () => {
    mockTransferFindMany.mockResolvedValue([])

    await getTransferRequests('PENDING')

    expect(mockTransferFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: eq(transferRequest.status, 'PENDING'),
      }),
    )
  })

  it('returns empty array when no requests exist', async () => {
    mockTransferFindMany.mockResolvedValue([])

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
    mockTransferUpdate.mockResolvedValue([{ id: 'updated' }])

    const result = await approveTransferRequest(validInput)

    expect(result).toEqual({ success: true })

    expect(mockTransferUpdate).toHaveBeenCalledWith(
      {
        status: 'APPROVED',
        staffNotes: 'Genehmigt',
        reviewedBy: 'staff-1',
        reviewedAt: expect.any(Date),
      },
      and(eq(transferRequest.id, 'clxxxxxxxxxxxxxxxxx0001'), eq(transferRequest.status, 'PENDING')),
    )
  })

  it('calls logAudit with userId on approval', async () => {
    mockTransferUpdate.mockResolvedValue([{ id: 'updated' }])

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
    mockTransferUpdate.mockResolvedValue([])
    mockTransferFindFirst.mockResolvedValue(null)

    const result = await approveTransferRequest(validInput)

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_NOT_FOUND })
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('returns error when request has already been reviewed', async () => {
    mockTransferUpdate.mockResolvedValue([])
    mockTransferFindFirst.mockResolvedValue({
      id: 'clxxxxxxxxxxxxxxxxx0001',
    })

    const result = await approveTransferRequest(validInput)

    expect(result).toEqual({ success: false, error: 'Anfrage wurde bereits bearbeitet' })
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('returns generic error when prisma fails', async () => {
    mockTransferUpdate.mockRejectedValue(new Error('DB error'))

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
    mockTransferUpdate.mockResolvedValue([{ id: 'updated' }])

    const result = await denyTransferRequest(validInput)

    expect(result).toEqual({ success: true })

    expect(mockTransferUpdate).toHaveBeenCalledWith(
      {
        status: 'DENIED',
        staffNotes: 'Kein Platz verfügbar',
        reviewedBy: 'staff-1',
        reviewedAt: expect.any(Date),
      },
      and(eq(transferRequest.id, 'clxxxxxxxxxxxxxxxxx0002'), eq(transferRequest.status, 'PENDING')),
    )
  })

  it('calls logAudit with userId on denial', async () => {
    mockTransferUpdate.mockResolvedValue([{ id: 'updated' }])

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
    mockTransferUpdate.mockResolvedValue([])
    mockTransferFindFirst.mockResolvedValue(null)

    const result = await denyTransferRequest(validInput)

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_NOT_FOUND })
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('returns error when request has already been reviewed', async () => {
    mockTransferUpdate.mockResolvedValue([])
    mockTransferFindFirst.mockResolvedValue({
      id: 'clxxxxxxxxxxxxxxxxx0002',
    })

    const result = await denyTransferRequest(validInput)

    expect(result).toEqual({ success: false, error: 'Anfrage wurde bereits bearbeitet' })
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('returns generic error when prisma fails', async () => {
    mockTransferUpdate.mockRejectedValue(new Error('DB error'))

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

    await expect(approveTransferRequest({ requestId: 'clxxxxxxxxxxxxxxxxx0001' })).rejects.toThrow(
      'Anmeldung erforderlich',
    )
  })

  it('rejects unauthenticated deny requests', async () => {
    const { requireStaffAuth: mockRequireStaffAuth } = require('@/lib/auth')
    mockRequireStaffAuth.mockRejectedValueOnce(new Error('Anmeldung erforderlich'))

    await expect(denyTransferRequest({ requestId: 'clxxxxxxxxxxxxxxxxx0001' })).rejects.toThrow(
      'Anmeldung erforderlich',
    )
  })
})
