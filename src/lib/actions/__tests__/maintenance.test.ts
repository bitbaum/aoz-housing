/**
 * Unit tests for maintenance server actions
 *
 * Tests createMaintenanceRequest, updateMaintenanceStatus, assignMaintenanceRequest,
 * getMaintenanceStats, and getHousingUnitMaintenance.
 *
 * createMaintenanceRequest uses redirect() which throws, so we mock it to throw NEXT_REDIRECT.
 */

import { maintenanceRequest } from '@/lib/db'
import { desc, eq } from 'drizzle-orm'
import { logAudit } from '@/lib/audit'
import {
  createMaintenanceRequest,
  updateMaintenanceStatus,
  assignMaintenanceRequest,
  getMaintenanceStats,
  getHousingUnitMaintenance,
} from '../maintenance'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// =============================================================================
// MOCKS
// =============================================================================

const mockInsertReturning = vi.fn()
const mockUpdateReturning = vi.fn()
const mockUpdateWhere = vi.fn()
const mockCount = vi.fn()
const mockFindMany = vi.fn()

vi.mock('@/lib/db', async () => ({
  ...(await vi.importActual<object>('@/lib/db')),
  db: {
    insert: vi.fn(() => ({
      values: (v: unknown) => ({ returning: (): Promise<unknown[]> => mockInsertReturning(v) }),
    })),
    update: vi.fn(() => ({
      set: (v: unknown) => ({
        where: (w: unknown) => {
          mockUpdateWhere(w)
          return { returning: (): Promise<unknown[]> => mockUpdateReturning(v) }
        },
      }),
    })),
    $count: (...a: unknown[]) => mockCount(...a),
    query: {
      maintenanceRequest: { findMany: (...a: unknown[]) => mockFindMany(...a) },
    },
  },
}))

vi.mock('next/cache', async () => ({
  revalidatePath: vi.fn(),
}))

const mockRedirect = vi.fn()
vi.mock('next/navigation', async () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args)
    throw new Error('NEXT_REDIRECT')
  },
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

beforeEach(() => {
  vi.clearAllMocks()
})

// =============================================================================
// Helper to build FormData for createMaintenanceRequest
// =============================================================================

function makeCreateFormData(overrides: Record<string, string> = {}): FormData {
  const defaults: Record<string, string> = {
    housingUnitId: 'clxxxxxxxxxxxxxxxxx0001',
    category: 'PLUMBING',
    priority: 'NORMAL',
    title: 'Leaky faucet',
    description: 'Kitchen faucet is leaking',
  }
  const merged = { ...defaults, ...overrides }
  const fd = new FormData()
  for (const [key, value] of Object.entries(merged)) {
    if (value !== '') {
      fd.set(key, value)
    }
  }
  return fd
}

// =============================================================================
// Helper to build FormData for updateMaintenanceStatus
// =============================================================================

function makeStatusUpdateFormData(overrides: Record<string, string> = {}): FormData {
  const defaults: Record<string, string> = {
    requestId: 'clxxxxxxxxxxxxxxxxx0010',
    status: 'IN_PROGRESS',
  }
  const merged = { ...defaults, ...overrides }
  const fd = new FormData()
  for (const [key, value] of Object.entries(merged)) {
    if (value !== '') {
      fd.set(key, value)
    }
  }
  return fd
}

// =============================================================================
// Helper to build FormData for assignMaintenanceRequest
// =============================================================================

function makeAssignFormData(overrides: Record<string, string> = {}): FormData {
  const defaults: Record<string, string> = {
    requestId: 'clxxxxxxxxxxxxxxxxx0010',
    assignedTo: 'Hans Mueller',
  }
  const merged = { ...defaults, ...overrides }
  const fd = new FormData()
  for (const [key, value] of Object.entries(merged)) {
    if (value !== '') {
      fd.set(key, value)
    }
  }
  return fd
}

// =============================================================================
// createMaintenanceRequest
// =============================================================================

describe('createMaintenanceRequest', () => {
  it('throws validation error when required fields are missing', async () => {
    const fd = new FormData()
    // Missing all required fields

    await expect(createMaintenanceRequest(fd)).rejects.toThrow()
  })

  it('throws validation error when title is missing', async () => {
    const fd = makeCreateFormData({ title: '' })

    await expect(createMaintenanceRequest(fd)).rejects.toThrow()
  })

  it('throws validation error when description is missing', async () => {
    const fd = makeCreateFormData({ description: '' })

    await expect(createMaintenanceRequest(fd)).rejects.toThrow()
  })

  it('creates maintenance request and redirects on success', async () => {
    mockInsertReturning.mockResolvedValue([
      {
        id: 'mr-1',
        housingUnitId: 'clxxxxxxxxxxxxxxxxx0001',
      },
    ])

    await expect(createMaintenanceRequest(makeCreateFormData())).rejects.toThrow('NEXT_REDIRECT')

    expect(mockInsertReturning).toHaveBeenCalledWith(
      expect.objectContaining({
        housingUnitId: 'clxxxxxxxxxxxxxxxxx0001',
        category: 'PLUMBING',
        priority: 'NORMAL',
        title: 'Leaky faucet',
        description: 'Kitchen faucet is leaking',
        status: 'OPEN',
      }),
    )

    expect(logAudit).toHaveBeenCalledWith({
      action: 'CREATE',
      entity: 'MAINTENANCE',
      entityId: 'mr-1',
      userId: 'staff-1',
      changes: {
        category: 'PLUMBING',
        priority: 'NORMAL',
        title: 'Leaky faucet',
      },
    })

    expect(mockRedirect).toHaveBeenCalledWith('/maintenance')
  })

  it('creates request with optional fields when provided', async () => {
    mockInsertReturning.mockResolvedValue([
      {
        id: 'mr-2',
        housingUnitId: 'clxxxxxxxxxxxxxxxxx0001',
      },
    ])

    const fd = makeCreateFormData({
      spotId: 'clxxxxxxxxxxxxxxxxx0020',
      location: 'Kitchen',
      reporterName: 'Maria',
      reportedById: 'clxxxxxxxxxxxxxxxxx0030',
    })

    await expect(createMaintenanceRequest(fd)).rejects.toThrow('NEXT_REDIRECT')

    expect(mockInsertReturning).toHaveBeenCalledWith(
      expect.objectContaining({
        spotId: 'clxxxxxxxxxxxxxxxxx0020',
        location: 'Kitchen',
        reporterName: 'Maria',
        reportedById: 'clxxxxxxxxxxxxxxxxx0030',
      }),
    )
  })

  it('throws user-facing error when the insert fails', async () => {
    mockInsertReturning.mockRejectedValue(new Error('DB error'))

    await expect(createMaintenanceRequest(makeCreateFormData())).rejects.toThrow(
      ERROR_MESSAGES.MAINTENANCE_CREATE_ERROR,
    )
  })
})

// =============================================================================
// updateMaintenanceStatus
// =============================================================================

describe('updateMaintenanceStatus', () => {
  it('throws validation error when requestId is missing', async () => {
    const fd = makeStatusUpdateFormData({ requestId: '' })

    await expect(updateMaintenanceStatus(fd)).rejects.toThrow()
  })

  it('updates status to IN_PROGRESS', async () => {
    mockUpdateReturning.mockResolvedValue([{ housingUnitId: 'hu-1' }])

    await updateMaintenanceStatus(makeStatusUpdateFormData())

    expect(mockUpdateWhere).toHaveBeenCalledWith(
      eq(maintenanceRequest.id, 'clxxxxxxxxxxxxxxxxx0010'),
    )
    expect(mockUpdateReturning).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'IN_PROGRESS',
        startedAt: expect.any(Date),
      }),
    )

    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE',
        entity: 'MAINTENANCE',
        entityId: 'clxxxxxxxxxxxxxxxxx0010',
        changes: expect.objectContaining({ status: 'IN_PROGRESS' }),
      }),
    )
  })

  it('updates status to COMPLETED with resolution and cost', async () => {
    mockUpdateReturning.mockResolvedValue([{ housingUnitId: 'hu-1' }])

    const fd = makeStatusUpdateFormData({
      status: 'COMPLETED',
      resolution: 'Fixed the pipe',
      cost: '150',
    })

    await updateMaintenanceStatus(fd)

    expect(mockUpdateWhere).toHaveBeenCalledWith(
      eq(maintenanceRequest.id, 'clxxxxxxxxxxxxxxxxx0010'),
    )
    expect(mockUpdateReturning).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'COMPLETED',
        completedAt: expect.any(Date),
        resolution: 'Fixed the pipe',
        cost: 150,
      }),
    )
  })

  it('updates status to ASSIGNED with assignedTo', async () => {
    mockUpdateReturning.mockResolvedValue([{ housingUnitId: 'hu-1' }])

    const fd = makeStatusUpdateFormData({
      status: 'ASSIGNED',
      assignedTo: 'Hans Mueller',
    })

    await updateMaintenanceStatus(fd)

    expect(mockUpdateWhere).toHaveBeenCalledWith(
      eq(maintenanceRequest.id, 'clxxxxxxxxxxxxxxxxx0010'),
    )
    expect(mockUpdateReturning).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ASSIGNED',
        assignedTo: 'Hans Mueller',
        assignedAt: expect.any(Date),
      }),
    )
  })

  it('includes notes when provided', async () => {
    mockUpdateReturning.mockResolvedValue([{ housingUnitId: 'hu-1' }])

    const fd = makeStatusUpdateFormData({
      notes: 'Waiting for parts',
      status: 'ON_HOLD',
    })

    await updateMaintenanceStatus(fd)

    expect(mockUpdateWhere).toHaveBeenCalledWith(
      eq(maintenanceRequest.id, 'clxxxxxxxxxxxxxxxxx0010'),
    )
    expect(mockUpdateReturning).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ON_HOLD',
        notes: 'Waiting for parts',
      }),
    )
  })

  it('throws user-facing error when the update fails', async () => {
    mockUpdateReturning.mockRejectedValue(new Error('DB error'))

    await expect(updateMaintenanceStatus(makeStatusUpdateFormData())).rejects.toThrow(
      ERROR_MESSAGES.MAINTENANCE_STATUS_UPDATE_ERROR,
    )
  })
})

// =============================================================================
// assignMaintenanceRequest
// =============================================================================

describe('assignMaintenanceRequest', () => {
  it('throws validation error when assignedTo is missing', async () => {
    const fd = makeAssignFormData({ assignedTo: '' })

    await expect(assignMaintenanceRequest(fd)).rejects.toThrow()
  })

  it('assigns request and sets status to ASSIGNED', async () => {
    mockUpdateReturning.mockResolvedValue([{ housingUnitId: 'hu-1' }])

    await assignMaintenanceRequest(makeAssignFormData())

    expect(mockUpdateWhere).toHaveBeenCalledWith(
      eq(maintenanceRequest.id, 'clxxxxxxxxxxxxxxxxx0010'),
    )
    expect(mockUpdateReturning).toHaveBeenCalledWith({
      status: 'ASSIGNED',
      assignedTo: 'Hans Mueller',
      assignedAt: expect.any(Date),
    })

    expect(logAudit).toHaveBeenCalledWith({
      action: 'UPDATE',
      entity: 'MAINTENANCE',
      entityId: 'clxxxxxxxxxxxxxxxxx0010',
      userId: 'staff-1',
      changes: { status: 'ASSIGNED', assignedTo: 'Hans Mueller' },
    })
  })

  it('throws user-facing error when the update fails', async () => {
    mockUpdateReturning.mockRejectedValue(new Error('DB error'))

    await expect(assignMaintenanceRequest(makeAssignFormData())).rejects.toThrow(
      ERROR_MESSAGES.MAINTENANCE_ASSIGN_ERROR,
    )
  })
})

// =============================================================================
// getMaintenanceStats
// =============================================================================

describe('getMaintenanceStats', () => {
  it('returns correct stats from db counts', async () => {
    // Mock the Promise.all counts: open, assigned, inProgress, onHold, completedThisMonth
    mockCount
      .mockResolvedValueOnce(5) // open
      .mockResolvedValueOnce(3) // assigned
      .mockResolvedValueOnce(2) // inProgress
      .mockResolvedValueOnce(1) // onHold
      .mockResolvedValueOnce(8) // completedThisMonth
      .mockResolvedValueOnce(2) // urgent

    const stats = await getMaintenanceStats()

    expect(stats).toEqual({
      open: 5,
      assigned: 3,
      inProgress: 2,
      onHold: 1,
      completedThisMonth: 8,
      urgent: 2,
      active: 11, // 5 + 3 + 2 + 1
    })
  })

  it('returns zeros when no requests exist', async () => {
    mockCount.mockResolvedValue(0)

    const stats = await getMaintenanceStats()

    expect(stats).toEqual({
      open: 0,
      assigned: 0,
      inProgress: 0,
      onHold: 0,
      completedThisMonth: 0,
      urgent: 0,
      active: 0,
    })
  })
})

// =============================================================================
// getHousingUnitMaintenance
// =============================================================================

describe('getHousingUnitMaintenance', () => {
  it('returns maintenance requests for a housing unit', async () => {
    const mockRequests = [
      { id: 'mr-1', title: 'Leaky faucet', status: 'OPEN' },
      { id: 'mr-2', title: 'Broken window', status: 'COMPLETED' },
    ]
    mockFindMany.mockResolvedValue(mockRequests)

    const result = await getHousingUnitMaintenance('hu-1')

    expect(result).toEqual(mockRequests)
    expect(mockFindMany).toHaveBeenCalledWith({
      where: eq(maintenanceRequest.housingUnitId, 'hu-1'),
      with: {
        spot: true,
        reportedBy: { columns: { id: true, code: true } },
      },
      orderBy: [desc(maintenanceRequest.createdAt)],
      limit: 20,
    })
  })

  it('returns empty array when no requests exist', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await getHousingUnitMaintenance('hu-1')

    expect(result).toEqual([])
  })
})

// =============================================================================
// auth guard
// =============================================================================

describe('auth guard', () => {
  /**
   * These asked only "is anyone signed in?", because that is all the actions
   * checked: `requireStaffAuth()`. Meanwhile the nav gated the board on
   * `maintenance:read`, so the permission was real to the menu and invisible
   * to the server. Verified in production on 2026-08-31 that a
   * Sozialarbeiter*in — holding neither maintenance permission — was served
   * the board and offered every one of these buttons.
   *
   * So the assertion is now on WHICH permission, not merely that some check
   * happened. A guard that any signed-in person passes is not a guard.
   */
  it('rejects a caller who lacks the permission', async () => {
    const { requirePermission: mockRequirePermission } = vi.mocked(await import('@/lib/auth'))
    mockRequirePermission.mockRejectedValueOnce(new Error('Keine Berechtigung'))

    const fd = new FormData()
    await expect(createMaintenanceRequest(fd)).rejects.toThrow('Keine Berechtigung')
  })

  it.each([
    [
      'createMaintenanceRequest',
      () => createMaintenanceRequest(new FormData()),
      'maintenance:write',
    ],
    ['getMaintenanceStats', () => getMaintenanceStats(), 'maintenance:read'],
    ['getHousingUnitMaintenance', () => getHousingUnitMaintenance('hu-1'), 'maintenance:read'],
  ])('%s demands %s', async (_name, call, permission) => {
    const { requirePermission: mockRequirePermission } = vi.mocked(await import('@/lib/auth'))
    mockRequirePermission.mockClear()

    await call().catch(() => {
      // The action may still fail on validation or a missing mock — irrelevant
      // here. What matters is which permission it asked for before doing so.
    })

    expect(mockRequirePermission).toHaveBeenCalledWith(permission)
  })
})
