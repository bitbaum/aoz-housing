/**
 * Unit tests for spots server actions
 *
 * Tests createSpot, updateSpot, deleteSpot, and createMultipleSpots.
 * All actions take FormData, perform Prisma operations, and call revalidatePath.
 */

import { prisma } from '@/lib/db'
import { createSpot, updateSpot, deleteSpot, createMultipleSpots } from '../spots'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// =============================================================================
// MOCKS
// =============================================================================

jest.mock('@/lib/db', () => ({
  prisma: {
    placementSpot: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    placement: {
      count: jest.fn(),
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
// Helper to build FormData for createSpot
// =============================================================================

function makeCreateSpotFormData(overrides: Record<string, string> = {}): FormData {
  const defaults: Record<string, string> = {
    housingUnitId: 'clxxxxxxxxxxxxxxxxx0001',
    code: 'R101-B1',
    type: 'BED',
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
// Helper to build FormData for updateSpot
// =============================================================================

function makeUpdateSpotFormData(overrides: Record<string, string> = {}): FormData {
  const defaults: Record<string, string> = {
    id: 'clxxxxxxxxxxxxxxxxx0010',
    housingUnitId: 'clxxxxxxxxxxxxxxxxx0001',
    code: 'R101-B1-updated',
    type: 'BED',
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
// Helper to build FormData for deleteSpot
// =============================================================================

function makeDeleteSpotFormData(overrides: Record<string, string> = {}): FormData {
  const defaults: Record<string, string> = {
    id: 'clxxxxxxxxxxxxxxxxx0010',
    housingUnitId: 'clxxxxxxxxxxxxxxxxx0001',
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
// Helper to build FormData for createMultipleSpots
// =============================================================================

function makeMultipleSpotsFormData(overrides: Record<string, string> = {}): FormData {
  const defaults: Record<string, string> = {
    housingUnitId: 'clxxxxxxxxxxxxxxxxx0001',
    roomCode: 'R101',
    bedCount: '3',
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
// createSpot
// =============================================================================

describe('createSpot', () => {
  it('throws validation error when code is missing', async () => {
    const fd = makeCreateSpotFormData({ code: '' })

    await expect(createSpot(fd)).rejects.toThrow()
  })

  it('throws validation error when housingUnitId is missing', async () => {
    const fd = new FormData()
    fd.set('code', 'R101-B1')
    fd.set('type', 'BED')

    await expect(createSpot(fd)).rejects.toThrow()
  })

  it('creates a spot with required fields', async () => {
    ;(mockPrisma.placementSpot.create as jest.Mock).mockResolvedValue({
      id: 'spot-1',
    })

    await createSpot(makeCreateSpotFormData())

    expect(mockPrisma.placementSpot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        housingUnitId: 'clxxxxxxxxxxxxxxxxx0001',
        code: 'R101-B1',
        type: 'BED',
      }),
    })
  })

  it('creates a spot with optional fields', async () => {
    ;(mockPrisma.placementSpot.create as jest.Mock).mockResolvedValue({
      id: 'spot-1',
    })

    const fd = makeCreateSpotFormData({
      label: 'Bett 1',
      squareMeters: '12',
      floor: '2',
      notes: 'Near window',
      status: 'AVAILABLE',
    })

    await createSpot(fd)

    expect(mockPrisma.placementSpot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        label: 'Bett 1',
        squareMeters: 12,
        floor: 2,
        notes: 'Near window',
        status: 'AVAILABLE',
      }),
    })
  })

  it('throws user-facing error when prisma fails', async () => {
    ;(mockPrisma.placementSpot.create as jest.Mock).mockRejectedValue(new Error('DB error'))

    await expect(createSpot(makeCreateSpotFormData())).rejects.toThrow(
      ERROR_MESSAGES.SPOT_CREATE_ERROR,
    )
  })
})

// =============================================================================
// updateSpot
// =============================================================================

describe('updateSpot', () => {
  it('throws validation error when id is missing', async () => {
    const fd = makeUpdateSpotFormData({ id: '' })

    await expect(updateSpot(fd)).rejects.toThrow()
  })

  it('updates a spot with new data', async () => {
    ;(mockPrisma.placementSpot.update as jest.Mock).mockResolvedValue({
      id: 'clxxxxxxxxxxxxxxxxx0010',
    })

    await updateSpot(makeUpdateSpotFormData())

    expect(mockPrisma.placementSpot.update).toHaveBeenCalledWith({
      where: { id: 'clxxxxxxxxxxxxxxxxx0010' },
      data: expect.objectContaining({
        code: 'R101-B1-updated',
        type: 'BED',
        parentSpotId: null,
      }),
    })
  })

  it('sets parentSpotId to null when not provided', async () => {
    ;(mockPrisma.placementSpot.update as jest.Mock).mockResolvedValue({
      id: 'clxxxxxxxxxxxxxxxxx0010',
    })

    await updateSpot(makeUpdateSpotFormData())

    expect(mockPrisma.placementSpot.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parentSpotId: null,
        }),
      }),
    )
  })

  it('preserves parentSpotId when provided', async () => {
    ;(mockPrisma.placementSpot.update as jest.Mock).mockResolvedValue({
      id: 'clxxxxxxxxxxxxxxxxx0010',
    })

    const fd = makeUpdateSpotFormData({
      parentSpotId: 'clxxxxxxxxxxxxxxxxx0099',
    })

    await updateSpot(fd)

    expect(mockPrisma.placementSpot.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parentSpotId: 'clxxxxxxxxxxxxxxxxx0099',
        }),
      }),
    )
  })

  it('throws user-facing error when prisma fails', async () => {
    ;(mockPrisma.placementSpot.update as jest.Mock).mockRejectedValue(new Error('DB error'))

    await expect(updateSpot(makeUpdateSpotFormData())).rejects.toThrow(
      ERROR_MESSAGES.SPOT_UPDATE_ERROR,
    )
  })
})

// =============================================================================
// deleteSpot
// =============================================================================

describe('deleteSpot', () => {
  it('throws validation error when id is missing', async () => {
    const fd = makeDeleteSpotFormData({ id: '' })

    await expect(deleteSpot(fd)).rejects.toThrow()
  })

  it('throws when spot has active placements', async () => {
    ;(mockPrisma.placement.count as jest.Mock).mockResolvedValue(1)

    await expect(deleteSpot(makeDeleteSpotFormData())).rejects.toThrow(
      ERROR_MESSAGES.SPOT_DELETE_BLOCKED,
    )
  })

  it('deletes child spots then the spot itself when no active placements', async () => {
    ;(mockPrisma.placement.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.placementSpot.deleteMany as jest.Mock).mockResolvedValue({ count: 2 })
    ;(mockPrisma.placementSpot.delete as jest.Mock).mockResolvedValue({
      id: 'clxxxxxxxxxxxxxxxxx0010',
    })

    await deleteSpot(makeDeleteSpotFormData())

    // Child spots deleted first
    expect(mockPrisma.placementSpot.deleteMany).toHaveBeenCalledWith({
      where: { parentSpotId: 'clxxxxxxxxxxxxxxxxx0010' },
    })

    // Then the spot itself
    expect(mockPrisma.placementSpot.delete).toHaveBeenCalledWith({
      where: { id: 'clxxxxxxxxxxxxxxxxx0010' },
    })
  })

  it('throws user-facing error when prisma delete fails', async () => {
    ;(mockPrisma.placement.count as jest.Mock).mockResolvedValue(0)
    ;(mockPrisma.placementSpot.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(mockPrisma.placementSpot.delete as jest.Mock).mockRejectedValue(new Error('DB error'))

    await expect(deleteSpot(makeDeleteSpotFormData())).rejects.toThrow(
      ERROR_MESSAGES.SPOT_DELETE_ERROR,
    )
  })
})

// =============================================================================
// createMultipleSpots
// =============================================================================

describe('createMultipleSpots', () => {
  it('throws validation error when roomCode is missing', async () => {
    const fd = makeMultipleSpotsFormData({ roomCode: '' })

    await expect(createMultipleSpots(fd)).rejects.toThrow()
  })

  it('creates a room and beds inside it', async () => {
    const mockRoom = { id: 'room-1' }
    ;(mockPrisma.placementSpot.create as jest.Mock)
      .mockResolvedValueOnce(mockRoom) // room creation
      .mockResolvedValueOnce({ id: 'bed-1' }) // bed 1
      .mockResolvedValueOnce({ id: 'bed-2' }) // bed 2
      .mockResolvedValueOnce({ id: 'bed-3' }) // bed 3

    await createMultipleSpots(makeMultipleSpotsFormData())

    // First call: room
    expect(mockPrisma.placementSpot.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        housingUnitId: 'clxxxxxxxxxxxxxxxxx0001',
        code: 'R101',
        type: 'ROOM',
        status: 'AVAILABLE',
      }),
    })

    // Subsequent calls: beds (3 beds)
    expect(mockPrisma.placementSpot.create).toHaveBeenCalledTimes(4) // 1 room + 3 beds

    expect(mockPrisma.placementSpot.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        housingUnitId: 'clxxxxxxxxxxxxxxxxx0001',
        code: 'R101-B1',
        label: 'Bett 1',
        type: 'BED',
        parentSpotId: 'room-1',
        status: 'AVAILABLE',
      }),
    })

    expect(mockPrisma.placementSpot.create).toHaveBeenNthCalledWith(3, {
      data: expect.objectContaining({
        code: 'R101-B2',
        label: 'Bett 2',
        parentSpotId: 'room-1',
      }),
    })

    expect(mockPrisma.placementSpot.create).toHaveBeenNthCalledWith(4, {
      data: expect.objectContaining({
        code: 'R101-B3',
        label: 'Bett 3',
        parentSpotId: 'room-1',
      }),
    })
  })

  it('passes optional fields to room creation', async () => {
    ;(mockPrisma.placementSpot.create as jest.Mock).mockResolvedValue({ id: 'room-1' })

    const fd = makeMultipleSpotsFormData({
      roomLabel: 'Zimmer 101',
      squareMeters: '20',
      floor: '1',
      bedCount: '1',
    })

    await createMultipleSpots(fd)

    expect(mockPrisma.placementSpot.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        label: 'Zimmer 101',
        squareMeters: 20,
        floor: 1,
      }),
    })
  })

  it('creates correct number of beds based on bedCount', async () => {
    ;(mockPrisma.placementSpot.create as jest.Mock).mockResolvedValue({ id: 'room-1' })

    const fd = makeMultipleSpotsFormData({ bedCount: '1' })
    await createMultipleSpots(fd)

    // 1 room + 1 bed = 2 total
    expect(mockPrisma.placementSpot.create).toHaveBeenCalledTimes(2)
  })

  it('throws user-facing error when prisma fails', async () => {
    ;(mockPrisma.placementSpot.create as jest.Mock).mockRejectedValue(new Error('DB error'))

    await expect(createMultipleSpots(makeMultipleSpotsFormData())).rejects.toThrow(
      ERROR_MESSAGES.SPOTS_BATCH_CREATE_ERROR,
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

    const fd = new FormData()
    await expect(createSpot(fd)).rejects.toThrow('Anmeldung erforderlich')
  })
})
