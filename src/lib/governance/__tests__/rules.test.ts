import {
  buildRuleBook,
  checkUnitLegislation,
  flattenRuleBook,
  openTopics,
  resolveProposalStatus,
  type RuleLike,
} from '../rules'

function orgRule(overrides: Partial<RuleLike> & { id: string }): RuleLike {
  return {
    scope: 'ORG',
    category: 'NOISE',
    title: 'AOZ-Regel',
    body: '...',
    delegation: 'FIXED',
    status: 'ACTIVE',
    version: 1,
    ...overrides,
  }
}

function unitRule(overrides: Partial<RuleLike> & { id: string }): RuleLike {
  return {
    scope: 'UNIT',
    category: 'NOISE',
    title: 'Hausregel',
    body: '...',
    delegation: 'FIXED',
    status: 'ACTIVE',
    version: 1,
    housingUnitId: 'unit-1',
    ...overrides,
  }
}

describe('checkUnitLegislation', () => {
  it('refuses a house rule under a non-negotiable AOZ rule', () => {
    const check = checkUnitLegislation(orgRule({ id: 'r1', delegation: 'FIXED', title: 'Keine Gewalt' }))

    expect(check.allowed).toBe(false)
    // The refusal must explain itself in the resident's own language.
    expect(check.reason).toContain('Keine Gewalt')
    expect(check.reason).toContain('nicht verhandelbar')
  })

  it('allows a stricter house rule but sends it to staff to confirm it is not looser', () => {
    const check = checkUnitLegislation(orgRule({ id: 'r2', delegation: 'UNIT_MAY_STRENGTHEN' }))

    expect(check.allowed).toBe(true)
    expect(check.requiresStaffConfirmation).toBe(true)
  })

  it('lets the house decide a delegated topic on its own', () => {
    const check = checkUnitLegislation(orgRule({ id: 'r3', delegation: 'UNIT_DECIDES' }))

    expect(check.allowed).toBe(true)
    expect(check.requiresStaffConfirmation).toBe(false)
  })

  it('refuses to attach a house rule to an archived AOZ rule', () => {
    const check = checkUnitLegislation(
      orgRule({ id: 'r4', delegation: 'UNIT_DECIDES', status: 'ARCHIVED' })
    )

    expect(check.allowed).toBe(false)
  })

  it('refuses to treat a unit rule as a parent topic', () => {
    const check = checkUnitLegislation(unitRule({ id: 'r5', delegation: 'UNIT_DECIDES' }))

    expect(check.allowed).toBe(false)
  })
})

describe('resolveProposalStatus', () => {
  it('adopts a binding decision on a fully delegated topic without staff', () => {
    expect(resolveProposalStatus('ACCEPTED', 'RESIDENT_BINDING', false)).toBe('ACCEPTED')
  })

  it('routes an advisory decision to staff even when residents agreed', () => {
    expect(resolveProposalStatus('ACCEPTED', 'RESIDENT_ADVISORY', false)).toBe(
      'NEEDS_STAFF_CONFIRMATION'
    )
  })

  it('routes a binding decision to staff when the topic claims to strengthen an AOZ rule', () => {
    expect(resolveProposalStatus('ACCEPTED', 'RESIDENT_BINDING', true)).toBe(
      'NEEDS_STAFF_CONFIRMATION'
    )
  })

  it('expires rather than rejects when the vote never reached quorum', () => {
    // A house that did not vote has not said no — it can try again.
    expect(resolveProposalStatus('NO_QUORUM', 'RESIDENT_BINDING', false)).toBe('EXPIRED')
  })

  it('rejects a blocked consensus proposal', () => {
    expect(resolveProposalStatus('BLOCKED', 'RESIDENT_BINDING', false)).toBe('REJECTED')
  })
})

describe('buildRuleBook', () => {
  const rules = [
    orgRule({ id: 'safety', category: 'SAFETY', delegation: 'FIXED', title: 'Keine Gewalt' }),
    orgRule({ id: 'quiet', category: 'NOISE', delegation: 'UNIT_MAY_STRENGTHEN', title: 'Nachtruhe' }),
    orgRule({ id: 'kitchen', category: 'KITCHEN', delegation: 'UNIT_DECIDES', title: 'Küche' }),
  ]

  it('nests house rules under the AOZ rule they specialise', () => {
    const book = buildRuleBook(rules, [
      unitRule({ id: 'u1', category: 'NOISE', parentRuleId: 'quiet', title: 'Mittagsruhe' }),
    ])

    const noise = book.sections.find((s) => s.category === 'NOISE')
    expect(noise?.entries[0].orgRule.id).toBe('quiet')
    expect(noise?.entries[0].unitRules.map((r) => r.id)).toEqual(['u1'])
    expect(book.totalUnitRules).toBe(1)
  })

  it('orders sections with safety and respect before housekeeping', () => {
    const book = buildRuleBook(rules, [])
    expect(book.sections[0].category).toBe('SAFETY')
  })

  it('marks fixed topics as closed to house decisions', () => {
    const book = buildRuleBook(rules, [])
    const safety = book.sections.find((s) => s.category === 'SAFETY')

    expect(safety?.entries[0].houseMayDecide).toBe(false)
  })

  it('surfaces house rules whose parent AOZ rule is gone instead of dropping them', () => {
    // A silently vanished rule is one people are still held to but cannot read.
    const book = buildRuleBook(rules, [
      unitRule({ id: 'orphan', parentRuleId: 'deleted-topic', title: 'Verwaiste Regel' }),
    ])

    expect(book.orphanedUnitRules.map((r) => r.id)).toEqual(['orphan'])
    expect(flattenRuleBook(book).map((r) => r.id)).toContain('orphan')
  })

  it('excludes archived rules from the book', () => {
    const book = buildRuleBook(rules, [
      unitRule({ id: 'old', parentRuleId: 'kitchen', status: 'ARCHIVED' }),
    ])

    expect(book.totalUnitRules).toBe(0)
    expect(flattenRuleBook(book).map((r) => r.id)).not.toContain('old')
  })

  it('lists topics the house could still decide but has not', () => {
    const book = buildRuleBook(rules, [
      unitRule({ id: 'u1', category: 'NOISE', parentRuleId: 'quiet' }),
    ])

    // quiet is taken; kitchen is still open; safety is never open.
    expect(openTopics(book).map((e) => e.orgRule.id)).toEqual(['kitchen'])
  })
})
