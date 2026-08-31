/**
 * Unit tests for satisfaction server actions
 *
 * Tests createCheckInFromForm, getPlacementCheckIns and
 * getPlacementSatisfactionTrend.
 *
 * createCheckInFromForm uses redirect() which throws, so we mock it to throw NEXT_REDIRECT.
 */

import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import {
  createCheckInFromForm,
  getPlacementCheckIns,
  getPlacementSatisfactionTrend,
} from '../satisfaction'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// =============================================================================
// MOCKS
// =============================================================================

jest.mock('@/lib/db', () => {
  const prismaMock: {
    placement: { findUnique: jest.Mock; update: jest.Mock }
    satisfactionCheckIn: { create: jest.Mock; findMany: jest.Mock }
    $transaction: jest.Mock
  } = {
    placement: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    satisfactionCheckIn: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    // $transaction(callback) invokes the callback with the same mock client
    // so individual model mocks (create, update) continue to be observed.
    $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(prismaMock)),
  }
  return { prisma: prismaMock }
})

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

const mockPrisma = prisma as jest.Mocked<typeof prisma>

beforeEach(() => {
  jest.clearAllMocks()
})

// =============================================================================
// Helper to build FormData for createCheckInFromForm
// =============================================================================

function makeCheckInFormData(overrides: Record<string, string> = {}): FormData {
  const defaults: Record<string, string> = {
    placementId: 'clxxxxxxxxxxxxxxxxx0001',
    checkInType: 'REGULAR',
    overallSatisfaction: '4',
    roommateRelations: '3',
    facilitySatisfaction: '4',
    safetyFeeling: '5',
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
// createCheckInFromForm
// =============================================================================

describe('createCheckInFromForm', () => {
  it('throws validation error when placementId is missing', async () => {
    const fd = makeCheckInFormData({ placementId: '' })

    await expect(createCheckInFromForm(fd)).rejects.toThrow()
  })

  it('throws validation error when overallSatisfaction is out of range', async () => {
    const fd = makeCheckInFormData({ overallSatisfaction: '6' })

    await expect(createCheckInFromForm(fd)).rejects.toThrow()
  })

  it('throws when placement is not found', async () => {
    ;(mockPrisma.placement.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(createCheckInFromForm(makeCheckInFormData())).rejects.toThrow(
      ERROR_MESSAGES.PLACEMENT_NOT_FOUND,
    )
  })

  it('creates check-in and redirects on success', async () => {
    const placementStart = new Date('2025-01-01')
    ;(mockPrisma.placement.findUnique as jest.Mock).mockResolvedValue({
      residentId: 'res-1',
      startDate: placementStart,
    })
    ;(mockPrisma.satisfactionCheckIn.create as jest.Mock).mockResolvedValue({
      id: 'ci-1',
    })
    ;(mockPrisma.placement.update as jest.Mock).mockResolvedValue({})

    await expect(createCheckInFromForm(makeCheckInFormData())).rejects.toThrow('NEXT_REDIRECT')

    expect(mockPrisma.satisfactionCheckIn.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        placementId: 'clxxxxxxxxxxxxxxxxx0001',
        checkInType: 'REGULAR',
        overallSatisfaction: 4,
        roommateRelations: 3,
        facilitySatisfaction: 4,
        safetyFeeling: 5,
        isAnonymous: false,
      }),
    })

    // Placement satisfaction updated
    expect(mockPrisma.placement.update).toHaveBeenCalledWith({
      where: { id: 'clxxxxxxxxxxxxxxxxx0001' },
      data: { satisfactionRating: 4 },
    })

    // Audit logged
    expect(logAudit).toHaveBeenCalledWith({
      action: 'CREATE',
      entity: 'CHECK_IN',
      entityId: 'ci-1',
      userId: 'staff-1',
      changes: {
        placementId: 'clxxxxxxxxxxxxxxxxx0001',
        checkInType: 'REGULAR',
        overallSatisfaction: 4,
        hasConcerns: false,
      },
    })

    // Redirect to resident page
    expect(mockRedirect).toHaveBeenCalledWith('/residents/res-1?checkin=true')
  })

  it('uses provided weekNumber when given', async () => {
    ;(mockPrisma.placement.findUnique as jest.Mock).mockResolvedValue({
      residentId: 'res-1',
      startDate: new Date('2025-01-01'),
    })
    ;(mockPrisma.satisfactionCheckIn.create as jest.Mock).mockResolvedValue({
      id: 'ci-1',
    })
    ;(mockPrisma.placement.update as jest.Mock).mockResolvedValue({})

    const fd = makeCheckInFormData({ weekNumber: '5' })

    await expect(createCheckInFromForm(fd)).rejects.toThrow('NEXT_REDIRECT')

    expect(mockPrisma.satisfactionCheckIn.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        weekNumber: 5,
      }),
    })
  })

  it('includes concerns and text fields when provided', async () => {
    ;(mockPrisma.placement.findUnique as jest.Mock).mockResolvedValue({
      residentId: 'res-1',
      startDate: new Date('2025-01-01'),
    })
    ;(mockPrisma.satisfactionCheckIn.create as jest.Mock).mockResolvedValue({
      id: 'ci-1',
    })
    ;(mockPrisma.placement.update as jest.Mock).mockResolvedValue({})

    const fd = makeCheckInFormData({
      concerns: 'Noise at night',
      improvements: 'Quiet hours',
      positives: 'Nice location',
      collectedBy: 'Staff member',
    })

    await expect(createCheckInFromForm(fd)).rejects.toThrow('NEXT_REDIRECT')

    expect(mockPrisma.satisfactionCheckIn.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        concerns: 'Noise at night',
        improvements: 'Quiet hours',
        positives: 'Nice location',
        collectedBy: 'Staff member',
      }),
    })

    // hasConcerns should be true in audit
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: expect.objectContaining({
          hasConcerns: true,
        }),
      }),
    )
  })

  it('throws user-facing error when prisma create fails', async () => {
    ;(mockPrisma.placement.findUnique as jest.Mock).mockResolvedValue({
      residentId: 'res-1',
      startDate: new Date('2025-01-01'),
    })
    ;(mockPrisma.satisfactionCheckIn.create as jest.Mock).mockRejectedValue(new Error('DB error'))

    await expect(createCheckInFromForm(makeCheckInFormData())).rejects.toThrow(
      ERROR_MESSAGES.CHECKIN_SAVE_ERROR,
    )
  })
})

// =============================================================================
// who collected it
// =============================================================================

/**
 * The gate for the class, not the instance.
 *
 * `collectedBy` is prose a caseworker types into the form ("Team Nord"); it is
 * a note, and it may name someone who is not the signed-in user.
 * `collectedByUserId` is the account that submitted it. The two were briefly
 * the same column, which made it hold either a typed name or a user id with no
 * way to tell which — so the one distinction that lets you read a satisfaction
 * score later (did the resident say this, or did staff estimate it?) was
 * silently unrecoverable.
 *
 * Nothing throws when this regresses and no page renders wrong; the number is
 * just quietly a different kind of fact. So assert the property.
 */
describe('who collected a check-in', () => {
  beforeEach(() => {
    ;(mockPrisma.placement.findUnique as jest.Mock).mockResolvedValue({
      residentId: 'res-1',
      startDate: new Date('2025-01-01'),
    })
    ;(mockPrisma.satisfactionCheckIn.create as jest.Mock).mockResolvedValue({ id: 'ci-1' })
    ;(mockPrisma.placement.update as jest.Mock).mockResolvedValue({})
  })

  it('always records the signed-in account, whatever the form says', async () => {
    for (const typed of ['', 'Team Nord', 'a colleague']) {
      jest.clearAllMocks()
      ;(mockPrisma.placement.findUnique as jest.Mock).mockResolvedValue({
        residentId: 'res-1',
        startDate: new Date('2025-01-01'),
      })
      ;(mockPrisma.satisfactionCheckIn.create as jest.Mock).mockResolvedValue({ id: 'ci-1' })
      ;(mockPrisma.placement.update as jest.Mock).mockResolvedValue({})

      await expect(
        createCheckInFromForm(makeCheckInFormData({ collectedBy: typed })),
      ).rejects.toThrow('NEXT_REDIRECT')

      const [call] = (mockPrisma.satisfactionCheckIn.create as jest.Mock).mock.calls
      expect(call[0].data.collectedByUserId).toBe(mockStaffUser.id)
      expect(call[0].data.collectedBy).toBe(typed || null)
    }
  })

  it('keeps the typed note and the account as separate fields', async () => {
    await expect(
      createCheckInFromForm(makeCheckInFormData({ collectedBy: 'Team Nord' })),
    ).rejects.toThrow('NEXT_REDIRECT')

    const [call] = (mockPrisma.satisfactionCheckIn.create as jest.Mock).mock.calls
    // The note must never be mistaken for an identifier.
    expect(call[0].data.collectedBy).not.toBe(call[0].data.collectedByUserId)
  })
})

// =============================================================================
// getPlacementCheckIns
// =============================================================================

describe('getPlacementCheckIns', () => {
  it('returns check-ins for a placement', async () => {
    const mockCheckIns = [
      { id: 'ci-1', overallSatisfaction: 4 },
      { id: 'ci-2', overallSatisfaction: 3 },
    ]
    ;(mockPrisma.satisfactionCheckIn.findMany as jest.Mock).mockResolvedValue(mockCheckIns)

    const result = await getPlacementCheckIns('pl-1')

    expect(result).toEqual(mockCheckIns)
    expect(mockPrisma.satisfactionCheckIn.findMany).toHaveBeenCalledWith({
      where: { placementId: 'pl-1' },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('returns empty array when no check-ins exist', async () => {
    ;(mockPrisma.satisfactionCheckIn.findMany as jest.Mock).mockResolvedValue([])

    const result = await getPlacementCheckIns('pl-1')

    expect(result).toEqual([])
  })
})

// =============================================================================
// getPlacementSatisfactionTrend
// =============================================================================

describe('getPlacementSatisfactionTrend', () => {
  it('returns mapped trend data', async () => {
    const date1 = new Date('2025-01-15')
    const date2 = new Date('2025-01-22')
    ;(mockPrisma.satisfactionCheckIn.findMany as jest.Mock).mockResolvedValue([
      {
        createdAt: date1,
        weekNumber: 1,
        overallSatisfaction: 4,
        roommateRelations: 3,
      },
      {
        createdAt: date2,
        weekNumber: 2,
        overallSatisfaction: 5,
        roommateRelations: 4,
      },
    ])

    const result = await getPlacementSatisfactionTrend('pl-1')

    expect(result).toEqual([
      { date: date1, week: 1, overall: 4, roommates: 3 },
      { date: date2, week: 2, overall: 5, roommates: 4 },
    ])

    expect(mockPrisma.satisfactionCheckIn.findMany).toHaveBeenCalledWith({
      where: { placementId: 'pl-1' },
      orderBy: { createdAt: 'asc' },
      select: {
        createdAt: true,
        weekNumber: true,
        overallSatisfaction: true,
        roommateRelations: true,
      },
    })
  })

  it('handles null roommateRelations', async () => {
    const date1 = new Date('2025-01-15')
    ;(mockPrisma.satisfactionCheckIn.findMany as jest.Mock).mockResolvedValue([
      {
        createdAt: date1,
        weekNumber: 1,
        overallSatisfaction: 3,
        roommateRelations: null,
      },
    ])

    const result = await getPlacementSatisfactionTrend('pl-1')

    expect(result).toEqual([{ date: date1, week: 1, overall: 3, roommates: null }])
  })

  it('returns empty array when no check-ins exist', async () => {
    ;(mockPrisma.satisfactionCheckIn.findMany as jest.Mock).mockResolvedValue([])

    const result = await getPlacementSatisfactionTrend('pl-1')

    expect(result).toEqual([])
  })
})

// =============================================================================
// auth guard
// =============================================================================

describe('auth guard', () => {
  it('rejects unauthenticated requests', async () => {
    const { requirePermission: mockRequirePermission } = require('@/lib/auth')
    mockRequirePermission.mockRejectedValueOnce(new Error('Anmeldung erforderlich'))

    await expect(createCheckInFromForm(makeCheckInFormData())).rejects.toThrow(
      'Anmeldung erforderlich',
    )
  })
})
