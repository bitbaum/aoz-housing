/**
 * Unit tests for resident server actions
 *
 * Tests exitResident, archiveResident, restoreResident, and hardDeleteResidentProtected.
 * createResident/updateResident use redirect() which throws, so they are not tested here.
 */

import { resident, placement } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { logAudit } from '@/lib/audit'
import {
  exitResident,
  archiveResident,
  restoreResident,
  hardDeleteResidentProtected,
} from '../residents'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// =============================================================================
// MOCKS
// =============================================================================

const mockResidentFindFirst = vi.fn()
// Receives (set payload, where expression) of a resident update.
const mockResidentUpdate = vi.fn()
// Receives (table, where expression) of db.$count; resolves the count.
const mockCount = vi.fn()
// Receives the where expression of db.delete(resident).where(where).
const mockResidentDelete = vi.fn()

vi.mock('@/lib/db', async () => ({
  ...(await vi.importActual<object>('@/lib/db')),
  db: {
    query: {
      resident: { findFirst: (...a: unknown[]) => mockResidentFindFirst(...a) },
    },
    update: vi.fn(() => ({
      set: (v: unknown) => ({
        where: (w: unknown) => ({
          then: (
            resolve: (value: unknown) => unknown,
            reject: (reason: unknown) => unknown,
          ): Promise<unknown> => Promise.resolve(mockResidentUpdate(v, w)).then(resolve, reject),
          returning: (): Promise<unknown[]> =>
            Promise.resolve(mockResidentUpdate(v, w)).then((row: unknown) => [row]),
        }),
      }),
    })),
    delete: vi.fn(() => ({
      where: (w: unknown): Promise<unknown> => Promise.resolve(mockResidentDelete(w)),
    })),
    $count: (...a: unknown[]) => mockCount(...a),
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

beforeEach(() => {
  vi.clearAllMocks()
})

// =============================================================================
// exitResident
// =============================================================================

describe('exitResident', () => {
  it('returns error when resident not found', async () => {
    mockResidentFindFirst.mockResolvedValue(null)

    const result = await exitResident('nonexistent-id')

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND })
    expect(mockResidentUpdate).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  it('returns error when resident has active placements', async () => {
    mockResidentFindFirst.mockResolvedValue({
      id: 'res-1',
      code: 'RES-001',
      placements: [{ id: 'pl-1', status: 'ACTIVE' }],
    })

    const result = await exitResident('res-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('aktive Platzierungen')
    expect(mockResidentUpdate).not.toHaveBeenCalled()
  })

  it('succeeds and updates status to EXITED when no active placements', async () => {
    mockResidentFindFirst.mockResolvedValue({
      id: 'res-1',
      code: 'RES-001',
      placements: [],
    })
    mockResidentUpdate.mockResolvedValue({ id: 'res-1', status: 'EXITED' })

    const result = await exitResident('res-1')

    expect(result).toEqual({ success: true })
    expect(mockResidentUpdate).toHaveBeenCalledWith({ status: 'EXITED' }, eq(resident.id, 'res-1'))
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'END',
        entity: 'RESIDENT',
        entityId: 'res-1',
        changes: { status: 'EXITED' },
      }),
    )
  })

  it('returns error when the db throws', async () => {
    mockResidentFindFirst.mockRejectedValue(new Error('DB error'))

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
    mockResidentFindFirst.mockResolvedValue(null)

    const result = await archiveResident('nonexistent-id')

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND })
  })

  it('returns error when resident has active placements', async () => {
    mockResidentFindFirst.mockResolvedValue({
      id: 'res-1',
      placements: [{ id: 'pl-1', status: 'ACTIVE' }],
    })

    const result = await archiveResident('res-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('aktive Platzierung')
  })

  it('succeeds and sets status to EXITED', async () => {
    mockResidentFindFirst.mockResolvedValue({
      id: 'res-1',
      placements: [],
    })
    mockResidentUpdate.mockResolvedValue({ id: 'res-1' })

    const result = await archiveResident('res-1')

    expect(result).toEqual({ success: true })
    expect(mockResidentUpdate).toHaveBeenCalledWith({ status: 'EXITED' }, eq(resident.id, 'res-1'))
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ARCHIVE',
        entity: 'RESIDENT',
        entityId: 'res-1',
      }),
    )
  })
})

// =============================================================================
// restoreResident
// =============================================================================

describe('restoreResident', () => {
  it('returns error when resident not found', async () => {
    mockResidentFindFirst.mockResolvedValue(null)

    const result = await restoreResident('nonexistent-id')

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND })
  })

  it('restores to ACTIVE when no active placements', async () => {
    mockResidentFindFirst.mockResolvedValue({
      id: 'res-1',
      placements: [],
    })
    mockResidentUpdate.mockResolvedValue({ id: 'res-1' })

    const result = await restoreResident('res-1')

    expect(result).toEqual({ success: true })
    expect(mockResidentUpdate).toHaveBeenCalledWith({ status: 'ACTIVE' }, eq(resident.id, 'res-1'))
  })

  it('restores to PLACED when resident has active placements', async () => {
    mockResidentFindFirst.mockResolvedValue({
      id: 'res-1',
      placements: [{ id: 'pl-1', status: 'ACTIVE' }],
    })
    mockResidentUpdate.mockResolvedValue({ id: 'res-1' })

    const result = await restoreResident('res-1')

    expect(result).toEqual({ success: true })
    expect(mockResidentUpdate).toHaveBeenCalledWith({ status: 'PLACED' }, eq(resident.id, 'res-1'))
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'RESTORE',
        entity: 'RESIDENT',
        entityId: 'res-1',
        changes: { status: 'PLACED' },
      }),
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
    expect(mockResidentFindFirst).not.toHaveBeenCalled()
  })

  it('returns error when reason is too short', async () => {
    const result = await hardDeleteResidentProtected('res-1', 'DELETE', 'short')

    expect(result.success).toBe(false)
    expect(result.error).toContain('mind. 10 Zeichen')
  })

  it('returns error when resident not found', async () => {
    mockResidentFindFirst.mockResolvedValue(null)

    const result = await hardDeleteResidentProtected('res-1', 'DELETE', 'Testdaten bereinigen')

    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND })
  })

  it('returns error when resident is not test/demo', async () => {
    mockResidentFindFirst.mockResolvedValue({
      id: 'res-1',
      code: 'RES-001',
    })

    const result = await hardDeleteResidentProtected('res-1', 'DELETE', 'Testdaten bereinigen')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Test-/Demo-Klient*innen')
  })

  it('returns error with blocker report when resident has linked history', async () => {
    mockResidentFindFirst.mockResolvedValue({
      id: 'res-1',
      code: 'test-resident-1',
    })
    // Two placements block the delete; every other linked table is empty.
    mockCount.mockImplementation(async (table: unknown) => (table === placement ? 2 : 0))

    const result = await hardDeleteResidentProtected('res-1', 'DELETE', 'Testdaten bereinigen')

    expect(result.success).toBe(false)
    expect(result.error).toContain('verknüpfte Historie')
    expect(result.blockerReport).toBeDefined()
    expect(result.blockerReport?.placements).toBe(2)
  })

  it('succeeds for test resident with no linked history', async () => {
    mockResidentFindFirst.mockResolvedValue({
      id: 'res-1',
      code: 'test-resident-1',
    })
    mockCount.mockResolvedValue(0)
    mockResidentDelete.mockResolvedValue({ id: 'res-1' })

    const result = await hardDeleteResidentProtected('res-1', 'DELETE', 'Testdaten bereinigen')

    expect(result).toEqual({ success: true })
    expect(mockResidentDelete).toHaveBeenCalledWith(eq(resident.id, 'res-1'))
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DELETE',
        entity: 'RESIDENT',
        entityId: 'res-1',
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

    await expect(exitResident('test-id')).rejects.toThrow('Anmeldung erforderlich')
  })
})
