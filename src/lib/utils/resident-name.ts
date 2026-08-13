/**
 * SSOT for turning a resident row into the name shown in the UI.
 *
 * The self-chosen display name wins; the login code is the fallback for
 * residents who choose not to identify themselves. Every component uses
 * these helpers — never `resident.displayName || resident.code` inline.
 */

export interface NamedResident {
  code: string
  displayName?: string | null
}

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
