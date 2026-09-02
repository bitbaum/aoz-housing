/**
 * Unit tests for spots server actions
 *
 * Tests createSpot, updateSpot, deleteSpot, and createMultipleSpots.
 * All actions take FormData, perform db operations, and call revalidatePath.
 */

import { placementSpot, placement } from '@/lib/db'
import { and, eq } from 'drizzle-orm'
import { createSpot, updateSpot, deleteSpot, createMultipleSpots } from '../spots'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// =============================================================================
// MOCKS
// =============================================================================

const mockInsertValues = vi.fn()
const mockUpdateReturning = vi.fn()
const mockUpdateWhere = vi.fn()
const mockDeleteWhere = vi.fn()
const mockCount = vi.fn()

vi.mock('@/lib/db', async () => ({
  ...(await vi.importActual<object>('@/lib/db')),
  db: {
    // `values()` is awaited directly for single inserts and `.returning()`ed for
    // the room insert — expose both shapes over the same lazily-run mock.
    insert: vi.fn(() => ({
      values: (v: unknown) => {
        const run = () => mockInsertValues(v) as Promise<unknown[]>
        return {
          then: (res?: never, rej?: never) => run().then(res, rej),
          returning: () => run(),
        }
      },
    })),
    update: vi.fn(() => ({
      set: (v: unknown) => ({
        where: (w: unknown) => {
          mockUpdateWhere(w)
          return { returning: (): Promise<unknown[]> => mockUpdateReturning(v) }
        },
      }),
    })),
    // `.where()` is awaited directly for the child-spot delete and
    // `.returning()`ed for the spot itself.
    delete: vi.fn(() => ({
      where: (w: unknown) => {
        const run = () => mockDeleteWhere(w) as Promise<unknown[]>
        return {
          then: (res?: never, rej?: never) => run().then(res, rej),
          returning: () => run(),
        }
      },
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
    mockInsertValues.mockResolvedValue([{ id: 'spot-1' }])

    await createSpot(makeCreateSpotFormData())

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        housingUnitId: 'clxxxxxxxxxxxxxxxxx0001',
        code: 'R101-B1',
        type: 'BED',
      }),
    )
  })

  it('creates a spot with optional fields', async () => {
    mockInsertValues.mockResolvedValue([{ id: 'spot-1' }])

    const fd = makeCreateSpotFormData({
      label: 'Bett 1',
      squareMeters: '12',
      floor: '2',
      notes: 'Near window',
      status: 'AVAILABLE',
    })

    await createSpot(fd)

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Bett 1',
        squareMeters: 12,
        floor: 2,
        notes: 'Near window',
        status: 'AVAILABLE',
      }),
    )
  })

  it('throws user-facing error when the insert fails', async () => {
    mockInsertValues.mockRejectedValue(new Error('DB error'))

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
    mockUpdateReturning.mockResolvedValue([{ id: 'clxxxxxxxxxxxxxxxxx0010' }])

    await updateSpot(makeUpdateSpotFormData())

    expect(mockUpdateWhere).toHaveBeenCalledWith(eq(placementSpot.id, 'clxxxxxxxxxxxxxxxxx0010'))
    expect(mockUpdateReturning).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'R101-B1-updated',
        type: 'BED',
        parentSpotId: null,
      }),
    )
  })

  it('sets parentSpotId to null when not provided', async () => {
    mockUpdateReturning.mockResolvedValue([{ id: 'clxxxxxxxxxxxxxxxxx0010' }])

    await updateSpot(makeUpdateSpotFormData())

    expect(mockUpdateReturning).toHaveBeenCalledWith(
      expect.objectContaining({
        parentSpotId: null,
      }),
    )
  })

  it('preserves parentSpotId when provided', async () => {
    mockUpdateReturning.mockResolvedValue([{ id: 'clxxxxxxxxxxxxxxxxx0010' }])

    const fd = makeUpdateSpotFormData({
      parentSpotId: 'clxxxxxxxxxxxxxxxxx0099',
    })

    await updateSpot(fd)

    expect(mockUpdateReturning).toHaveBeenCalledWith(
      expect.objectContaining({
        parentSpotId: 'clxxxxxxxxxxxxxxxxx0099',
      }),
    )
  })

  it('throws user-facing error when the update fails', async () => {
    mockUpdateReturning.mockRejectedValue(new Error('DB error'))

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
    mockCount.mockResolvedValue(1)

    await expect(deleteSpot(makeDeleteSpotFormData())).rejects.toThrow(
      ERROR_MESSAGES.SPOT_DELETE_BLOCKED,
    )
  })

  it('deletes child spots then the spot itself when no active placements', async () => {
    mockCount.mockResolvedValue(0)
    mockDeleteWhere.mockResolvedValue([{ id: 'clxxxxxxxxxxxxxxxxx0010' }])

    await deleteSpot(makeDeleteSpotFormData())

    // The active-placement check scoped to this spot
    expect(mockCount).toHaveBeenCalledWith(
      placement,
      and(eq(placement.spotId, 'clxxxxxxxxxxxxxxxxx0010'), eq(placement.status, 'ACTIVE')),
    )

    // Child spots deleted first
    expect(mockDeleteWhere).toHaveBeenNthCalledWith(
      1,
      eq(placementSpot.parentSpotId, 'clxxxxxxxxxxxxxxxxx0010'),
    )

    // Then the spot itself
    expect(mockDeleteWhere).toHaveBeenNthCalledWith(
      2,
      eq(placementSpot.id, 'clxxxxxxxxxxxxxxxxx0010'),
    )
  })

  it('throws user-facing error when the delete fails', async () => {
    mockCount.mockResolvedValue(0)
    mockDeleteWhere
      .mockResolvedValueOnce([]) // child-spot delete succeeds
      .mockRejectedValueOnce(new Error('DB error')) // spot delete fails

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
    mockInsertValues
      .mockResolvedValueOnce([mockRoom]) // room creation
      .mockResolvedValueOnce([{ id: 'bed-1' }]) // bed 1
      .mockResolvedValueOnce([{ id: 'bed-2' }]) // bed 2
      .mockResolvedValueOnce([{ id: 'bed-3' }]) // bed 3

    await createMultipleSpots(makeMultipleSpotsFormData())

    // First call: room
    expect(mockInsertValues).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        housingUnitId: 'clxxxxxxxxxxxxxxxxx0001',
        code: 'R101',
        type: 'ROOM',
        status: 'AVAILABLE',
      }),
    )

    // Subsequent calls: beds (3 beds)
    expect(mockInsertValues).toHaveBeenCalledTimes(4) // 1 room + 3 beds

    expect(mockInsertValues).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        housingUnitId: 'clxxxxxxxxxxxxxxxxx0001',
        code: 'R101-B1',
        label: 'Bett 1',
        type: 'BED',
        parentSpotId: 'room-1',
        status: 'AVAILABLE',
      }),
    )

    expect(mockInsertValues).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        code: 'R101-B2',
        label: 'Bett 2',
        parentSpotId: 'room-1',
      }),
    )

    expect(mockInsertValues).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        code: 'R101-B3',
        label: 'Bett 3',
        parentSpotId: 'room-1',
      }),
    )
  })

  it('passes optional fields to room creation', async () => {
    mockInsertValues.mockResolvedValue([{ id: 'room-1' }])

    const fd = makeMultipleSpotsFormData({
      roomLabel: 'Zimmer 101',
      squareMeters: '20',
      floor: '1',
      bedCount: '1',
    })

    await createMultipleSpots(fd)

    expect(mockInsertValues).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        label: 'Zimmer 101',
        squareMeters: 20,
        floor: 1,
      }),
    )
  })

  it('creates correct number of beds based on bedCount', async () => {
    mockInsertValues.mockResolvedValue([{ id: 'room-1' }])

    const fd = makeMultipleSpotsFormData({ bedCount: '1' })
    await createMultipleSpots(fd)

    // 1 room + 1 bed = 2 total
    expect(mockInsertValues).toHaveBeenCalledTimes(2)
  })

  it('throws user-facing error when the insert fails', async () => {
    mockInsertValues.mockRejectedValue(new Error('DB error'))

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
    const { requirePermission: mockRequirePermission } = vi.mocked(await import('@/lib/auth'))
    mockRequirePermission.mockRejectedValueOnce(new Error('Anmeldung erforderlich'))

    const fd = new FormData()
    await expect(createSpot(fd)).rejects.toThrow('Anmeldung erforderlich')
  })
})
