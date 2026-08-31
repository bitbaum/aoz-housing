/**
 * What the resident board hands back.
 *
 * The rule worth a test is the one that is invisible when it breaks: a
 * resident may learn whether a place is still free, and may not learn who is
 * in it. Returning the applicant rows and simply not rendering them looks
 * identical on screen — the payload is the leak, not the markup — so the shape
 * of the returned object is asserted directly.
 */

import type { Mock, Mocked } from 'vitest'
import { prisma } from '@/lib/db'
import { residentOpportunityBoard } from '../opportunities'

vi.mock('@/lib/db', () => ({
  prisma: {
    opportunityApplication: { findMany: vi.fn() },
    opportunity: { findMany: vi.fn() },
  },
}))

const mockPrisma = prisma as Mocked<typeof prisma>

function listing(overrides: Record<string, unknown> = {}) {
  return {
    id: 'opp-1',
    title: 'Mittagstisch',
    status: 'PUBLISHED',
    seats: 3,
    startsAt: null,
    updatedAt: new Date('2026-08-01'),
    applications: [{ stage: 'ACCEPTED' }],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(mockPrisma.opportunityApplication.findMany as Mock).mockResolvedValue([])
  ;(mockPrisma.opportunity.findMany as Mock).mockResolvedValue([listing()])
})

describe('residentOpportunityBoard', () => {
  it('never hands the resident the other applicants', async () => {
    const { open } = await residentOpportunityBoard('res-1')

    expect(open).toHaveLength(1)
    expect(open[0]).not.toHaveProperty('applications')
  })

  it('reports the seats left rather than the people in them', async () => {
    const { open } = await residentOpportunityBoard('res-1')

    expect(open[0].seatsLeft).toBe(2)
  })

  it('reports an unstated capacity as unknown, not as full', async () => {
    // `null` seats means the listing never named a number. Rendering that as
    // zero would take an open place off the board for everyone.
    ;(mockPrisma.opportunity.findMany as Mock).mockResolvedValue([listing({ seats: null })])

    const { open } = await residentOpportunityBoard('res-1')

    expect(open[0].seatsLeft).toBeNull()
  })

  it('only ever asks for published listings', async () => {
    await residentOpportunityBoard('res-1')

    const where = (mockPrisma.opportunity.findMany as Mock).mock.calls[0][0].where
    expect(where).toEqual({ status: 'PUBLISHED' })
  })

  it('drops listings the resident is already attached to', async () => {
    // Otherwise the same place appears twice — once under "your placements"
    // with a stage, and once under "open" with a button that cannot work.
    ;(mockPrisma.opportunityApplication.findMany as Mock).mockResolvedValue([
      { id: 'app-1', opportunityId: 'opp-1', stage: 'INTERESTED', opportunity: listing() },
    ])

    const { mine, open } = await residentOpportunityBoard('res-1')

    expect(mine).toHaveLength(1)
    expect(open).toHaveLength(0)
  })

  it('puts the places someone can still take first', async () => {
    ;(mockPrisma.opportunity.findMany as Mock).mockResolvedValue([
      listing({ id: 'full', seats: 1, applications: [{ stage: 'STARTED' }] }),
      listing({ id: 'open', seats: 2, applications: [] }),
    ])

    const { open } = await residentOpportunityBoard('res-1')

    expect(open.map((row) => row.id)).toEqual(['open', 'full'])
  })

  it('scopes the applications it returns to the asking resident', async () => {
    await residentOpportunityBoard('res-1')

    const where = (mockPrisma.opportunityApplication.findMany as Mock).mock.calls[0][0].where
    expect(where).toEqual({ residentId: 'res-1' })
  })
})
