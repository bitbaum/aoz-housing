/**
 * Lifecycle tests — the orchestration that turns a vote into a binding rule.
 *
 * This runs unattended (cron + lazily on page load), so the properties worth
 * pinning are the ones nobody would notice going wrong: that a proposal cannot
 * be adopted twice, that the electorate is snapshotted when voting *opens*
 * rather than when the proposal was written, and that a rule is only created
 * when the house actually said yes.
 */

import { prisma } from '@/lib/db'
import { adoptProposal, advanceDueProposals, closeProposal, expireStaleAgreements } from '../lifecycle'

jest.mock('@/lib/db', () => ({
  prisma: {
    proposal: { findMany: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
    houseRule: { create: jest.fn(), update: jest.fn() },
    placement: { findMany: jest.fn() },
    conflictAgreement: { updateMany: jest.fn() },
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: { errorWithCause: jest.fn(), info: jest.fn(), warn: jest.fn() },
}))

const mockProposal = prisma.proposal as unknown as {
  findMany: jest.Mock
  findUnique: jest.Mock
  updateMany: jest.Mock
}
const mockRule = prisma.houseRule as unknown as { create: jest.Mock; update: jest.Mock }
const mockPlacement = prisma.placement as unknown as { findMany: jest.Mock }
const mockAgreement = prisma.conflictAgreement as unknown as { updateMany: jest.Mock }

const ORG_TOPIC = {
  id: 'org-kitchen',
  scope: 'ORG',
  status: 'ACTIVE',
  category: 'KITCHEN',
  delegation: 'UNIT_DECIDES',
  title: 'Küche',
}

function votingProposal(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    housingUnitId: 'unit-1',
    status: 'VOTING',
    type: 'ADD_RULE',
    title: 'Putzplan',
    body: 'Jede Woche eine Person.',
    decisionMode: 'RESIDENT_BINDING',
    threshold: 'SIMPLE_MAJORITY',
    quorumPercent: 50,
    approvalPercent: 51,
    eligibleVoterCount: 4,
    votes: [{ choice: 'YES' }, { choice: 'YES' }, { choice: 'YES' }],
    parentOrgRule: ORG_TOPIC,
    parentOrgRuleId: ORG_TOPIC.id,
    targetRule: null,
    targetRuleId: null,
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockProposal.updateMany.mockResolvedValue({ count: 1 })
  mockProposal.findMany.mockResolvedValue([])
  mockRule.create.mockResolvedValue({ id: 'new-rule' })
  mockRule.update.mockResolvedValue({})
  mockAgreement.updateMany.mockResolvedValue({ count: 0 })
})

describe('closeProposal', () => {
  it('accepts a passing vote and creates the house rule', async () => {
    mockProposal.findUnique.mockResolvedValue(votingProposal())

    const status = await closeProposal('p1')

    expect(status).toBe('ACCEPTED')
    expect(mockRule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          scope: 'UNIT',
          housingUnitId: 'unit-1',
          parentRuleId: ORG_TOPIC.id,
          adoptedByProposalId: 'p1',
        }),
      })
    )
  })

  it('records the plain-language explanation as the outcome', async () => {
    mockProposal.findUnique.mockResolvedValue(votingProposal())

    await closeProposal('p1')

    const update = mockProposal.updateMany.mock.calls[0][0]
    expect(update.data.outcomeSummary).toContain('Angenommen')
    expect(update.data.outcomeSummary).toContain('3 dafür')
  })

  it('creates no rule when the house voted it down', async () => {
    mockProposal.findUnique.mockResolvedValue(
      votingProposal({ votes: [{ choice: 'NO' }, { choice: 'NO' }, { choice: 'YES' }] })
    )

    const status = await closeProposal('p1')

    expect(status).toBe('REJECTED')
    expect(mockRule.create).not.toHaveBeenCalled()
  })

  it('expires rather than rejects when quorum was never reached', async () => {
    // A house that did not vote has not said no — it can try again.
    mockProposal.findUnique.mockResolvedValue(votingProposal({ votes: [{ choice: 'YES' }] }))

    expect(await closeProposal('p1')).toBe('EXPIRED')
    expect(mockRule.create).not.toHaveBeenCalled()
  })

  it('holds an advisory decision for staff instead of adopting it', async () => {
    mockProposal.findUnique.mockResolvedValue(
      votingProposal({ decisionMode: 'RESIDENT_ADVISORY' })
    )

    expect(await closeProposal('p1')).toBe('NEEDS_STAFF_CONFIRMATION')
    expect(mockRule.create).not.toHaveBeenCalled()
  })

  it('holds a decision that claims to strengthen an AOZ rule', async () => {
    mockProposal.findUnique.mockResolvedValue(
      votingProposal({
        parentOrgRule: { ...ORG_TOPIC, delegation: 'UNIT_MAY_STRENGTHEN' },
      })
    )

    expect(await closeProposal('p1')).toBe('NEEDS_STAFF_CONFIRMATION')
    expect(mockRule.create).not.toHaveBeenCalled()
  })

  it('does nothing to a proposal that is not open for voting', async () => {
    mockProposal.findUnique.mockResolvedValue(votingProposal({ status: 'ACCEPTED' }))

    expect(await closeProposal('p1')).toBeNull()
    expect(mockProposal.updateMany).not.toHaveBeenCalled()
  })

  it('cannot adopt twice when two callers close the same proposal at once', async () => {
    // The guarded update loses the race and must not create a second rule.
    mockProposal.findUnique.mockResolvedValue(votingProposal())
    mockProposal.updateMany.mockResolvedValue({ count: 0 })

    expect(await closeProposal('p1')).toBeNull()
    expect(mockRule.create).not.toHaveBeenCalled()
  })

  it('returns null for a proposal that no longer exists', async () => {
    mockProposal.findUnique.mockResolvedValue(null)
    expect(await closeProposal('p1')).toBeNull()
  })
})

describe('adoptProposal', () => {
  it('archives the target rule on a repeal', async () => {
    mockProposal.findUnique.mockResolvedValue(
      votingProposal({ type: 'REPEAL_RULE', targetRuleId: 'rule-9' })
    )

    await adoptProposal('p1')

    expect(mockRule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rule-9' },
        data: expect.objectContaining({ status: 'ARCHIVED' }),
      })
    )
  })

  it('bumps the version on an amendment so everyone re-acknowledges', async () => {
    mockProposal.findUnique.mockResolvedValue(
      votingProposal({
        type: 'AMEND_RULE',
        targetRule: { id: 'rule-9', version: 3 },
        targetRuleId: 'rule-9',
      })
    )

    await adoptProposal('p1')

    expect(mockRule.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ version: 4 }) })
    )
  })

  it('records a one-off house decision without creating a standing rule', async () => {
    mockProposal.findUnique.mockResolvedValue(votingProposal({ type: 'HOUSE_DECISION' }))

    await adoptProposal('p1')

    expect(mockRule.create).not.toHaveBeenCalled()
    expect(mockRule.update).not.toHaveBeenCalled()
  })
})

describe('advanceDueProposals', () => {
  it('snapshots the electorate when voting opens, not when the proposal was written', async () => {
    // People move in and out; a quorum measured against last week's roster is
    // not a quorum.
    mockProposal.findMany
      .mockResolvedValueOnce([{ id: 'p1', housingUnitId: 'unit-1' }]) // due to open
      .mockResolvedValueOnce([]) // due to close
    mockPlacement.findMany.mockResolvedValue([
      { residentId: 'r1' },
      { residentId: 'r2' },
      { residentId: 'r2' }, // duplicate placement must not inflate the electorate
      { residentId: 'r3' },
    ])

    const result = await advanceDueProposals(new Date('2026-03-10T00:00:00Z'))

    expect(result.opened).toBe(1)
    expect(mockProposal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'VOTING', eligibleVoterCount: 3 }),
      })
    )
  })

  it('closes proposals whose voting window has elapsed', async () => {
    mockProposal.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'p1' }])
    mockProposal.findUnique.mockResolvedValue(votingProposal())

    const result = await advanceDueProposals(new Date())

    expect(result.closed).toBe(1)
  })

  it('never throws — it runs inside page loads', async () => {
    mockProposal.findMany.mockRejectedValue(new Error('db down'))

    await expect(advanceDueProposals(new Date())).resolves.toEqual({ opened: 0, closed: 0 })
  })

  it('scopes to one unit when asked', async () => {
    mockProposal.findMany.mockResolvedValue([])

    await advanceDueProposals(new Date(), 'unit-7')

    expect(mockProposal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ housingUnitId: 'unit-7' }) })
    )
  })
})

describe('expireStaleAgreements', () => {
  it('expires agreements nobody reviewed, so silence never counts as success', async () => {
    mockAgreement.updateMany.mockResolvedValue({ count: 2 })

    const count = await expireStaleAgreements(new Date('2026-03-20T00:00:00Z'), 7)

    expect(count).toBe(2)
    const args = mockAgreement.updateMany.mock.calls[0][0]
    expect(args.where.status).toEqual({ in: ['PROPOSED', 'ACCEPTED'] })
    expect(args.data).toEqual({ status: 'EXPIRED' })
  })

  it('leaves agreements still inside their grace period alone', async () => {
    await expireStaleAgreements(new Date('2026-03-20T00:00:00Z'), 7)

    const cutoff = mockAgreement.updateMany.mock.calls[0][0].where.reviewDate.lt as Date
    expect(cutoff.toISOString().slice(0, 10)).toBe('2026-03-13')
  })
})
