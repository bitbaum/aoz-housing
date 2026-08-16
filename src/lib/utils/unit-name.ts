/**
 * SSOT for turning a housing unit row into the name shown in the UI.
 *
 * WHY THIS EXISTS. Residents may name their own apartment from
 * `/portal/apartment` — "Casa Harmonie", "Singapur" — and that name was
 * rendered nowhere on the staff side. Staff saw `DEMO-U05`. So the two groups
 * of people who talk to each other about the same flat every day had no shared
 * word for it: a resident says "in Casa Harmonie", the caseworker searches for
 * it and finds nothing.
 *
 * Letting residents name their home and then never repeating that name back is
 * also the wrong message from a product whose whole point is that the people
 * living somewhere have standing there.
 *
 * The code does not disappear — it is the identifier staff use for records, and
 * `unitLabel()` shows both. This mirrors `resident-name.ts` deliberately: same
 * problem, same shape, so nobody has to learn a second convention.
 */

/**
 * `nickname` is REQUIRED, for exactly the reason `NamedResident.displayName`
 * is: `null` means "these residents chose no name", while a MISSING field means
 * "the query never asked", and those are different facts. Optional would let a
 * `select: { code: true }` satisfy this type and silently fall back to the
 * code — the bug this file exists to end, reintroduced one layer down.
 */
export interface NamedUnit {
  code: string
  nickname: string | null
}

/**
 * The columns the helpers below need, as a Prisma `select` fragment. Spread it
 * into any unit query whose rows reach the UI.
 */
export const UNIT_NAME_SELECT = {
  code: true,
  nickname: true,
} as const

/** What the residents call it, falling back to the code they were issued. */
export function unitName(unit: NamedUnit): string {
  return unit.nickname?.trim() || unit.code
}

/** True when the residents have named this place themselves. */
export function hasResidentName(unit: NamedUnit): boolean {
  return Boolean(unit.nickname?.trim())
}

/**
 * Both, for staff surfaces: "Casa Harmonie (DEMO-U05)".
 *
 * Staff need the code — it is what records, exports and conversations with the
 * office are keyed on — but leading with it is what made the resident's name
 * invisible. Unnamed units render as the bare code, with no empty brackets.
 */
export function unitLabel(unit: NamedUnit): string {
  return hasResidentName(unit) ? `${unitName(unit)} (${unit.code})` : unit.code
}
