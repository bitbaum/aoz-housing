/**
 * Which admin pages enforce a PERMISSION, stated once instead of discovered by
 * reading forty-one files.
 *
 * `STAFF_ROUTES` answers "must you be signed in?" and it listed /settings
 * correctly. Nothing answered the next question — "signed in as WHOM?" — and
 * /settings answered it only by hiding its nav link. On 2026-08-31, signed in
 * to production as Simon Binder (JOBCOACH / OWN_DOMAIN / isSystemAdmin false),
 * typing the URL served the whole page, including a roster of every
 * colleague's login CODE. A staff code is the credential — `loginByCode` takes
 * it with no password — so the narrowest role in the product could read
 * `AOZ-ADMIN1` and sign in as the system administrator.
 *
 * The page was not careless: it gated the invite form and the config fields.
 * That is the trap worth naming — gating the WRITE affordances looks like
 * access control and reads as thorough, while the page and its payload stay
 * open. A hidden link is not a boundary.
 *
 * So this file makes the guard a declared fact per page. Adding an admin page
 * fails the suite until you say what it requires — and the pages that
 * deliberately require only a session are listed, so "no permission needed"
 * is a decision somebody wrote down rather than a line nobody got to.
 */

import fs from 'fs'
import path from 'path'

const REPO_ROOT = path.resolve(__dirname, '../../../..')
const ADMIN_DIR = path.join(REPO_ROOT, 'src/app/(admin)')

/**
 * Pages that any signed-in staff member may open.
 *
 * This is not an amnesty list — every entry is a claim that the page shows
 * nothing a colleague in another discipline may not see, and each one is a
 * reasonable thing to re-examine. What it must never contain is a page that
 * administers the product or renders a credential.
 */
const SESSION_IS_ENOUGH = new Set([
  // The permission-denied page itself. Requiring a permission to be told you
  // lack a permission is a redirect loop.
  'kein-zugriff/page.tsx',
  // The dashboard composes from per-area queries that each apply their own
  // boundary; it is the landing page every staff member must reach.
  'page.tsx',
  // Governance surfaces: house rules and decisions are shared across
  // disciplines by design — the whole point is one rule book.
  'rules/page.tsx',
  'rules/decisions/page.tsx',
  // Staff<->resident message threads. Scoped per thread, not per role.
  'messages/page.tsx',
  'messages/[residentId]/page.tsx',
  // Maintenance is the shared house-operations board.
  'maintenance/page.tsx',
  'maintenance/new/page.tsx',
  'maintenance/[id]/page.tsx',
  // Chores creation is reached from the housing board, which is gated.
  'chores/new/page.tsx',
  // Resident detail renders each care/housing section behind its own
  // hasPermission() check rather than one page-level gate.
  'residents/[id]/page.tsx',
])

/** Pages that administer the product. These MUST require system:configure. */
const ADMINISTRATION = new Map([['settings/page.tsx', 'system:configure']])

function adminPages(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name === 'page.tsx') out.push(path.relative(ADMIN_DIR, full))
    }
  }
  walk(ADMIN_DIR)
  return out.sort()
}

function requiredPermission(page: string): string | null {
  const source = fs.readFileSync(path.join(ADMIN_DIR, page), 'utf8')
  const match = source.match(/requirePermission\(\s*'([^']+)'/)
  return match ? match[1] : null
}

describe('every admin page declares what it requires', () => {
  const pages = adminPages()

  it('found the admin pages at all — an empty scan is not a pass', () => {
    expect(pages.length).toBeGreaterThan(20)
  })

  it.each(pages.map((p) => [p]))('%s either enforces a permission or is listed', (page) => {
    const permission = requiredPermission(page)
    const declared = SESSION_IS_ENOUGH.has(page)

    // Exactly one of the two must be true. A page that both enforces a
    // permission AND sits on the session-only list is a stale entry, and a
    // page that does neither is the /settings hole again.
    expect({ page, guarded: permission !== null || declared }).toEqual({ page, guarded: true })
  })

  it.each(Array.from(ADMINISTRATION.entries()))(
    '%s requires %s — administration is never merely "signed in"',
    (page, permission) => {
      expect(requiredPermission(page)).toBe(permission)
      expect(SESSION_IS_ENOUGH.has(page)).toBe(false)
    },
  )

  it('no page that administers the product is on the session-only list', () => {
    for (const page of Array.from(ADMINISTRATION.keys())) {
      expect(SESSION_IS_ENOUGH.has(page)).toBe(false)
    }
  })

  it('the session-only list has no stale entries', () => {
    const stale = Array.from(SESSION_IS_ENOUGH).filter((page) => !pages.includes(page))
    expect(stale).toEqual([])
  })
})

describe('the settings page does not ship anyone a credential', () => {
  /**
   * Checked on the QUERY, not the markup. Dropping `{user.code}` from the JSX
   * would have looked like a fix and left the code in the server payload —
   * this repo has met that exact shape before (the marketplace contactNote).
   */
  it('does not select staff codes', () => {
    const source = fs.readFileSync(path.join(ADMIN_DIR, 'settings/page.tsx'), 'utf8')
    const select = source.match(/prisma\.user\.findMany\(\{[\s\S]*?\n {4}\}\)/)

    expect(select).not.toBeNull()
    expect(select?.[0]).not.toMatch(/\bcode:\s*true\b/)
  })
})
