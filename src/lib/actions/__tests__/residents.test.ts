/**
 * Unit tests for resident server actions
 *
 * Tests exitResident, archiveResident, restoreResident, and hardDeleteResidentProtected.
 * createResident/updateResident use redirect() which throws, so they are not tested here.
 */

import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { exitResident, archiveResident, restoreResident, hardDeleteResidentProtected } from '../residents'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// =============================================================================
// MOCKS
// =============================================================================

jest.mock('@/lib/db', () => ({
  prisma: {
    resident: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    placement: { count: jest.fn() },
    incident: { count: jest.fn() },
    incidentInvolvement: { count: jest.fn() },
    maintenanceRequest: { count: jest.fn() },
    compatibilityAssessment: { count: jest.fn() },
    auditLog: { create: jest.fn() },
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

const mockStaffUser = { id: 'staff-1', email: 'admin@test.com', name: 'Test Admin', role: 'ADMIN' as const }

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
// exitResident
// =============================================================================

describe('exitResident', () => {
  it('returns error when resident not found', async () => {
    ;(mockPrisma.resident.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await exitResident('nonexistent-id')

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND })
    expect(mockPrisma.resident.update).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('returns error when resident has active placements', async () => {
    ;(mockPrisma.resident.findUnique as jest.Mock).mockResolvedValue({
      id: 'res-1',
      code: 'RES-001',
      placements: [{ id: 'pl-1', status: 'ACTIVE' }],
    })

    const result = await exitResident('res-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('aktive Platzierungen')
    expect(mockPrisma.resident.update).not.toHaveBeenCalled()
  })

  it('succeeds and updates status to EXITED when no active placements', async () => {
    ;(mockPrisma.resident.findUnique as jest.Mock).mockResolvedValue({
      id: 'res-1',
      code: 'RES-001',
      placements: [],
    })
    ;(mockPrisma.resident.update as jest.Mock).mockResolvedValue({ id: 'res-1', status: 'EXITED' })

    const result = await exitResident('res-1')

    expect(result).toEqual({ success: true })
    expect(mockPrisma.resident.update).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      data: { status: 'EXITED' },
    })
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'END',
        entity: 'RESIDENT',
        entityId: 'res-1',
        changes: { status: 'EXITED' },
      })
    )
  })

  it('returns error when prisma throws', async () => {
    ;(mockPrisma.resident.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'))

    const result = await exitResident('res-1')

    expect(result.success).toBe(false)
    expect(result.error).toBe(ERROR_MESSAGES.RESIDENT_UPDATE_ERROR)
  })
})

// =============================================================================
// archiveResident
// =============================================================================

describe('archiveResident', () => {
  it('returns error when resident not found', async () => {
    ;(mockPrisma.resident.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await archiveResident('nonexistent-id')

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND })
  })

  it('returns error when resident has active placements', async () => {
    ;(mockPrisma.resident.findUnique as jest.Mock).mockResolvedValue({
      id: 'res-1',
      placements: [{ id: 'pl-1', status: 'ACTIVE' }],
    })

    const result = await archiveResident('res-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('aktive Platzierung')
  })

  it('succeeds and sets status to EXITED', async () => {
    ;(mockPrisma.resident.findUnique as jest.Mock).mockResolvedValue({
      id: 'res-1',
      placements: [],
    })
    ;(mockPrisma.resident.update as jest.Mock).mockResolvedValue({ id: 'res-1' })

    const result = await archiveResident('res-1')

    expect(result).toEqual({ success: true })
    expect(mockPrisma.resident.update).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      data: { status: 'EXITED' },
    })
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ARCHIVE',
        entity: 'RESIDENT',
        entityId: 'res-1',
      })
    )
  })
})

// =============================================================================
// restoreResident
// =============================================================================

describe('restoreResident', () => {
  it('returns error when resident not found', async () => {
    ;(mockPrisma.resident.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await restoreResident('nonexistent-id')

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND })
  })

  it('restores to ACTIVE when no active placements', async () => {
    ;(mockPrisma.resident.findUnique as jest.Mock).mockResolvedValue({
      id: 'res-1',
      placements: [],
    })
    ;(mockPrisma.resident.update as jest.Mock).mockResolvedValue({ id: 'res-1' })

    const result = await restoreResident('res-1')

    expect(result).toEqual({ success: true })
    expect(mockPrisma.resident.update).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      data: { status: 'ACTIVE' },
    })
  })

  it('restores to PLACED when resident has active placements', async () => {
    ;(mockPrisma.resident.findUnique as jest.Mock).mockResolvedValue({
      id: 'res-1',
      placements: [{ id: 'pl-1', status: 'ACTIVE' }],
    })
    ;(mockPrisma.resident.update as jest.Mock).mockResolvedValue({ id: 'res-1' })

    const result = await restoreResident('res-1')

    expect(result).toEqual({ success: true })
    expect(mockPrisma.resident.update).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      data: { status: 'PLACED' },
    })
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'RESTORE',
        entity: 'RESIDENT',
        entityId: 'res-1',
        changes: { status: 'PLACED' },
      })
    )
  })
})

// =============================================================================
// hardDeleteResidentProtected
// =============================================================================

describe('hardDeleteResidentProtected', () => {
  it('returns error when confirmation is not DELETE', async () => {
    const result = await hardDeleteResidentProtected('res-1', 'WRONG', 'Test deletion reason here')

    expect(result).toEqual({ success: false, error: 'Bestätigung fehlt (DELETE)' })
    expect(mockPrisma.resident.findUnique).not.toHaveBeenCalled()
  })

  it('returns error when reason is too short', async () => {
    const result = await hardDeleteResidentProtected('res-1', 'DELETE', 'short')

    expect(result.success).toBe(false)
    expect(result.error).toContain('mind. 10 Zeichen')
  })

  it('returns error when resident not found', async () => {
    ;(mockPrisma.resident.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await hardDeleteResidentProtected('res-1', 'DELETE', 'Testdaten bereinigen')

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND })
  })

  it('returns error when resident is not test/demo', async () => {
    ;(mockPrisma.resident.findUnique as jest.Mock).mockResolvedValue({
      id: 'res-1',
      code: 'RES-001',
    })

    const result = await hardDeleteResidentProtected('res-1', 'DELETE', 'Testdaten bereinigen')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Test-/Demo-Bewohner')
  })

  it('returns error with blocker report when resident has linked history', async () => {
    ;(mockPrisma.resident.findUnique as jest.Mock).mockResolvedValue({
      id: 'res-1',
      code: 'test-resident-1',
    })
    ;(mockPrisma.placement.count as jest.Mock).mockResolvedValue(2)
    ;(mockPrisma.incident.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.incidentInvolvement.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.maintenanceRequest.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.compatibilityAssessment.count as jest.Mock).mockResolvedValue(0)

    const result = await hardDeleteResidentProtected('res-1', 'DELETE', 'Testdaten bereinigen')

    expect(result.success).toBe(false)
    expect(result.error).toContain('verknüpfte Historie')
    expect(result.blockerReport).toBeDefined()
    expect(result.blockerReport?.placements).toBe(2)
  })

  it('succeeds for test resident with no linked history', async () => {
    ;(mockPrisma.resident.findUnique as jest.Mock).mockResolvedValue({
      id: 'res-1',
      code: 'test-resident-1',
    })
    ;(mockPrisma.placement.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.incident.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.incidentInvolvement.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.maintenanceRequest.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.compatibilityAssessment.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.resident.delete as jest.Mock).mockResolvedValue({ id: 'res-1' })

    const result = await hardDeleteResidentProtected('res-1', 'DELETE', 'Testdaten bereinigen')

    expect(result).toEqual({ success: true })
    expect(mockPrisma.resident.delete).toHaveBeenCalledWith({ where: { id: 'res-1' } })
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DELETE',
        entity: 'RESIDENT',
        entityId: 'res-1',
      })
    )
  })
})

// =============================================================================
// auth guard
// =============================================================================

describe('auth guard', () => {
  it('rejects unauthenticated requests', async () => {
    const { requireStaffAuth: mockRequireStaffAuth } = require('@/lib/auth')
    mockRequireStaffAuth.mockRejectedValueOnce(new Error('Anmeldung erforderlich'))

    await expect(exitResident('test-id')).rejects.toThrow('Anmeldung erforderlich')
  })
})
