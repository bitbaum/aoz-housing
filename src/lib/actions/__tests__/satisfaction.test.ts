/**
 * Unit tests for satisfaction server actions
 *
 * Tests createCheckInFromForm, getPlacementCheckIns and
 * getPlacementSatisfactionTrend.
 *
 * createCheckInFromForm uses redirect() which throws, so we mock it to throw NEXT_REDIRECT.
 */

import { placement, satisfactionCheckIn } from '@/lib/db'
import { eq, asc, desc } from 'drizzle-orm'
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

const mockPlacementFindFirst = vi.fn()
const mockCheckInFindMany = vi.fn()
// Receives the insert payload; resolves with the created row.
const mockCheckInInsert = vi.fn()
// Receives (table, set payload, where expression) of the placement update.
const mockPlacementUpdate = vi.fn()

vi.mock('@/lib/db', async () => {
  // Keep tables/enums/helpers real; only fake `db`.
  const actual = await vi.importActual<object>('@/lib/db')
  // db.transaction(cb) invokes the callback with a tx carrying the builder
  // surface the action uses, so the write mocks continue to be observed.
  const tx = {
    insert: vi.fn(() => ({
      values: (v: unknown) => ({
        returning: (): Promise<unknown[]> =>
          Promise.resolve(mockCheckInInsert(v)).then((row: unknown) => [row]),
      }),
    })),
    update: vi.fn((table: unknown) => ({
      set: (v: unknown) => ({
        where: (w: unknown): Promise<unknown> => Promise.resolve(mockPlacementUpdate(table, v, w)),
      }),
    })),
  }
  return {
    ...actual,
    db: {
      query: {
        placement: { findFirst: (...a: unknown[]) => mockPlacementFindFirst(...a) },
        satisfactionCheckIn: { findMany: (...a: unknown[]) => mockCheckInFindMany(...a) },
      },
      transaction: (fn: (t: unknown) => unknown) => fn(tx),
    },
  }
})

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
    mockPlacementFindFirst.mockResolvedValue(null)

    await expect(createCheckInFromForm(makeCheckInFormData())).rejects.toThrow(
      ERROR_MESSAGES.PLACEMENT_NOT_FOUND,
    )
  })

  it('creates check-in and redirects on success', async () => {
    const placementStart = new Date('2025-01-01')
    mockPlacementFindFirst.mockResolvedValue({
      residentId: 'res-1',
      startDate: placementStart,
    })
    mockCheckInInsert.mockResolvedValue({
      id: 'ci-1',
    })
    mockPlacementUpdate.mockResolvedValue({})

    await expect(createCheckInFromForm(makeCheckInFormData())).rejects.toThrow('NEXT_REDIRECT')

    expect(mockCheckInInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        placementId: 'clxxxxxxxxxxxxxxxxx0001',
        checkInType: 'REGULAR',
        overallSatisfaction: 4,
        roommateRelations: 3,
        facilitySatisfaction: 4,
        safetyFeeling: 5,
        isAnonymous: false,
      }),
    )

    // Placement satisfaction updated
    expect(mockPlacementUpdate).toHaveBeenCalledWith(
      placement,
      { satisfactionRating: 4 },
      eq(placement.id, 'clxxxxxxxxxxxxxxxxx0001'),
    )

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
    mockPlacementFindFirst.mockResolvedValue({
      residentId: 'res-1',
      startDate: new Date('2025-01-01'),
    })
    mockCheckInInsert.mockResolvedValue({
      id: 'ci-1',
    })
    mockPlacementUpdate.mockResolvedValue({})

    const fd = makeCheckInFormData({ weekNumber: '5' })

    await expect(createCheckInFromForm(fd)).rejects.toThrow('NEXT_REDIRECT')

    expect(mockCheckInInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        weekNumber: 5,
      }),
    )
  })

  it('includes concerns and text fields when provided', async () => {
    mockPlacementFindFirst.mockResolvedValue({
      residentId: 'res-1',
      startDate: new Date('2025-01-01'),
    })
    mockCheckInInsert.mockResolvedValue({
      id: 'ci-1',
    })
    mockPlacementUpdate.mockResolvedValue({})

    const fd = makeCheckInFormData({
      concerns: 'Noise at night',
      improvements: 'Quiet hours',
      positives: 'Nice location',
      collectedBy: 'Staff member',
    })

    await expect(createCheckInFromForm(fd)).rejects.toThrow('NEXT_REDIRECT')

    expect(mockCheckInInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        concerns: 'Noise at night',
        improvements: 'Quiet hours',
        positives: 'Nice location',
        collectedBy: 'Staff member',
      }),
    )

    // hasConcerns should be true in audit
    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: expect.objectContaining({
          hasConcerns: true,
        }),
      }),
    )
  })

  it('throws user-facing error when the insert fails', async () => {
    mockPlacementFindFirst.mockResolvedValue({
      residentId: 'res-1',
      startDate: new Date('2025-01-01'),
    })
    mockCheckInInsert.mockRejectedValue(new Error('DB error'))

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
    mockPlacementFindFirst.mockResolvedValue({
      residentId: 'res-1',
      startDate: new Date('2025-01-01'),
    })
    mockCheckInInsert.mockResolvedValue({ id: 'ci-1' })
    mockPlacementUpdate.mockResolvedValue({})
  })

  it('always records the signed-in account, whatever the form says', async () => {
    for (const typed of ['', 'Team Nord', 'a colleague']) {
      vi.clearAllMocks()
      mockPlacementFindFirst.mockResolvedValue({
        residentId: 'res-1',
        startDate: new Date('2025-01-01'),
      })
      mockCheckInInsert.mockResolvedValue({ id: 'ci-1' })
      mockPlacementUpdate.mockResolvedValue({})

      await expect(
        createCheckInFromForm(makeCheckInFormData({ collectedBy: typed })),
      ).rejects.toThrow('NEXT_REDIRECT')

      const [call] = mockCheckInInsert.mock.calls
      expect(call[0].collectedByUserId).toBe(mockStaffUser.id)
      expect(call[0].collectedBy).toBe(typed || null)
    }
  })

  it('keeps the typed note and the account as separate fields', async () => {
    await expect(
      createCheckInFromForm(makeCheckInFormData({ collectedBy: 'Team Nord' })),
    ).rejects.toThrow('NEXT_REDIRECT')

    const [call] = mockCheckInInsert.mock.calls
    // The note must never be mistaken for an identifier.
    expect(call[0].collectedBy).not.toBe(call[0].collectedByUserId)
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
    mockCheckInFindMany.mockResolvedValue(mockCheckIns)

    const result = await getPlacementCheckIns('pl-1')

    expect(result).toEqual(mockCheckIns)
    expect(mockCheckInFindMany).toHaveBeenCalledWith({
      where: eq(satisfactionCheckIn.placementId, 'pl-1'),
      orderBy: [desc(satisfactionCheckIn.createdAt)],
    })
  })

  it('returns empty array when no check-ins exist', async () => {
    mockCheckInFindMany.mockResolvedValue([])

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
    mockCheckInFindMany.mockResolvedValue([
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

    expect(mockCheckInFindMany).toHaveBeenCalledWith({
      where: eq(satisfactionCheckIn.placementId, 'pl-1'),
      orderBy: [asc(satisfactionCheckIn.createdAt)],
      columns: {
        createdAt: true,
        weekNumber: true,
        overallSatisfaction: true,
        roommateRelations: true,
      },
    })
  })

  it('handles null roommateRelations', async () => {
    const date1 = new Date('2025-01-15')
    mockCheckInFindMany.mockResolvedValue([
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
    mockCheckInFindMany.mockResolvedValue([])

    const result = await getPlacementSatisfactionTrend('pl-1')

    expect(result).toEqual([])
  })
})

// =============================================================================
// auth guard
// =============================================================================

describe('auth guard', () => {
  it('rejects unauthenticated requests', async () => {
    const { requirePermission: mockRequirePermission } = vi.mocked(await import('@/lib/auth'))
    mockRequirePermission.mockRejectedValueOnce(new Error('Anmeldung erforderlich'))

    await expect(createCheckInFromForm(makeCheckInFormData())).rejects.toThrow(
      'Anmeldung erforderlich',
    )
  })
})
