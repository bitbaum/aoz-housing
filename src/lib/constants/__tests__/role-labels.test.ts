import { describe, expect, it } from 'vitest'

import { ROLE_LABELS, SCOPE_LABELS } from '@/lib/constants/labels/auth'
import { STAFF_ROLES, STAFF_SCOPES } from '@/lib/auth/role-policy'

/**
 * Every staff role has a German word, and every scope too.
 *
 * A missing entry here does not throw and does not fail a type check —
 * `ROLE_LABELS` is a `Record<string, string>`, so the lookup falls through and
 * the UI prints the raw enum. That is exactly what happened: `LIEGENSCHAFTEN`
 * was added to the enum, granted permissions, given a nav entry and a
 * dashboard, and appeared on the team roster in SCREAMING_SNAKE_CASE beside
 * "Betreuung" and "Jobcoach" from the day it shipped. Nothing failed. It was
 * found by opening the settings page and looking at it.
 *
 * The half-pair is the pattern worth naming: adding an enum value touches the
 * schema, the policy and the nav, and the label map is the one place with no
 * compiler pressure behind it.
 */

describe('every staff role has a German label', () => {
  it.each(STAFF_ROLES)('%s', (role) => {
    const label = ROLE_LABELS[role]
    expect({ role, label }).toEqual({ role, label: expect.any(String) })
    expect(label.trim()).not.toBe('')
  })

  it('never renders a raw enum value', () => {
    // The tell is SCREAMING_SNAKE_CASE reaching a reader. A label that equals
    // its own key is a lookup that fell through, even when a string comes back.
    const rawLooking = STAFF_ROLES.filter((role) => ROLE_LABELS[role] === role)
    expect(rawLooking).toEqual([])
  })

  it('has no label for a role that does not exist', () => {
    // The other direction: a leftover entry for a retired role is how a menu
    // offers something nobody can be.
    const orphans = Object.keys(ROLE_LABELS).filter(
      (key) => !(STAFF_ROLES as readonly string[]).includes(key),
    )
    expect(orphans).toEqual([])
  })
})

describe('a label does not claim a rank the role does not confer', () => {
  it('does not call ADMIN "Leitung"', () => {
    // ADMIN is RETIRED — kept so live JWTs and existing rows resolve. What it
    // grants is ALL_DOMAINS scope plus isSystemAdmin: reconfiguring the
    // product. "Leitung" names an organisational rank AOZ genuinely has; this
    // file used to hand that word to the one role that does not confer it,
    // including on the public login page.
    //
    // It also undercut the three-axis split. A Teamleiter*in Betreuung is
    // deliberately expressible WITHOUT this role — BETREUUNG + ALL_DOMAINS +
    // NOT isSystemAdmin — which is the whole reason there is no LEITUNG enum
    // value. Calling ADMIN "Leitung" quietly reintroduced the thing the split
    // exists to avoid.
    expect(ROLE_LABELS.ADMIN).not.toBe('Leitung')
  })

  it('reserves the word entirely', () => {
    // Any role, not just ADMIN. Leading a care team is reach over that team's
    // clients, never the right to reconfigure the product, so no single label
    // in this map can honestly carry it.
    const claiming = Object.entries(ROLE_LABELS)
      .filter(([, label]) => /leitung/i.test(label))
      .map(([role]) => role)
    expect(claiming).toEqual([])
  })
})

describe('every scope has a German label', () => {
  it.each(STAFF_SCOPES)('%s', (scope) => {
    const label = SCOPE_LABELS[scope]
    expect({ scope, label }).toEqual({ scope, label: expect.any(String) })
    expect(label.trim()).not.toBe('')
  })
})
