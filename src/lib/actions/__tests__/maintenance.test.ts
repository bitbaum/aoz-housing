/**
 * Unit tests for maintenance server actions
 *
 * Tests createMaintenanceRequest, updateMaintenanceStatus, assignMaintenanceRequest,
 * getMaintenanceStats, and getHousingUnitMaintenance.
 *
 * createMaintenanceRequest uses redirect() which throws, so we mock it to throw NEXT_REDIRECT.
 */

import { prisma } from '@/lib/db'
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

jest.mock('@/lib/db', () => ({
  prisma: {
    maintenanceRequest: {
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

const mockRedirect = jest.fn()
jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args)
    throw new Error('NEXT_REDIRECT')
  },
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
  getCurrentUser: jest
    .fn()
    .mockResolvedValue({
      id: 'staff-1',
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'ADMIN' as const,
    }),
  requireStaffAuth: jest
    .fn()
    .mockResolvedValue({
      id: 'staff-1',
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'ADMIN' as const,
    }),
  requirePermission: jest
    .fn()
    .mockResolvedValue({
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

const mockPrisma = prisma as jest.Mocked<typeof prisma>

beforeEach(() => {
  jest.clearAllMocks()
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
    ;(mockPrisma.maintenanceRequest.create as jest.Mock).mockResolvedValue({
      id: 'mr-1',
      housingUnitId: 'clxxxxxxxxxxxxxxxxx0001',
    })

    await expect(createMaintenanceRequest(makeCreateFormData())).rejects.toThrow('NEXT_REDIRECT')

    expect(mockPrisma.maintenanceRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        housingUnitId: 'clxxxxxxxxxxxxxxxxx0001',
        category: 'PLUMBING',
        priority: 'NORMAL',
        title: 'Leaky faucet',
        description: 'Kitchen faucet is leaking',
        status: 'OPEN',
      }),
    })

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
    ;(mockPrisma.maintenanceRequest.create as jest.Mock).mockResolvedValue({
      id: 'mr-2',
      housingUnitId: 'clxxxxxxxxxxxxxxxxx0001',
    })

    const fd = makeCreateFormData({
      spotId: 'clxxxxxxxxxxxxxxxxx0020',
      location: 'Kitchen',
      reporterName: 'Maria',
      reportedById: 'clxxxxxxxxxxxxxxxxx0030',
    })

    await expect(createMaintenanceRequest(fd)).rejects.toThrow('NEXT_REDIRECT')

    expect(mockPrisma.maintenanceRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        spotId: 'clxxxxxxxxxxxxxxxxx0020',
        location: 'Kitchen',
        reporterName: 'Maria',
        reportedById: 'clxxxxxxxxxxxxxxxxx0030',
      }),
    })
  })

  it('throws user-facing error when prisma fails', async () => {
    ;(mockPrisma.maintenanceRequest.create as jest.Mock).mockRejectedValue(new Error('DB error'))

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
    ;(mockPrisma.maintenanceRequest.update as jest.Mock).mockResolvedValue({
      housingUnitId: 'hu-1',
    })

    await updateMaintenanceStatus(makeStatusUpdateFormData())

    expect(mockPrisma.maintenanceRequest.update).toHaveBeenCalledWith({
      where: { id: 'clxxxxxxxxxxxxxxxxx0010' },
      data: expect.objectContaining({
        status: 'IN_PROGRESS',
        startedAt: expect.any(Date),
      }),
      select: { housingUnitId: true },
    })

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
    ;(mockPrisma.maintenanceRequest.update as jest.Mock).mockResolvedValue({
      housingUnitId: 'hu-1',
    })

    const fd = makeStatusUpdateFormData({
      status: 'COMPLETED',
      resolution: 'Fixed the pipe',
      cost: '150',
    })

    await updateMaintenanceStatus(fd)

    expect(mockPrisma.maintenanceRequest.update).toHaveBeenCalledWith({
      where: { id: 'clxxxxxxxxxxxxxxxxx0010' },
      data: expect.objectContaining({
        status: 'COMPLETED',
        completedAt: expect.any(Date),
        resolution: 'Fixed the pipe',
        cost: 150,
      }),
      select: { housingUnitId: true },
    })
  })

  it('updates status to ASSIGNED with assignedTo', async () => {
    ;(mockPrisma.maintenanceRequest.update as jest.Mock).mockResolvedValue({
      housingUnitId: 'hu-1',
    })

    const fd = makeStatusUpdateFormData({
      status: 'ASSIGNED',
      assignedTo: 'Hans Mueller',
    })

    await updateMaintenanceStatus(fd)

    expect(mockPrisma.maintenanceRequest.update).toHaveBeenCalledWith({
      where: { id: 'clxxxxxxxxxxxxxxxxx0010' },
      data: expect.objectContaining({
        status: 'ASSIGNED',
        assignedTo: 'Hans Mueller',
        assignedAt: expect.any(Date),
      }),
      select: { housingUnitId: true },
    })
  })

  it('includes notes when provided', async () => {
    ;(mockPrisma.maintenanceRequest.update as jest.Mock).mockResolvedValue({
      housingUnitId: 'hu-1',
    })

    const fd = makeStatusUpdateFormData({
      notes: 'Waiting for parts',
      status: 'ON_HOLD',
    })

    await updateMaintenanceStatus(fd)

    expect(mockPrisma.maintenanceRequest.update).toHaveBeenCalledWith({
      where: { id: 'clxxxxxxxxxxxxxxxxx0010' },
      data: expect.objectContaining({
        status: 'ON_HOLD',
        notes: 'Waiting for parts',
      }),
      select: { housingUnitId: true },
    })
  })

  it('throws user-facing error when prisma fails', async () => {
    ;(mockPrisma.maintenanceRequest.update as jest.Mock).mockRejectedValue(new Error('DB error'))

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
    ;(mockPrisma.maintenanceRequest.update as jest.Mock).mockResolvedValue({
      housingUnitId: 'hu-1',
    })

    await assignMaintenanceRequest(makeAssignFormData())

    expect(mockPrisma.maintenanceRequest.update).toHaveBeenCalledWith({
      where: { id: 'clxxxxxxxxxxxxxxxxx0010' },
      data: {
        status: 'ASSIGNED',
        assignedTo: 'Hans Mueller',
        assignedAt: expect.any(Date),
      },
      select: { housingUnitId: true },
    })

    expect(logAudit).toHaveBeenCalledWith({
      action: 'UPDATE',
      entity: 'MAINTENANCE',
      entityId: 'clxxxxxxxxxxxxxxxxx0010',
      userId: 'staff-1',
      changes: { status: 'ASSIGNED', assignedTo: 'Hans Mueller' },
    })
  })

  it('throws user-facing error when prisma fails', async () => {
    ;(mockPrisma.maintenanceRequest.update as jest.Mock).mockRejectedValue(new Error('DB error'))

    await expect(assignMaintenanceRequest(makeAssignFormData())).rejects.toThrow(
      ERROR_MESSAGES.MAINTENANCE_ASSIGN_ERROR,
    )
  })
})

// =============================================================================
// getMaintenanceStats
// =============================================================================

describe('getMaintenanceStats', () => {
  it('returns correct stats from prisma counts', async () => {
    // Mock the Promise.all counts: open, assigned, inProgress, onHold, completedThisMonth
    ;(mockPrisma.maintenanceRequest.count as jest.Mock)
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
    ;(mockPrisma.maintenanceRequest.count as jest.Mock).mockResolvedValue(0)

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
    ;(mockPrisma.maintenanceRequest.findMany as jest.Mock).mockResolvedValue(mockRequests)

    const result = await getHousingUnitMaintenance('hu-1')

    expect(result).toEqual(mockRequests)
    expect(mockPrisma.maintenanceRequest.findMany).toHaveBeenCalledWith({
      where: { housingUnitId: 'hu-1' },
      include: {
        spot: true,
        reportedBy: { select: { id: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  })

  it('returns empty array when no requests exist', async () => {
    ;(mockPrisma.maintenanceRequest.findMany as jest.Mock).mockResolvedValue([])

    const result = await getHousingUnitMaintenance('hu-1')

    expect(result).toEqual([])
  })
})

// =============================================================================
// auth guard
// =============================================================================

describe('auth guard', () => {
  it('rejects unauthenticated requests', async () => {
    const { requireStaffAuth: mockRequireStaffAuth } = require('@/lib/auth')
    mockRequireStaffAuth.mockRejectedValueOnce(new Error('Anmeldung erforderlich'))

    const fd = new FormData()
    await expect(createMaintenanceRequest(fd)).rejects.toThrow('Anmeldung erforderlich')
  })
})
