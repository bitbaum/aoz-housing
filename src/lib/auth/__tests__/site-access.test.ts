import fs from 'fs'
import path from 'path'
import {
  canAccessUnit,
  housingUnitScopeFilter,
  isStrandedWithoutUnits,
  residentScopeFilter,
  unitScopeFilter,
  type SiteCapabilities,
} from '../site-access'

/**
 * Which PLACES a staff member covers — the fourth axis, and the one that must
 * not change anybody's access on the day it ships.
 */

const everywhere: SiteCapabilities = { siteAccess: 'ALL_UNITS', assignedUnitIds: [] }
const twoHouses: SiteCapabilities = {
  siteAccess: 'ASSIGNED_UNITS',
  assignedUnitIds: ['unit-a', 'unit-b'],
}
const stranded: SiteCapabilities = { siteAccess: 'ASSIGNED_UNITS', assignedUnitIds: [] }

describe('nobody loses access on the day this ships', () => {
  /**
   * The whole reason ALL_UNITS is the default. Every existing row keeps
   * exactly what it had, the same discipline the ADMIN→scope migration used —
   * an access change must be a deliberate act, never a side effect of a deploy.
   */
  it('an ALL_UNITS viewer is unrestricted everywhere', () => {
    expect(unitScopeFilter(everywhere)).toBeNull()
    expect(housingUnitScopeFilter(everywhere)).toBeNull()
    expect(residentScopeFilter(everywhere)).toBeNull()
    expect(canAccessUnit(everywhere, 'any-unit-at-all')).toBe(true)
  })

  it('returns null rather than an always-true clause', () => {
    // `...(filter ?? {})` must add NOTHING for the common viewer, so the query
    // Prisma issues is byte-identical to the one before this axis existed. An
    // `{ id: { in: [...everything] } }` would have been correct and would also
    // have quietly changed every query plan in the product.
    expect(unitScopeFilter(everywhere)).toBeNull()
  })

  it('the schema default is ALL_UNITS, not the restrictive value', () => {
    const schema = fs.readFileSync(
      path.resolve(__dirname, '../../../../prisma/schema.prisma'),
      'utf8',
    )
    expect(schema).toMatch(/siteAccess\s+SiteAccess\s+@default\(ALL_UNITS\)/)
  })
})

describe('a restricted viewer sees only their places', () => {
  it('admits an assigned unit and refuses an unassigned one', () => {
    expect(canAccessUnit(twoHouses, 'unit-a')).toBe(true)
    expect(canAccessUnit(twoHouses, 'unit-z')).toBe(false)
  })

  it('filters units by id', () => {
    expect(unitScopeFilter(twoHouses)).toEqual({ id: { in: ['unit-a', 'unit-b'] } })
  })

  it('filters unit-owned rows by housingUnitId', () => {
    // Placements, incidents and maintenance all point AT a unit rather than
    // being one, so they need the other column name.
    expect(housingUnitScopeFilter(twoHouses)).toEqual({
      housingUnitId: { in: ['unit-a', 'unit-b'] },
    })
  })

  it('scopes residents by their ACTIVE placement, not any placement', () => {
    // Load-bearing. Matching any placement would leak everyone who ever passed
    // through a house the viewer covers — including people who have since
    // moved somewhere the viewer does not cover.
    const filter = residentScopeFilter(twoHouses)
    expect(filter).toEqual({
      placements: { some: { status: 'ACTIVE', housingUnitId: { in: ['unit-a', 'unit-b'] } } },
    })
  })
})

describe('a restricted viewer with no units is misconfigured, not idle', () => {
  /**
   * This product has already made the neighbouring mistake once: a specialist
   * with nobody assigned was shown "🎉 Alles unter Kontrolle!" on their first
   * login. An `{ in: [] }` filter is silently and permanently empty, and looks
   * exactly like a quiet day.
   */
  it('is detectable rather than indistinguishable from an empty day', () => {
    expect(isStrandedWithoutUnits(stranded)).toBe(true)
    expect(isStrandedWithoutUnits(twoHouses)).toBe(false)
    expect(isStrandedWithoutUnits(everywhere)).toBe(false)
  })

  it('still produces a filter that matches nothing, rather than everything', () => {
    // The dangerous failure would be treating "no units assigned" as "no
    // restriction". Fail closed.
    expect(unitScopeFilter(stranded)).toEqual({ id: { in: [] } })
    expect(canAccessUnit(stranded, 'unit-a')).toBe(false)
  })
})

describe('the boards that enforce it', () => {
  const ADMIN_DIR = path.resolve(__dirname, '../../../app/(admin)')

  it('the housing board scopes BOTH its queries', () => {
    // Two findMany calls: the list, and the row set behind the tab counts.
    // Scoping only the list would leave a restricted viewer reading counts
    // that describe houses they cannot open — the count is the leak.
    const source = fs.readFileSync(path.join(ADMIN_DIR, 'housing/page.tsx'), 'utf8')
    const queries = source.match(/prisma\.housingUnit\.findMany\(/g) ?? []
    const scoped = source.match(/\.\.\.\(unitFilter \?\? \{\}\)/g) ?? []
    expect({ queries: queries.length, scoped: scoped.length }).toEqual({
      queries: queries.length,
      scoped: queries.length,
    })
  })

  it('the resident board scopes its list', () => {
    const source = fs.readFileSync(path.join(ADMIN_DIR, 'residents/page.tsx'), 'utf8')
    expect(source).toMatch(/siteFilter\s*=\s*currentUser\s*\?\s*residentScopeFilter\(currentUser\)/)
    expect(source).toMatch(/\.\.\.\(siteFilter \?\? \{\}\)/)
  })
})

describe('site access is read from the row, never the token', () => {
  it('getCurrentUser selects it and derives the assigned ids', () => {
    // Same rule as `scope` and `isSystemAdmin`: a privilege in a JWT goes
    // stale, and with sliding refresh "stale" means indefinitely. Revoking
    // someone's reach has to take effect on the next request.
    const source = fs.readFileSync(path.resolve(__dirname, '../index.ts'), 'utf8')
    const currentUser = source.slice(
      source.indexOf('export async function getCurrentUser'),
      source.indexOf('export async function getTokenPayload'),
    )
    expect(currentUser).toMatch(/siteAccess:\s*true/)
    expect(currentUser).toMatch(/unitAccess:\s*\{\s*select:\s*\{\s*housingUnitId:\s*true\s*\}\s*\}/)
    expect(currentUser).not.toMatch(/payload\.siteAccess/)
  })
})
