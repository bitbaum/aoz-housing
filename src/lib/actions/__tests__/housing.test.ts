/**
 * Unit tests for housing server actions
 *
 * Tests archiveHousingUnit, restoreHousingUnit, and hardDeleteHousingUnitProtected.
 * createHousingUnit/updateHousingUnit use redirect() which throws, so they are not tested here.
 */

import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { archiveHousingUnit, restoreHousingUnit, hardDeleteHousingUnitProtected } from '../housing'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// =============================================================================
// MOCKS
// =============================================================================

jest.mock('@/lib/db', () => ({
  prisma: {
    housingUnit: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    placement: { count: jest.fn() },
    incident: { count: jest.fn() },
    maintenanceRequest: { count: jest.fn() },
    placementSpot: { count: jest.fn() },
    householdTask: { count: jest.fn() },
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
  requirePermission: jest.fn().mockResolvedValue({ id: 'staff-1', email: 'admin@test.com', name: 'Test Admin', role: 'ADMIN' as const }),
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
// archiveHousingUnit
// =============================================================================

describe('archiveHousingUnit', () => {
  it('returns error when housing unit not found', async () => {
    ;(mockPrisma.housingUnit.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await archiveHousingUnit('nonexistent-id')

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.UNIT_NOT_FOUND })
    expect(mockPrisma.housingUnit.update).not.toHaveBeenCalled()
  })

  it('returns error when unit has active placements', async () => {
    ;(mockPrisma.housingUnit.findUnique as jest.Mock).mockResolvedValue({
      id: 'hu-1',
      code: 'WG-001',
      placements: [{ id: 'pl-1' }],
      spots: [],
    })

    const result = await archiveHousingUnit('hu-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('aktive Belegung')
    expect(mockPrisma.housingUnit.update).not.toHaveBeenCalled()
  })

  it('returns error when unit has occupied spots', async () => {
    ;(mockPrisma.housingUnit.findUnique as jest.Mock).mockResolvedValue({
      id: 'hu-1',
      code: 'WG-001',
      placements: [],
      spots: [{ id: 'spot-1' }],
    })

    const result = await archiveHousingUnit('hu-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('aktive Belegung')
  })

  it('succeeds and sets status to CLOSED when no active occupancy', async () => {
    ;(mockPrisma.housingUnit.findUnique as jest.Mock).mockResolvedValue({
      id: 'hu-1',
      code: 'WG-001',
      placements: [],
      spots: [],
    })
    ;(mockPrisma.housingUnit.update as jest.Mock).mockResolvedValue({ id: 'hu-1' })

    const result = await archiveHousingUnit('hu-1')

    expect(result).toEqual({ success: true })
    expect(mockPrisma.housingUnit.update).toHaveBeenCalledWith({
      where: { id: 'hu-1' },
      data: { status: 'CLOSED' },
    })
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ARCHIVE',
        entity: 'HOUSING_UNIT',
        entityId: 'hu-1',
        changes: { status: 'CLOSED' },
      })
    )
  })
})

// =============================================================================
// restoreHousingUnit
// =============================================================================

describe('restoreHousingUnit', () => {
  it('returns error when housing unit not found', async () => {
    ;(mockPrisma.housingUnit.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await restoreHousingUnit('nonexistent-id')

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.UNIT_NOT_FOUND })
  })

  it('succeeds and sets status to AVAILABLE', async () => {
    ;(mockPrisma.housingUnit.findUnique as jest.Mock).mockResolvedValue({
      id: 'hu-1',
      code: 'WG-001',
      status: 'CLOSED',
    })
    ;(mockPrisma.housingUnit.update as jest.Mock).mockResolvedValue({ id: 'hu-1' })

    const result = await restoreHousingUnit('hu-1')

    expect(result).toEqual({ success: true })
    expect(mockPrisma.housingUnit.update).toHaveBeenCalledWith({
      where: { id: 'hu-1' },
      data: { status: 'AVAILABLE' },
    })
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'RESTORE',
        entity: 'HOUSING_UNIT',
        entityId: 'hu-1',
        changes: { status: 'AVAILABLE' },
      })
    )
  })
})

// =============================================================================
// hardDeleteHousingUnitProtected
// =============================================================================

describe('hardDeleteHousingUnitProtected', () => {
  it('returns error when confirmation is not DELETE', async () => {
    const result = await hardDeleteHousingUnitProtected('hu-1', 'WRONG', 'Test deletion reason here')

    expect(result).toEqual({ success: false, error: 'Bestätigung fehlt (DELETE)' })
    expect(mockPrisma.housingUnit.findUnique).not.toHaveBeenCalled()
  })

  it('returns error when reason is too short', async () => {
    const result = await hardDeleteHousingUnitProtected('hu-1', 'DELETE', 'short')

    expect(result.success).toBe(false)
    expect(result.error).toContain('mind. 10 Zeichen')
  })

  it('returns error when housing unit not found', async () => {
    ;(mockPrisma.housingUnit.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await hardDeleteHousingUnitProtected('hu-1', 'DELETE', 'Testdaten bereinigen')

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.UNIT_NOT_FOUND })
  })

  it('returns error when housing unit is not test/demo', async () => {
    ;(mockPrisma.housingUnit.findUnique as jest.Mock).mockResolvedValue({
      id: 'hu-1',
      code: 'WG-001',
    })

    const result = await hardDeleteHousingUnitProtected('hu-1', 'DELETE', 'Testdaten bereinigen')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Test-/Demo-Unterkünfte')
  })

  it('returns error with blocker report when unit has linked history', async () => {
    ;(mockPrisma.housingUnit.findUnique as jest.Mock).mockResolvedValue({
      id: 'hu-1',
      code: 'test-wg-1',
    })
    ;(mockPrisma.placement.count as jest.Mock).mockResolvedValue(3)
    ;(mockPrisma.incident.count as jest.Mock).mockResolvedValue(1)
    ;(mockPrisma.maintenanceRequest.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.placementSpot.count as jest.Mock).mockResolvedValue(4)
    ;(mockPrisma.householdTask.count as jest.Mock).mockResolvedValue(0)

    const result = await hardDeleteHousingUnitProtected('hu-1', 'DELETE', 'Testdaten bereinigen')

    expect(result.success).toBe(false)
    expect(result.error).toContain('verknüpfte Historie')
    expect(result.blockerReport).toBeDefined()
    expect(result.blockerReport?.placements).toBe(3)
    expect(result.blockerReport?.incidents).toBe(1)
    expect(result.blockerReport?.spots).toBe(4)
  })

  it('succeeds for test housing unit with no linked history', async () => {
    ;(mockPrisma.housingUnit.findUnique as jest.Mock).mockResolvedValue({
      id: 'hu-1',
      code: 'demo-wg-1',
    })
    ;(mockPrisma.placement.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.incident.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.maintenanceRequest.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.placementSpot.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.householdTask.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.housingUnit.delete as jest.Mock).mockResolvedValue({ id: 'hu-1' })

    const result = await hardDeleteHousingUnitProtected('hu-1', 'DELETE', 'Testdaten bereinigen')

    expect(result).toEqual({ success: true })
    expect(mockPrisma.housingUnit.delete).toHaveBeenCalledWith({ where: { id: 'hu-1' } })
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DELETE',
        entity: 'HOUSING_UNIT',
        entityId: 'hu-1',
      })
    )
  })
})

// =============================================================================
// auth guard
// =============================================================================

describe('auth guard', () => {
  it('rejects unauthenticated requests', async () => {
    const { requirePermission: mockRequirePermission } = require('@/lib/auth')
    mockRequirePermission.mockRejectedValueOnce(new Error('Anmeldung erforderlich'))

    await expect(archiveHousingUnit('test-id')).rejects.toThrow('Anmeldung erforderlich')
  })
})
