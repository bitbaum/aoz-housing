/**
 * SSOT for turning a resident row into the name shown in the UI.
 *
 * The self-chosen display name wins; the login code is the fallback for
 * residents who choose not to identify themselves. Every component uses
 * these helpers — never `resident.displayName || resident.code` inline.
 */

/**
 * `displayName` is REQUIRED, deliberately — `null` is how you say "no name",
 * and that is different from not having asked for it.
 *
 * While it was optional, a query selecting `{ code: true }` produced a row that
 * satisfied this type, so `residentName()` fell back to the code and the staff
 * resident list showed "RES-DEMO1" for someone whose name was in the same row.
 * Nothing failed: not tsc, not lint, not the render. Making the field required
 * moves that whole class from "a rule might catch it" to "it does not compile".
 */
export interface NamedResident {
  code: string
  displayName: string | null
}

/**
 * The columns the helpers below need, as a Prisma `select` fragment.
 *
 * Spread this into every query whose rows reach the UI. Selecting only `code`
 * type-checks and renders — as a bare login code, silently — which is exactly
 * how the chore board came to tell people "erledigt von RES-LCCM7A".
 */
export const RESIDENT_NAME_SELECT = {
  id: true,
  code: true,
  displayName: true,
} as const

export function residentName(resident: NamedResident): string {
  return resident.displayName?.trim() || resident.code
}

/** Short text for the initials avatar: first letters of the name, or the code tail. */
export function residentInitials(resident: NamedResident): string {
  const name = resident.displayName?.trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    return parts
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join('')
  }
  return resident.code.slice(-3)
}
