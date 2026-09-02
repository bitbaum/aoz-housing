/**
 * Resident self-service on the opportunity board.
 *
 * Every test here is about a boundary, not a happy path. The staff actions in
 * the same module are guarded by a permission; these are guarded by a cookie
 * and by ownership, and the failure they invite is quiet: attaching a resident
 * to a listing staff never published, or letting one resident delete a row
 * that belongs to another. None of that throws, renders red, or shows up in a
 * screenshot — so it is pinned here instead.
 */

import type { MockedFunction } from 'vitest'
import { DatabaseError } from 'pg'
import { getResidentCookie } from '@/lib/portal-auth'
import { expressInterest, withdrawInterest } from '../opportunities'

const mockResidentFindFirst = vi.fn()
const mockOpportunityFindFirst = vi.fn()
const mockApplicationFindFirst = vi.fn()
const mockApplicationCreate = vi.fn()
const mockApplicationDelete = vi.fn()

vi.mock('@/lib/db', async () => ({
  ...(await vi.importActual<object>('@/lib/db')),
  db: {
    query: {
      resident: { findFirst: (...a: unknown[]) => mockResidentFindFirst(...a) },
      opportunity: { findFirst: (...a: unknown[]) => mockOpportunityFindFirst(...a) },
      opportunityApplication: {
        findFirst: (...a: unknown[]) => mockApplicationFindFirst(...a),
      },
    },
    // `await db.insert(t).values(v)` — the source awaits without .returning()
    insert: vi.fn(() => ({ values: (v: unknown) => mockApplicationCreate(v) })),
    delete: vi.fn(() => ({ where: (w: unknown) => mockApplicationDelete(w) })),
  },
}))

vi.mock('next/cache', async () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/audit', async () => ({ logAudit: vi.fn() }))
vi.mock('@/lib/portal-auth', async () => ({ getResidentCookie: vi.fn() }))
vi.mock('@/lib/auth', async () => ({ requirePermission: vi.fn() }))
vi.mock('@/lib/logger', async () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    errorWithCause: vi.fn(),
  },
}))

/** `redirect()` throws in Next; the thrown path is how we read the outcome. */
class RedirectSignal extends Error {
  constructor(readonly to: string) {
    super(`redirect:${to}`)
  }
}

vi.mock('next/navigation', async () => ({
  redirect: vi.fn((to: string) => {
    throw new RedirectSignal(to)
  }),
}))

const mockCookie = getResidentCookie as MockedFunction<typeof getResidentCookie>

/** The pg error shape isUniqueViolation() recognizes (SQLSTATE 23505). */
function uniqueViolation(): Error {
  const error = new DatabaseError('duplicate', 0, 'error')
  error.code = '23505'
  return error
}

/** Run an action and report where it sent the resident. */
async function outcomeOf(run: () => Promise<void>): Promise<string> {
  try {
    await run()
  } catch (error) {
    if (error instanceof RedirectSignal) return error.to
    throw error
  }
  throw new Error('action returned without redirecting')
}

function form(entries: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) data.append(key, value)
  return data
}

const RESIDENT = { id: 'res-1', code: 'RES-AAA111' }

beforeEach(() => {
  vi.clearAllMocks()
  mockCookie.mockResolvedValue(RESIDENT.code)
  mockResidentFindFirst.mockResolvedValue({ id: RESIDENT.id })
  mockApplicationCreate.mockResolvedValue(undefined)
  mockApplicationDelete.mockResolvedValue(undefined)
})

describe('expressInterest', () => {
  it('attaches the resident to a published listing', async () => {
    mockOpportunityFindFirst.mockResolvedValue({
      id: 'opp-1',
      status: 'PUBLISHED',
      seats: 3,
      applications: [{ stage: 'INTERESTED' }],
    })

    const to = await outcomeOf(() => expressInterest(form({ opportunityId: 'opp-1' })))

    expect(to).toBe('/portal/opportunities?ok=interest')
    expect(mockApplicationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        opportunityId: 'opp-1',
        residentId: RESIDENT.id,
        stage: 'INTERESTED',
        createdBy: 'RESIDENT',
      }),
    )
  })

  it('leaves the staff slot empty, because no member of staff has picked it up', async () => {
    // The unclaimed queue is filtered on exactly this. Filling it with the
    // resident's own action would make every self-registered interest look
    // like it already has someone working on it.
    mockOpportunityFindFirst.mockResolvedValue({
      id: 'opp-1',
      status: 'PUBLISHED',
      seats: null,
      applications: [],
    })

    await outcomeOf(() => expressInterest(form({ opportunityId: 'opp-1' })))

    const data = mockApplicationCreate.mock.calls[0][0]
    expect(data.supportedByUserId).toBeUndefined()
  })

  it.each(['DRAFT', 'ARCHIVED'])('refuses a %s listing', async (status) => {
    mockOpportunityFindFirst.mockResolvedValue({
      id: 'opp-1',
      status,
      seats: 5,
      applications: [],
    })

    const to = await outcomeOf(() => expressInterest(form({ opportunityId: 'opp-1' })))

    expect(to).toBe('/portal/opportunities?error=unavailable')
    expect(mockApplicationCreate).not.toHaveBeenCalled()
  })

  it('refuses a listing whose seats are already taken', async () => {
    mockOpportunityFindFirst.mockResolvedValue({
      id: 'opp-1',
      status: 'PUBLISHED',
      seats: 2,
      applications: [{ stage: 'ACCEPTED' }, { stage: 'STARTED' }],
    })

    const to = await outcomeOf(() => expressInterest(form({ opportunityId: 'opp-1' })))

    expect(to).toBe('/portal/opportunities?error=full')
    expect(mockApplicationCreate).not.toHaveBeenCalled()
  })

  it('still has room when the seats it holds are finished ones', async () => {
    // ENDED and DECLINED do not occupy a place. Counting them would retire a
    // listing permanently after enough people had passed through it.
    mockOpportunityFindFirst.mockResolvedValue({
      id: 'opp-1',
      status: 'PUBLISHED',
      seats: 2,
      applications: [{ stage: 'ENDED' }, { stage: 'DECLINED' }],
    })

    const to = await outcomeOf(() => expressInterest(form({ opportunityId: 'opp-1' })))

    expect(to).toBe('/portal/opportunities?ok=interest')
  })

  it('treats a second tap as the success it already is', async () => {
    mockOpportunityFindFirst.mockResolvedValue({
      id: 'opp-1',
      status: 'PUBLISHED',
      seats: null,
      applications: [],
    })
    mockApplicationCreate.mockRejectedValue(uniqueViolation())

    const to = await outcomeOf(() => expressInterest(form({ opportunityId: 'opp-1' })))

    expect(to).toBe('/portal/opportunities?ok=interest')
  })

  it('reports a real database failure as a failure', async () => {
    // The counterpart to the test above: swallowing every error would make the
    // duplicate tolerance quietly hide genuine breakage too.
    mockOpportunityFindFirst.mockResolvedValue({
      id: 'opp-1',
      status: 'PUBLISHED',
      seats: null,
      applications: [],
    })
    mockApplicationCreate.mockRejectedValue(new Error('boom'))

    const to = await outcomeOf(() => expressInterest(form({ opportunityId: 'opp-1' })))

    expect(to).toBe('/portal/opportunities?error=failed')
  })

  it('sends a signed-out visitor to the login page', async () => {
    mockCookie.mockResolvedValue(null)

    const to = await outcomeOf(() => expressInterest(form({ opportunityId: 'opp-1' })))

    expect(to).toBe('/login')
    expect(mockOpportunityFindFirst).not.toHaveBeenCalled()
  })
})

describe('withdrawInterest', () => {
  it('removes an untouched interest the resident registered themselves', async () => {
    mockApplicationFindFirst.mockResolvedValue({
      id: 'app-1',
      residentId: RESIDENT.id,
      opportunityId: 'opp-1',
      createdBy: 'RESIDENT',
      stage: 'INTERESTED',
    })

    const to = await outcomeOf(() => withdrawInterest(form({ applicationId: 'app-1' })))

    expect(to).toBe('/portal/opportunities?ok=withdrawn')
    expect(mockApplicationDelete).toHaveBeenCalledTimes(1)
  })

  it('will not delete another resident row, and does not admit that it exists', async () => {
    // Same answer as for an id that is not in the table at all. A different
    // message would confirm to the holder of a guessed id that some other
    // resident has applied for something.
    mockApplicationFindFirst.mockResolvedValue({
      id: 'app-1',
      residentId: 'someone-else',
      opportunityId: 'opp-1',
      createdBy: 'RESIDENT',
      stage: 'INTERESTED',
    })

    const foreign = await outcomeOf(() => withdrawInterest(form({ applicationId: 'app-1' })))

    mockApplicationFindFirst.mockResolvedValue(null)
    const missing = await outcomeOf(() => withdrawInterest(form({ applicationId: 'app-1' })))

    expect(foreign).toBe(missing)
    expect(mockApplicationDelete).not.toHaveBeenCalled()
  })

  it('will not delete a row staff created', async () => {
    mockApplicationFindFirst.mockResolvedValue({
      id: 'app-1',
      residentId: RESIDENT.id,
      opportunityId: 'opp-1',
      createdBy: 'STAFF',
      stage: 'INTERESTED',
    })

    const to = await outcomeOf(() => withdrawInterest(form({ applicationId: 'app-1' })))

    expect(to).toBe('/portal/opportunities?error=locked')
    expect(mockApplicationDelete).not.toHaveBeenCalled()
  })

  it.each(['APPLIED', 'INTERVIEW', 'ACCEPTED', 'STARTED', 'ENDED'])(
    'will not delete a thread that has reached %s',
    async (stage) => {
      // Past INTERESTED a conversation has happened, and the row is staff's
      // record of it as much as the resident's.
      mockApplicationFindFirst.mockResolvedValue({
        id: 'app-1',
        residentId: RESIDENT.id,
        opportunityId: 'opp-1',
        createdBy: 'RESIDENT',
        stage,
      })

      const to = await outcomeOf(() => withdrawInterest(form({ applicationId: 'app-1' })))

      expect(to).toBe('/portal/opportunities?error=locked')
      expect(mockApplicationDelete).not.toHaveBeenCalled()
    },
  )

  it('sends a signed-out visitor to the login page', async () => {
    mockCookie.mockResolvedValue(null)

    const to = await outcomeOf(() => withdrawInterest(form({ applicationId: 'app-1' })))

    expect(to).toBe('/login')
    expect(mockApplicationFindFirst).not.toHaveBeenCalled()
  })
})
