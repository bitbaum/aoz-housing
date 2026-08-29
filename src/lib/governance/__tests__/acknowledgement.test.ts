import {
  isWithinAcknowledgementGracePeriod,
  outstandingForResident,
  unitCoverage,
} from '../acknowledgement'
import type { RuleLike } from '../rules'

function rule(id: string, version = 1): RuleLike {
  return {
    id,
    scope: 'ORG',
    category: 'NOISE',
    title: `Regel ${id}`,
    body: '...',
    delegation: 'FIXED',
    status: 'ACTIVE',
    version,
  }
}

describe('outstandingForResident', () => {
  const rules = [rule('a'), rule('b'), rule('c')]

  it('lists rules the resident has never acknowledged', () => {
    const outstanding = outstandingForResident(
      rules,
      [{ ruleId: 'a', residentId: 'r1', ruleVersion: 1 }],
      'r1',
    )

    expect(outstanding.map((o) => o.rule.id)).toEqual(['b', 'c'])
    expect(outstanding[0].isAmendment).toBe(false)
  })

  it('requires re-acknowledgement after a rule is amended', () => {
    // Nobody is held to wording they never saw.
    const amended = [rule('a', 2)]
    const outstanding = outstandingForResident(
      amended,
      [{ ruleId: 'a', residentId: 'r1', ruleVersion: 1 }],
      'r1',
    )

    expect(outstanding).toHaveLength(1)
    expect(outstanding[0].isAmendment).toBe(true)
    expect(outstanding[0].acknowledgedVersion).toBe(1)
  })

  it('ignores other residents acknowledgements', () => {
    const outstanding = outstandingForResident(
      [rule('a')],
      [{ ruleId: 'a', residentId: 'someone-else', ruleVersion: 1 }],
      'r1',
    )

    expect(outstanding).toHaveLength(1)
  })

  it('accepts an acknowledgement newer than the current version', () => {
    const outstanding = outstandingForResident(
      [rule('a', 2)],
      [{ ruleId: 'a', residentId: 'r1', ruleVersion: 3 }],
      'r1',
    )

    expect(outstanding).toHaveLength(0)
  })
})

describe('unitCoverage', () => {
  it('measures how much of the rule book the house has actually seen', () => {
    const rules = [rule('a'), rule('b')]
    const coverage = unitCoverage(
      rules,
      [
        { ruleId: 'a', residentId: 'r1', ruleVersion: 1 },
        { ruleId: 'b', residentId: 'r1', ruleVersion: 1 },
        { ruleId: 'a', residentId: 'r2', ruleVersion: 1 },
      ],
      ['r1', 'r2'],
    )

    expect(coverage.requiredAcknowledgements).toBe(4)
    expect(coverage.completedAcknowledgements).toBe(3)
    expect(coverage.coveragePercent).toBe(75)
    expect(coverage.residentsWithGaps).toEqual([{ residentId: 'r2', outstandingCount: 1 }])
    expect(coverage.needsAttention).toBe(true)
  })

  it('reports full coverage when everyone has seen everything', () => {
    const coverage = unitCoverage(
      [rule('a')],
      [{ ruleId: 'a', residentId: 'r1', ruleVersion: 1 }],
      ['r1'],
    )

    expect(coverage.coveragePercent).toBe(100)
    expect(coverage.needsAttention).toBe(false)
  })

  it('reports full coverage for a house with no rules rather than dividing by zero', () => {
    const coverage = unitCoverage([], [], ['r1', 'r2'])

    expect(coverage.coveragePercent).toBe(100)
    expect(coverage.needsAttention).toBe(false)
  })

  it('handles an empty house', () => {
    const coverage = unitCoverage([rule('a')], [], [])

    expect(coverage.coveragePercent).toBe(100)
    expect(coverage.residentsWithGaps).toEqual([])
  })
})

describe('isWithinAcknowledgementGracePeriod', () => {
  it('distinguishes a new arrival from someone long overdue', () => {
    const start = new Date('2026-03-01T00:00:00Z')

    expect(isWithinAcknowledgementGracePeriod(start, new Date('2026-03-04T00:00:00Z'))).toBe(true)
    expect(isWithinAcknowledgementGracePeriod(start, new Date('2026-04-15T00:00:00Z'))).toBe(false)
  })
})
