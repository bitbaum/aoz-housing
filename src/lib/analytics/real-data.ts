/**
 * Keeping the demo world out of the numbers the pilot is judged on.
 *
 * ## Why this exists
 *
 * `DEMO_RESET_SCOPE='unit'` lets the demo live ALONGSIDE real data, isolated by
 * the portal's unit scoping. That isolation is real for residents and it is
 * absent for analytics: `calculateMissionKPIs` filtered incidents by category
 * and date and nothing else, so every demo conflict counted toward the pilot.
 *
 * Measured against production on 2026-09-03, INTERPERSONAL incidents over 180
 * days: DEMO-U12 six, DEMO-U09 one, WIT-458 — the one real apartment — one.
 * Seven of eight were synthetic, re-seeded nightly at 04:05, and the page was
 * reporting "67% mehr Konflikte · Verschlechterung" off the back of them.
 *
 * This is the same class as filing a dripping tap as an Incident: it corrupts
 * the single number the AOZ pilot is judged on. The difference is that this one
 * corrupts it upward, every night, on a schedule.
 *
 * ## Why by prefix, and why a SET rather than a WHERE
 *
 * Demo rows are identified the same way the scoped reset identifies them for
 * deletion — by CODE PREFIX, never by table. That is already the contract
 * (`lib/demo/config.ts`), and reusing it means a demo row the reset can clean
 * is exactly a demo row the KPIs ignore. If those two ever disagreed, one of
 * them would be wrong about what "demo" means.
 *
 * The ids are loaded into a set and applied as a pure predicate rather than
 * expressed as SQL, for one reason: `excludesDemo` can then be tested without a
 * database, and proven by mutation. A `notLike` buried in a query is a
 * condition nobody can exercise in isolation.
 *
 * The set is small by construction — one demo apartment block and its
 * residents — so this costs two id-only queries.
 */

import { db } from '@/lib/db'
import { ALL_DEMO_RESIDENT_CODE_PREFIXES, DEMO_UNIT_CODE_PREFIX } from '@/lib/demo/config'

/** The demo rows to leave out, by id. Empty on an instance with no demo. */
export interface DemoScope {
  residentIds: ReadonlySet<string>
  unitIds: ReadonlySet<string>
}

export const EMPTY_DEMO_SCOPE: DemoScope = { residentIds: new Set(), unitIds: new Set() }

/** Does this code belong to the demo world? Matches the reset's rule exactly. */
export function isDemoResidentCode(code: string): boolean {
  return ALL_DEMO_RESIDENT_CODE_PREFIXES.some((prefix) => code.startsWith(prefix))
}

export function isDemoUnitCode(code: string): boolean {
  return code.startsWith(DEMO_UNIT_CODE_PREFIX)
}

/**
 * Anything carrying a resident or a housing unit — incidents, placements,
 * check-ins. Both are optional because different tables carry different links,
 * and a row linked to neither is by definition not identifiable as demo.
 */
export interface MaybeDemoRow {
  residentId?: string | null
  housingUnitId?: string | null
}

/**
 * Keep this row in the pilot's numbers?
 *
 * A row is excluded if EITHER end of it is demo. Both halves matter: a demo
 * resident can be placed in a real unit by a visitor clicking around, and a
 * demo unit holds demo incidents whose resident link may be null.
 */
export function isRealRow(row: MaybeDemoRow, scope: DemoScope): boolean {
  if (row.residentId && scope.residentIds.has(row.residentId)) return false
  if (row.housingUnitId && scope.unitIds.has(row.housingUnitId)) return false
  return true
}

/** Filter a collection down to the rows the pilot is actually about. */
export function excludesDemo<T extends MaybeDemoRow>(rows: readonly T[], scope: DemoScope): T[] {
  return rows.filter((row) => isRealRow(row, scope))
}

/**
 * Load the demo ids once per analytics request.
 *
 * Selects ids and codes only — nothing here reaches a UI, and a demo resident's
 * name is not needed to leave them out of a count.
 */
export async function loadDemoScope(): Promise<DemoScope> {
  const [residents, units] = await Promise.all([
    db.query.resident.findMany({ columns: { id: true, code: true } }),
    db.query.housingUnit.findMany({ columns: { id: true, code: true } }),
  ])

  return {
    residentIds: new Set(residents.filter((r) => isDemoResidentCode(r.code)).map((r) => r.id)),
    unitIds: new Set(units.filter((u) => isDemoUnitCode(u.code)).map((u) => u.id)),
  }
}
