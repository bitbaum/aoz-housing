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

import type { Mock, Mocked, MockedFunction } from 'vitest'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { getResidentCookie } from '@/lib/portal-auth'
import { expressInterest, withdrawInterest } from '../opportunities'

vi.mock('@/lib/db', () => ({
  prisma: {
    resident: { findUnique: vi.fn() },
    opportunity: { findUnique: vi.fn() },
    opportunityApplication: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }))
vi.mock('@/lib/portal-auth', () => ({ getResidentCookie: vi.fn() }))
vi.mock('@/lib/auth', () => ({ requirePermission: vi.fn() }))
vi.mock('@/lib/logger', () => ({
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

vi.mock('next/navigation', () => ({
  redirect: vi.fn((to: string) => {
    throw new RedirectSignal(to)
  }),
}))

const mockPrisma = prisma as Mocked<typeof prisma>
const mockCookie = getResidentCookie as MockedFunction<typeof getResidentCookie>

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
  ;(mockPrisma.resident.findUnique as Mock).mockResolvedValue({ id: RESIDENT.id })
})

describe('expressInterest', () => {
  it('attaches the resident to a published listing', async () => {
    ;(mockPrisma.opportunity.findUnique as Mock).mockResolvedValue({
      id: 'opp-1',
      status: 'PUBLISHED',
      seats: 3,
      applications: [{ stage: 'INTERESTED' }],
    })

    const to = await outcomeOf(() => expressInterest(form({ opportunityId: 'opp-1' })))

    expect(to).toBe('/portal/opportunities?ok=interest')
    expect(mockPrisma.opportunityApplication.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        opportunityId: 'opp-1',
        residentId: RESIDENT.id,
        stage: 'INTERESTED',
        createdBy: 'RESIDENT',
      }),
    })
  })

  it('leaves the staff slot empty, because no member of staff has picked it up', async () => {
    // The unclaimed queue is filtered on exactly this. Filling it with the
    // resident's own action would make every self-registered interest look
    // like it already has someone working on it.
    ;(mockPrisma.opportunity.findUnique as Mock).mockResolvedValue({
      id: 'opp-1',
      status: 'PUBLISHED',
      seats: null,
      applications: [],
    })

    await outcomeOf(() => expressInterest(form({ opportunityId: 'opp-1' })))

    const data = (mockPrisma.opportunityApplication.create as Mock).mock.calls[0][0].data
    expect(data.supportedByUserId).toBeUndefined()
  })

  it.each(['DRAFT', 'ARCHIVED'])('refuses a %s listing', async (status) => {
    ;(mockPrisma.opportunity.findUnique as Mock).mockResolvedValue({
      id: 'opp-1',
      status,
      seats: 5,
      applications: [],
    })

    const to = await outcomeOf(() => expressInterest(form({ opportunityId: 'opp-1' })))

    expect(to).toBe('/portal/opportunities?error=unavailable')
    expect(mockPrisma.opportunityApplication.create).not.toHaveBeenCalled()
  })

  it('refuses a listing whose seats are already taken', async () => {
    ;(mockPrisma.opportunity.findUnique as Mock).mockResolvedValue({
      id: 'opp-1',
      status: 'PUBLISHED',
      seats: 2,
      applications: [{ stage: 'ACCEPTED' }, { stage: 'STARTED' }],
    })

    const to = await outcomeOf(() => expressInterest(form({ opportunityId: 'opp-1' })))

    expect(to).toBe('/portal/opportunities?error=full')
    expect(mockPrisma.opportunityApplication.create).not.toHaveBeenCalled()
  })

  it('still has room when the seats it holds are finished ones', async () => {
    // ENDED and DECLINED do not occupy a place. Counting them would retire a
    // listing permanently after enough people had passed through it.
    ;(mockPrisma.opportunity.findUnique as Mock).mockResolvedValue({
      id: 'opp-1',
      status: 'PUBLISHED',
      seats: 2,
      applications: [{ stage: 'ENDED' }, { stage: 'DECLINED' }],
    })

    const to = await outcomeOf(() => expressInterest(form({ opportunityId: 'opp-1' })))

    expect(to).toBe('/portal/opportunities?ok=interest')
  })

  it('treats a second tap as the success it already is', async () => {
    ;(mockPrisma.opportunity.findUnique as Mock).mockResolvedValue({
      id: 'opp-1',
      status: 'PUBLISHED',
      seats: null,
      applications: [],
    })
    ;(mockPrisma.opportunityApplication.create as Mock).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    )

    const to = await outcomeOf(() => expressInterest(form({ opportunityId: 'opp-1' })))

    expect(to).toBe('/portal/opportunities?ok=interest')
  })

  it('reports a real database failure as a failure', async () => {
    // The counterpart to the test above: swallowing every error would make the
    // duplicate tolerance quietly hide genuine breakage too.
    ;(mockPrisma.opportunity.findUnique as Mock).mockResolvedValue({
      id: 'opp-1',
      status: 'PUBLISHED',
      seats: null,
      applications: [],
    })
    ;(mockPrisma.opportunityApplication.create as Mock).mockRejectedValue(new Error('boom'))

    const to = await outcomeOf(() => expressInterest(form({ opportunityId: 'opp-1' })))

    expect(to).toBe('/portal/opportunities?error=failed')
  })

  it('sends a signed-out visitor to the login page', async () => {
    mockCookie.mockResolvedValue(null)

    const to = await outcomeOf(() => expressInterest(form({ opportunityId: 'opp-1' })))

    expect(to).toBe('/login')
    expect(mockPrisma.opportunity.findUnique).not.toHaveBeenCalled()
  })
})

describe('withdrawInterest', () => {
  it('removes an untouched interest the resident registered themselves', async () => {
    ;(mockPrisma.opportunityApplication.findUnique as Mock).mockResolvedValue({
      id: 'app-1',
      residentId: RESIDENT.id,
      opportunityId: 'opp-1',
      createdBy: 'RESIDENT',
      stage: 'INTERESTED',
    })

    const to = await outcomeOf(() => withdrawInterest(form({ applicationId: 'app-1' })))

    expect(to).toBe('/portal/opportunities?ok=withdrawn')
    expect(mockPrisma.opportunityApplication.delete).toHaveBeenCalledWith({
      where: { id: 'app-1' },
    })
  })

  it('will not delete another resident row, and does not admit that it exists', async () => {
    // Same answer as for an id that is not in the table at all. A different
    // message would confirm to the holder of a guessed id that some other
    // resident has applied for something.
    ;(mockPrisma.opportunityApplication.findUnique as Mock).mockResolvedValue({
      id: 'app-1',
      residentId: 'someone-else',
      opportunityId: 'opp-1',
      createdBy: 'RESIDENT',
      stage: 'INTERESTED',
    })

    const foreign = await outcomeOf(() => withdrawInterest(form({ applicationId: 'app-1' })))

    ;(mockPrisma.opportunityApplication.findUnique as Mock).mockResolvedValue(null)
    const missing = await outcomeOf(() => withdrawInterest(form({ applicationId: 'app-1' })))

    expect(foreign).toBe(missing)
    expect(mockPrisma.opportunityApplication.delete).not.toHaveBeenCalled()
  })

  it('will not delete a row staff created', async () => {
    ;(mockPrisma.opportunityApplication.findUnique as Mock).mockResolvedValue({
      id: 'app-1',
      residentId: RESIDENT.id,
      opportunityId: 'opp-1',
      createdBy: 'STAFF',
      stage: 'INTERESTED',
    })

    const to = await outcomeOf(() => withdrawInterest(form({ applicationId: 'app-1' })))

    expect(to).toBe('/portal/opportunities?error=locked')
    expect(mockPrisma.opportunityApplication.delete).not.toHaveBeenCalled()
  })

  it.each(['APPLIED', 'INTERVIEW', 'ACCEPTED', 'STARTED', 'ENDED'])(
    'will not delete a thread that has reached %s',
    async (stage) => {
      // Past INTERESTED a conversation has happened, and the row is staff's
      // record of it as much as the resident's.
      ;(mockPrisma.opportunityApplication.findUnique as Mock).mockResolvedValue({
        id: 'app-1',
        residentId: RESIDENT.id,
        opportunityId: 'opp-1',
        createdBy: 'RESIDENT',
        stage,
      })

      const to = await outcomeOf(() => withdrawInterest(form({ applicationId: 'app-1' })))

      expect(to).toBe('/portal/opportunities?error=locked')
      expect(mockPrisma.opportunityApplication.delete).not.toHaveBeenCalled()
    },
  )

  it('sends a signed-out visitor to the login page', async () => {
    mockCookie.mockResolvedValue(null)

    const to = await outcomeOf(() => withdrawInterest(form({ applicationId: 'app-1' })))

    expect(to).toBe('/login')
    expect(mockPrisma.opportunityApplication.findUnique).not.toHaveBeenCalled()
  })
})
