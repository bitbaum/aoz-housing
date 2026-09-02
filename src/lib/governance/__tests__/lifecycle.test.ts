/**
 * Lifecycle tests — the orchestration that turns a vote into a binding rule.
 *
 * This runs unattended (cron + lazily on page load), so the properties worth
 * pinning are the ones nobody would notice going wrong: that a proposal cannot
 * be adopted twice, that the electorate is snapshotted when voting *opens*
 * rather than when the proposal was written, and that a rule is only created
 * when the house actually said yes.
 */

import {
  adoptProposal,
  advanceDueProposals,
  closeProposal,
  expireStaleAgreements,
} from '../lifecycle'
import { conflictAgreement } from '@/lib/db'
import { and, inArray, lt } from 'drizzle-orm'
import { whereParts } from '@/test-utils/drizzle-where'

const mockProposalFindFirst = vi.fn()
const mockProposalFindMany = vi.fn()
const mockPlacementFindMany = vi.fn()
// insert(houseRule).values(v) → (v)
const mockRuleCreate = vi.fn()
// update(houseRule).set(d).where(w) → (d, whereParts)
const mockRuleUpdate = vi.fn()
// The guarded proposal update — returns the rows `.returning()` yields, so a
// test can make it lose the close race by returning [].
const mockProposalUpdate = vi.fn()
// update(conflictAgreement) — recorded with the RAW where tree for comparison.
const mockAgreementUpdate = vi.fn()

vi.mock('@/lib/db', async () => {
  const actual = await vi.importActual<typeof import('@/lib/db')>('@/lib/db')
  const { whereParts: parts } = await vi.importActual<typeof import('@/test-utils/drizzle-where')>(
    '@/test-utils/drizzle-where',
  )
  return {
    ...actual,
    db: {
      query: {
        proposal: {
          findFirst: (...a: unknown[]) => mockProposalFindFirst(...a),
          findMany: (...a: unknown[]) => mockProposalFindMany(...a),
        },
        placement: { findMany: (...a: unknown[]) => mockPlacementFindMany(...a) },
      },
      insert: () => ({ values: (v: unknown) => Promise.resolve(mockRuleCreate(v)) }),
      update: (table: unknown) => ({
        set: (data: unknown) => ({
          where: (w: unknown) => {
            if (table === actual.houseRule) {
              return Promise.resolve(mockRuleUpdate(data, parts(w)))
            }
            const rows =
              table === actual.conflictAgreement
                ? mockAgreementUpdate(data, w)
                : mockProposalUpdate(data, parts(w))
            return Object.assign(Promise.resolve(rows), {
              returning: () => Promise.resolve(rows),
            })
          },
        }),
      }),
    },
  }
})

vi.mock('@/lib/logger', async () => ({
  logger: { errorWithCause: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

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
  vi.clearAllMocks()
  mockProposalUpdate.mockReturnValue([{ id: 'p1' }])
  mockProposalFindMany.mockResolvedValue([])
  mockRuleCreate.mockResolvedValue({ id: 'new-rule' })
  mockRuleUpdate.mockResolvedValue({})
  mockAgreementUpdate.mockReturnValue([])
})

describe('closeProposal', () => {
  it('accepts a passing vote and creates the house rule', async () => {
    mockProposalFindFirst.mockResolvedValue(votingProposal())

    const status = await closeProposal('p1')

    expect(status).toBe('ACCEPTED')
    expect(mockRuleCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: 'UNIT',
        housingUnitId: 'unit-1',
        parentRuleId: ORG_TOPIC.id,
        adoptedByProposalId: 'p1',
      }),
    )
  })

  it('records the plain-language explanation as the outcome', async () => {
    mockProposalFindFirst.mockResolvedValue(votingProposal())

    await closeProposal('p1')

    const [data] = mockProposalUpdate.mock.calls[0]
    expect(data.outcomeSummary).toContain('Angenommen')
    expect(data.outcomeSummary).toContain('3 dafür')
  })

  it('creates no rule when the house voted it down', async () => {
    mockProposalFindFirst.mockResolvedValue(
      votingProposal({ votes: [{ choice: 'NO' }, { choice: 'NO' }, { choice: 'YES' }] }),
    )

    const status = await closeProposal('p1')

    expect(status).toBe('REJECTED')
    expect(mockRuleCreate).not.toHaveBeenCalled()
  })

  it('expires rather than rejects when quorum was never reached', async () => {
    // A house that did not vote has not said no — it can try again.
    mockProposalFindFirst.mockResolvedValue(votingProposal({ votes: [{ choice: 'YES' }] }))

    expect(await closeProposal('p1')).toBe('EXPIRED')
    expect(mockRuleCreate).not.toHaveBeenCalled()
  })

  it('holds an advisory decision for staff instead of adopting it', async () => {
    mockProposalFindFirst.mockResolvedValue(votingProposal({ decisionMode: 'RESIDENT_ADVISORY' }))

    expect(await closeProposal('p1')).toBe('NEEDS_STAFF_CONFIRMATION')
    expect(mockRuleCreate).not.toHaveBeenCalled()
  })

  it('holds a decision that claims to strengthen an AOZ rule', async () => {
    mockProposalFindFirst.mockResolvedValue(
      votingProposal({
        parentOrgRule: { ...ORG_TOPIC, delegation: 'UNIT_MAY_STRENGTHEN' },
      }),
    )

    expect(await closeProposal('p1')).toBe('NEEDS_STAFF_CONFIRMATION')
    expect(mockRuleCreate).not.toHaveBeenCalled()
  })

  it('does nothing to a proposal that is not open for voting', async () => {
    mockProposalFindFirst.mockResolvedValue(votingProposal({ status: 'ACCEPTED' }))

    expect(await closeProposal('p1')).toBeNull()
    expect(mockProposalUpdate).not.toHaveBeenCalled()
  })

  it('cannot adopt twice when two callers close the same proposal at once', async () => {
    // The guarded update loses the race and must not create a second rule.
    mockProposalFindFirst.mockResolvedValue(votingProposal())
    mockProposalUpdate.mockReturnValue([])

    expect(await closeProposal('p1')).toBeNull()
    expect(mockRuleCreate).not.toHaveBeenCalled()
  })

  it('returns null for a proposal that no longer exists', async () => {
    mockProposalFindFirst.mockResolvedValue(null)
    expect(await closeProposal('p1')).toBeNull()
  })
})

describe('adoptProposal', () => {
  it('archives the target rule on a repeal', async () => {
    mockProposalFindFirst.mockResolvedValue(
      votingProposal({ type: 'REPEAL_RULE', targetRuleId: 'rule-9' }),
    )

    await adoptProposal('p1')

    expect(mockRuleUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'ARCHIVED' }), {
      id: 'rule-9',
    })
  })

  it('bumps the version on an amendment so everyone re-acknowledges', async () => {
    mockProposalFindFirst.mockResolvedValue(
      votingProposal({
        type: 'AMEND_RULE',
        targetRule: { id: 'rule-9', version: 3 },
        targetRuleId: 'rule-9',
      }),
    )

    await adoptProposal('p1')

    expect(mockRuleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ version: 4 }),
      expect.anything(),
    )
  })

  it('records a one-off house decision without creating a standing rule', async () => {
    mockProposalFindFirst.mockResolvedValue(votingProposal({ type: 'HOUSE_DECISION' }))

    await adoptProposal('p1')

    expect(mockRuleCreate).not.toHaveBeenCalled()
    expect(mockRuleUpdate).not.toHaveBeenCalled()
  })
})

describe('advanceDueProposals', () => {
  it('snapshots the electorate when voting opens, not when the proposal was written', async () => {
    // People move in and out; a quorum measured against last week's roster is
    // not a quorum.
    mockProposalFindMany
      .mockResolvedValueOnce([{ id: 'p1', housingUnitId: 'unit-1' }]) // due to open
      .mockResolvedValueOnce([]) // due to close
    mockPlacementFindMany.mockResolvedValue([
      { residentId: 'r1' },
      { residentId: 'r2' },
      { residentId: 'r2' }, // duplicate placement must not inflate the electorate
      { residentId: 'r3' },
    ])

    const result = await advanceDueProposals(new Date('2026-03-10T00:00:00Z'))

    expect(result.opened).toBe(1)
    expect(mockProposalUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'VOTING', eligibleVoterCount: 3 }),
      expect.anything(),
    )
  })

  it('closes proposals whose voting window has elapsed', async () => {
    mockProposalFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'p1' }])
    mockProposalFindFirst.mockResolvedValue(votingProposal())

    const result = await advanceDueProposals(new Date())

    expect(result.closed).toBe(1)
  })

  it('never throws — it runs inside page loads', async () => {
    mockProposalFindMany.mockRejectedValue(new Error('db down'))

    await expect(advanceDueProposals(new Date())).resolves.toEqual({ opened: 0, closed: 0 })
  })

  it('scopes to one unit when asked', async () => {
    mockProposalFindMany.mockResolvedValue([])

    await advanceDueProposals(new Date(), 'unit-7')

    expect(whereParts(mockProposalFindMany.mock.calls[0][0].where)).toMatchObject({
      housingUnitId: 'unit-7',
    })
  })
})

describe('expireStaleAgreements', () => {
  it('expires agreements nobody reviewed, so silence never counts as success', async () => {
    mockAgreementUpdate.mockReturnValue([{ id: 'a1' }, { id: 'a2' }])

    const count = await expireStaleAgreements(new Date('2026-03-20T00:00:00Z'), 7)

    expect(count).toBe(2)
    // Compared against the REAL drizzle expression — same statuses, same
    // cutoff, without hand-parsing the SQL tree.
    expect(mockAgreementUpdate).toHaveBeenCalledWith(
      { status: 'EXPIRED' },
      and(
        inArray(conflictAgreement.status, ['PROPOSED', 'ACCEPTED']),
        lt(conflictAgreement.reviewDate, new Date('2026-03-13T00:00:00Z')),
      ),
    )
  })

  it('leaves agreements still inside their grace period alone', async () => {
    await expireStaleAgreements(new Date('2026-03-20T00:00:00Z'), 7)

    const cutoff = whereParts(mockAgreementUpdate.mock.calls[0][1]).reviewDate as Date
    expect(cutoff.toISOString().slice(0, 10)).toBe('2026-03-13')
  })
})
