/**
 * Unit tests for housing server actions
 *
 * Tests archiveHousingUnit, restoreHousingUnit, and hardDeleteHousingUnitProtected.
 * createHousingUnit/updateHousingUnit use redirect() which throws, so they are not tested here.
 */

import { getTableName } from 'drizzle-orm'
import { placement, incident, maintenanceRequest, placementSpot, householdTask } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { archiveHousingUnit, restoreHousingUnit, hardDeleteHousingUnitProtected } from '../housing'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// =============================================================================
// MOCKS
// =============================================================================

const mockHousingUnitFindFirst = vi.fn()
const mockUpdateSet = vi.fn()
const mockDelete = vi.fn()
const mockCount = vi.fn()

vi.mock('@/lib/db', async () => ({
  ...(await vi.importActual<object>('@/lib/db')),
  db: {
    query: {
      housingUnit: { findFirst: (...a: unknown[]) => mockHousingUnitFindFirst(...a) },
    },
    update: vi.fn(() => ({
      set: (v: unknown) => {
        mockUpdateSet(v)
        return {
          where: () =>
            Object.assign(Promise.resolve([]), {
              returning: (): Promise<unknown[]> => Promise.resolve([{ id: 'hu-1' }]),
            }),
        }
      },
    })),
    delete: vi.fn(() => ({ where: (w: unknown) => mockDelete(w) })),
    $count: (table: unknown, where: unknown) => mockCount(table, where),
  },
}))

vi.mock('next/cache', async () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', async () => ({
  redirect: vi.fn(),
}))

vi.mock('@/lib/audit', async () => ({
  logAudit: vi.fn(),
}))

const mockStaffUser = {
  id: 'staff-1',
  email: 'admin@test.com',
  name: 'Test Admin',
  role: 'ADMIN' as const,
}

vi.mock('@/lib/auth', async () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    id: 'staff-1',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'ADMIN' as const,
  }),
  requireStaffAuth: vi.fn().mockResolvedValue({
    id: 'staff-1',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'ADMIN' as const,
  }),
  requirePermission: vi.fn().mockResolvedValue({
    id: 'staff-1',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'ADMIN' as const,
  }),
}))

vi.mock('@/lib/logger', async () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    errorWithCause: vi.fn(),
  },
}))

/** Route db.$count(table, where) by table, like the old per-model count mocks. */
function mockCountsByTable(counts: Record<string, number>) {
  mockCount.mockImplementation((table: unknown) =>
    Promise.resolve(counts[getTableName(table as any)] ?? 0),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDelete.mockResolvedValue(undefined)
})

// =============================================================================
// archiveHousingUnit
// =============================================================================

describe('archiveHousingUnit', () => {
  it('returns error when housing unit not found', async () => {
    mockHousingUnitFindFirst.mockResolvedValue(null)

    const result = await archiveHousingUnit('nonexistent-id')

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.UNIT_NOT_FOUND })
    expect(mockUpdateSet).not.toHaveBeenCalled()
  })

  it('returns error when unit has active placements', async () => {
    mockHousingUnitFindFirst.mockResolvedValue({
      id: 'hu-1',
      code: 'WG-001',
      placements: [{ id: 'pl-1' }],
      spots: [],
    })

    const result = await archiveHousingUnit('hu-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('aktive Belegung')
    expect(mockUpdateSet).not.toHaveBeenCalled()
  })

  it('returns error when unit has occupied spots', async () => {
    mockHousingUnitFindFirst.mockResolvedValue({
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
    mockHousingUnitFindFirst.mockResolvedValue({
      id: 'hu-1',
      code: 'WG-001',
      placements: [],
      spots: [],
    })

    const result = await archiveHousingUnit('hu-1')

    expect(result).toEqual({ success: true })
    expect(mockUpdateSet).toHaveBeenCalledWith({ status: 'CLOSED' })
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ARCHIVE',
        entity: 'HOUSING_UNIT',
        entityId: 'hu-1',
        changes: { status: 'CLOSED' },
      }),
    )
  })
})

// =============================================================================
// restoreHousingUnit
// =============================================================================

describe('restoreHousingUnit', () => {
  it('returns error when housing unit not found', async () => {
    mockHousingUnitFindFirst.mockResolvedValue(null)

    const result = await restoreHousingUnit('nonexistent-id')

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.UNIT_NOT_FOUND })
  })

  it('succeeds and sets status to AVAILABLE', async () => {
    mockHousingUnitFindFirst.mockResolvedValue({
      id: 'hu-1',
      code: 'WG-001',
      status: 'CLOSED',
    })

    const result = await restoreHousingUnit('hu-1')

    expect(result).toEqual({ success: true })
    expect(mockUpdateSet).toHaveBeenCalledWith({ status: 'AVAILABLE' })
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'RESTORE',
        entity: 'HOUSING_UNIT',
        entityId: 'hu-1',
        changes: { status: 'AVAILABLE' },
      }),
    )
  })
})

// =============================================================================
// hardDeleteHousingUnitProtected
// =============================================================================

describe('hardDeleteHousingUnitProtected', () => {
  it('returns error when confirmation is not DELETE', async () => {
    const result = await hardDeleteHousingUnitProtected(
      'hu-1',
      'WRONG',
      'Test deletion reason here',
    )

    expect(result).toEqual({ success: false, error: 'Bestätigung fehlt (DELETE)' })
    expect(mockHousingUnitFindFirst).not.toHaveBeenCalled()
  })

  it('returns error when reason is too short', async () => {
    const result = await hardDeleteHousingUnitProtected('hu-1', 'DELETE', 'short')

    expect(result.success).toBe(false)
    expect(result.error).toContain('mind. 10 Zeichen')
  })

  it('returns error when housing unit not found', async () => {
    mockHousingUnitFindFirst.mockResolvedValue(null)

    const result = await hardDeleteHousingUnitProtected('hu-1', 'DELETE', 'Testdaten bereinigen')

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.UNIT_NOT_FOUND })
  })

  it('returns error when housing unit is not test/demo', async () => {
    mockHousingUnitFindFirst.mockResolvedValue({
      id: 'hu-1',
      code: 'WG-001',
    })

    const result = await hardDeleteHousingUnitProtected('hu-1', 'DELETE', 'Testdaten bereinigen')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Test-/Demo-Unterkünfte')
  })

  it('returns error with blocker report when unit has linked history', async () => {
    mockHousingUnitFindFirst.mockResolvedValue({
      id: 'hu-1',
      code: 'test-wg-1',
    })
    mockCountsByTable({
      [getTableName(placement)]: 3,
      [getTableName(incident)]: 1,
      [getTableName(maintenanceRequest)]: 0,
      [getTableName(placementSpot)]: 4,
      [getTableName(householdTask)]: 0,
    })

    const result = await hardDeleteHousingUnitProtected('hu-1', 'DELETE', 'Testdaten bereinigen')

    expect(result.success).toBe(false)
    expect(result.error).toContain('verknüpfte Historie')
    expect(result.blockerReport).toBeDefined()
    expect(result.blockerReport?.placements).toBe(3)
    expect(result.blockerReport?.incidents).toBe(1)
    expect(result.blockerReport?.spots).toBe(4)
  })

  it('succeeds for test housing unit with no linked history', async () => {
    mockHousingUnitFindFirst.mockResolvedValue({
      id: 'hu-1',
      code: 'demo-wg-1',
    })
    mockCountsByTable({})

    const result = await hardDeleteHousingUnitProtected('hu-1', 'DELETE', 'Testdaten bereinigen')

    expect(result).toEqual({ success: true })
    expect(mockDelete).toHaveBeenCalledTimes(1)
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DELETE',
        entity: 'HOUSING_UNIT',
        entityId: 'hu-1',
      }),
    )
  })
})

// =============================================================================
// auth guard
// =============================================================================

describe('auth guard', () => {
  it('rejects unauthenticated requests', async () => {
    const { requirePermission: mockRequirePermission } = vi.mocked(await import('@/lib/auth'))
    mockRequirePermission.mockRejectedValueOnce(new Error('Anmeldung erforderlich'))

    await expect(archiveHousingUnit('test-id')).rejects.toThrow('Anmeldung erforderlich')
  })
})
