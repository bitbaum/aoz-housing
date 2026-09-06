import { readFileSync } from 'fs'
import { join } from 'path'

import { describe, expect, it } from 'vitest'

import { STAFF_ROUTES } from '@/lib/auth/route-boundaries'
import { SYSTEM_LINKS } from '@/lib/config/navigation'

/**
 * A record nobody can read is a claim, not a control.
 *
 * 120 sites in this codebase wrote to `AuditLog`. Both readers in
 * `lib/audit.ts` had zero callers — one of them carrying the comment "for
 * admin dashboard", for a dashboard that did not exist.
 *
 * CLAUDE.md promises every placement is logged with who decided, the scores at
 * the time, and any override reason. That was true and useless: the rows were
 * written and nothing inside the product could show them.
 *
 * The impersonation entries are why this matters most. "Ansicht öffnen als"
 * writes STAFF_USER rows, and their reviewability IS the safeguard for the
 * feature — the only thing standing between a borrowed view and an
 * unaccountable one.
 */

const ROOT = join(__dirname, '..', '..', '..')
const PAGE = 'src/app/(admin)/audit/page.tsx'

function sourceOf(relative: string): string {
  return readFileSync(join(ROOT, relative), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n')
}

describe('the trail has a reader', () => {
  it('a page calls the audit query', () => {
    // The CALL, not the word: this whole entry exists because a symbol can be
    // written, documented and named in prose while nothing invokes it.
    expect(sourceOf(PAGE)).toMatch(/getRecentAuditLogs\(/)
  })

  it('and the page is reachable from the navigation', () => {
    // A guarded page nothing links to is the same as no page. The impersonation
    // trail already existed as rows; what was missing was a way in.
    const audit = SYSTEM_LINKS.find((link) => link.href === '/audit')
    expect(audit).toBeDefined()
    expect(audit?.permission).toBe('users:manage')
  })

  it('and the route is declared as staff-only', () => {
    // requirePermission in the page body is the enforcement; the boundary list
    // is what stops an anonymous request reaching it at all.
    expect(STAFF_ROUTES).toContain('/audit')
  })
})

describe('who may read it', () => {
  it('is gated on a system-admin permission, not on care reach', () => {
    // NOT dashboard:read and NOT widened by ALL_DOMAINS: the person with reach
    // over every care domain is one of the people this log exists to record.
    const page = sourceOf(PAGE)
    expect(page).toMatch(/requirePermission\(['"]users:manage['"]\)/)
  })
})

describe('what it shows', () => {
  it('resolves the acting account to a name', () => {
    // A bare userId renders as an opaque id, which records nothing a human can
    // act on. The join belongs in the query, not in the page.
    const audit = sourceOf('src/lib/audit.ts')
    expect(audit).toMatch(/actorName/)
    expect(audit).toMatch(/leftJoin\(/)
  })

  it('can single out the borrowed-view entries', () => {
    // Buried in a flat feed the other 119 write sites would drown them.
    expect(sourceOf(PAGE)).toMatch(/STAFF_USER/)
  })
})
