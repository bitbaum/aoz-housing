/**
 * Which PLACES a staff member is responsible for.
 *
 * The fourth orthogonal fact, and the one the three-axis model could not say.
 * `role` is which care domain, `scope` is how many domains, `isSystemAdmin` is
 * whether they configure the product — and none of them answers "which
 * houses". Every staff member could list every resident in every building.
 *
 * At one apartment that is invisible. At AOZ's actual scale it is the primary
 * organising question: 31 sites, 16 of them in the city, a portfolio that turns
 * over every few years, and a `Springer*in` advertised with "kein fester
 * Arbeitsort" — one person covering some sites but not others, which nothing
 * in the model could express.
 *
 * ## The rule that makes this safe to ship
 *
 * `ALL_UNITS` is the default, so nobody's access changes on the day it lands —
 * the same discipline the ADMIN→scope migration used. Narrowing a person is a
 * deliberate act afterwards, never a side effect of a deploy.
 *
 * ## What this is NOT
 *
 * It is not a care-domain check and does not replace one. A Betreuerin
 * restricted to two houses still works only the Housing seat in them; a
 * Jobcoach with every house still works only the Job seat. The two axes
 * multiply, they do not substitute — `canWriteCareDomain` still decides the
 * seat, this decides the address.
 */

import type { SiteAccess } from '@prisma/client'

/** Everything a site question needs about the person asking. */
export interface SiteCapabilities {
  siteAccess: SiteAccess
  /** Unit ids joined through StaffUnit. Empty unless ASSIGNED_UNITS. */
  assignedUnitIds: readonly string[]
}

/**
 * Whether this person may see anything at all about a given unit.
 *
 * `ALL_UNITS` short-circuits, which is both the common case today and the
 * reason the assigned list can be left unloaded for most viewers.
 */
export function canAccessUnit(viewer: SiteCapabilities, housingUnitId: string): boolean {
  if (viewer.siteAccess === 'ALL_UNITS') return true
  return viewer.assignedUnitIds.includes(housingUnitId)
}

/**
 * A Prisma `where` fragment restricting rows to this viewer's units, or `null`
 * when no restriction applies.
 *
 * Returning null rather than an always-true clause is deliberate: a caller
 * that spreads `...(unitFilter ?? {})` adds nothing for an ALL_UNITS viewer, so
 * the common path issues exactly the query it issued before this axis existed.
 */
export function unitScopeFilter(viewer: SiteCapabilities): { id: { in: string[] } } | null {
  if (viewer.siteAccess === 'ALL_UNITS') return null
  return { id: { in: [...viewer.assignedUnitIds] } }
}

/**
 * The same restriction expressed for rows that POINT AT a unit — placements,
 * incidents, maintenance — where the column is `housingUnitId`.
 */
export function housingUnitScopeFilter(
  viewer: SiteCapabilities,
): { housingUnitId: { in: string[] } } | null {
  if (viewer.siteAccess === 'ALL_UNITS') return null
  return { housingUnitId: { in: [...viewer.assignedUnitIds] } }
}

/**
 * Residents this viewer may see, as a Prisma `where` fragment.
 *
 * A resident is in scope when they hold an ACTIVE placement in one of the
 * viewer's units. The `some` is load-bearing: matching on any placement would
 * leak everyone who ever passed through a house the viewer covers, including
 * people who have since moved somewhere they do not.
 *
 * Unplaced residents are deliberately NOT in scope for a restricted viewer.
 * Somebody who has not been placed anywhere belongs to no site, so there is no
 * site answer for them — placing them is `placements:write` work, which a
 * site-restricted specialist does not do. This is the one case worth
 * re-examining if AOZ ever restricts a Betreuer who also does intake.
 */
export function residentScopeFilter(viewer: SiteCapabilities): {
  placements: { some: { status: 'ACTIVE'; housingUnitId: { in: string[] } } }
} | null {
  if (viewer.siteAccess === 'ALL_UNITS') return null
  return {
    placements: {
      some: { status: 'ACTIVE', housingUnitId: { in: [...viewer.assignedUnitIds] } },
    },
  }
}

/**
 * A restricted viewer with no units assigned sees nothing — and that is a
 * misconfiguration, not a state to render as "all quiet".
 *
 * Same failure the dashboard already learned once: a specialist with no clients
 * was congratulated on an empty day. An `{ in: [] }` filter is silently and
 * permanently empty, so the surfaces that use it must be able to say WHY.
 */
export function isStrandedWithoutUnits(viewer: SiteCapabilities): boolean {
  return viewer.siteAccess === 'ASSIGNED_UNITS' && viewer.assignedUnitIds.length === 0
}
