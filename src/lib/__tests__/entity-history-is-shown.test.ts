import { readFileSync } from 'fs'
import { join } from 'path'

import { describe, expect, it } from 'vitest'

/**
 * "Who changed this?" answered where the record is.
 *
 * `getEntityAuditLog` was written for exactly this and had no caller anywhere
 * in the product. #211 gave the trail a system-wide feed, which answers a
 * different question — an integrity view for a system admin. This is the
 * day-to-day one a caseworker actually has: who edited this client's dossier,
 * and when.
 *
 * The scoping is the part that matters. Each page asks for ONE entity type by
 * name, so a client's history holds `RESIDENT` entries only. The client-fact
 * tables log under `CLIENT_INSURANCE` / `CLIENT_PERMIT` /
 * `CLIENT_HEALTH_CONTACT`, which means this surface cannot reveal that an
 * insurance entry exists to a viewer who may not read that kind — the leak
 * would be in the payload, not the markup, and it is closed by never asking.
 */

const ROOT = join(__dirname, '..', '..', '..')

function codeOf(relative: string): string {
  return readFileSync(join(ROOT, relative), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n')
}

const RESIDENT_PAGE = 'src/app/(admin)/residents/[id]/page.tsx'
const HOUSING_PAGE = 'src/app/(admin)/housing/[id]/page.tsx'

describe('the history has a reader', () => {
  it('the client page asks for its own history', () => {
    // The CALL with its scope, not the bare symbol: the whole safety property
    // is the entity argument.
    expect(codeOf(RESIDENT_PAGE)).toMatch(/getEntityAuditLog\(\s*['"]RESIDENT['"]/)
  })

  it('the housing page asks for its own history', () => {
    expect(codeOf(HOUSING_PAGE)).toMatch(/getEntityAuditLog\(\s*['"]HOUSING_UNIT['"]/)
  })

  it('both render it', () => {
    expect(codeOf(RESIDENT_PAGE)).toMatch(/<AuditTrail/)
    expect(codeOf(HOUSING_PAGE)).toMatch(/<AuditTrail/)
  })
})

describe('a client fact cannot surface through a dossier', () => {
  it('neither page asks for a client-fact entity', () => {
    // Asking for CLIENT_INSURANCE here would put rows in the payload of a page
    // that a Jobcoach may open — the same shape as employer contact details on
    // the opportunities board, where the markup hid what the payload carried.
    for (const page of [RESIDENT_PAGE, HOUSING_PAGE]) {
      const code = codeOf(page)
      expect(code).not.toMatch(/getEntityAuditLog\(\s*['"]CLIENT_/)
    }
  })
})

describe('one renderer, not three', () => {
  it('the system-wide feed uses the same component', () => {
    // It was briefly written twice. A display layer written twice is how the
    // same entry starts reading differently in two places.
    expect(codeOf('src/app/(admin)/audit/page.tsx')).toMatch(/<AuditTrail/)
  })

  it('and no page re-implements the row', () => {
    for (const page of [RESIDENT_PAGE, HOUSING_PAGE, 'src/app/(admin)/audit/page.tsx']) {
      expect(codeOf(page)).not.toMatch(/entry\.actorName/)
    }
  })
})
