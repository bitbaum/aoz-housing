import { readFileSync } from 'fs'
import { join } from 'path'

import { describe, expect, it } from 'vitest'

/**
 * A board of open work opens on the open work.
 *
 * `/maintenance` defaulted to `active` and `/incidents` to `all`, so the two
 * boards Betreuung works every day disagreed about what a board is for, and
 * the incident one opened on a list dominated by closed items.
 *
 * The click was the small half. The large half: the incident query is
 * `orderBy date desc` with `limit: QUERY_LIMITS.pageList` (100), so past a
 * hundred rows an old OPEN incident is pushed off the default view entirely —
 * along with the overdue-follow-up flag the page computes for it. The conflict
 * ladder is what a broken agreement is supposed to escalate through, and it
 * cannot escalate off the bottom of a page nobody can reach.
 */

const ROOT = join(__dirname, '..', '..', '..')

function sourceOf(relative: string): string {
  // Comments stripped: this file's own explanation names the very strings it
  // asserts on, and a gate its documentation can satisfy guards nothing.
  return readFileSync(join(ROOT, relative), 'utf8')
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n')
}

describe('boards of open work open on the open work', () => {
  it('defaults /incidents to open, like its sibling /maintenance', () => {
    const incidents = sourceOf('src/app/(admin)/incidents/page.tsx')
    expect(incidents).toMatch(/params\.status\s*\|\|\s*'open'/)
    expect(incidents).not.toMatch(/params\.status\s*\|\|\s*'all'/)
  })

  it('keeps /maintenance on its unresolved default', () => {
    const maintenance = sourceOf('src/app/(admin)/maintenance/page.tsx')
    expect(maintenance).toMatch(/params\.status\s*\|\|\s*'active'/)
  })

  /**
   * The subtle half, and the reason this is a test rather than a one-line diff.
   *
   * Postgres sorts ASC as NULLS LAST. `asc(resolvedAt)` therefore puts every
   * UNRESOLVED incident at the BOTTOM — exactly inverting the fix, on a page
   * that would still look correctly sorted. Ordering on the boolean cannot be
   * got wrong that way.
   */
  it('orders unresolved incidents first, on a boolean and not on the null column', () => {
    const incidents = sourceOf('src/app/(admin)/incidents/page.tsx')
    expect(incidents).toMatch(/orderBy:\s*\[\s*sql`\$\{incidentTable\.resolvedAt\} IS NOT NULL`/)
    expect(incidents).not.toMatch(/orderBy:\s*\[\s*asc\(incidentTable\.resolvedAt\)/)
  })

  /**
   * Changing a default changes what "no query string" means, so every link that
   * used bare `/incidents` to mean "show everything" became a link to the page
   * you are already on — a control that visibly does nothing.
   */
  it('names status=all on the way back, rather than relying on a bare href', () => {
    const incidents = sourceOf('src/app/(admin)/incidents/page.tsx')
    expect(incidents).toMatch(/\/incidents\?status=all/)
    expect(incidents).not.toMatch(/href="\/incidents"/)
  })
})
