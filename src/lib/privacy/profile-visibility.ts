import type { ProfileVisibility } from '@/lib/db'

/**
 * Who may see a resident's self-chosen profile — SSOT.
 *
 * The profile is `displayName`, `bio` and the photo: things a resident chose to
 * put there, about themselves. The login code is NOT part of this — it is the
 * identifier the whole system runs on and is shown wherever it is needed.
 *
 * WHY THIS IS ONE PURE FUNCTION. The rule has to hold identically in three
 * unrelated places — the photo endpoint, the roommates page and the staff
 * views — and they have nothing else in common. Three copies of "can this
 * person see that person" is three chances for one of them to be wrong, and the
 * failure mode is a photo shown to someone who was told it was private. That is
 * not a bug you find in review; it is one you find from the person it happened
 * to.
 */

export type ProfileViewer =
  /** A staff member. Always sees the profile. */
  | { kind: 'staff' }
  /** Another resident, and whether they currently share a unit with the subject. */
  | { kind: 'resident'; residentId: string; sharesUnit: boolean }
  /** Nobody — signed out, or a resident of no unit. */
  | { kind: 'anonymous' }

export interface ProfileSubject {
  id: string
  profileVisibility: ProfileVisibility
}

/**
 * Staff always see it.
 *
 * This is a deliberate decision and a change from the endpoint's original
 * behaviour, which hid photos from staff too. A caseworker who cannot put a
 * face or a chosen name to the person they are supporting is worse at
 * supporting them, and they already hold far more sensitive data about that
 * person than a self-written bio. The privacy question this setting answers is
 * about OTHER RESIDENTS — the people you did not choose to live near.
 */
export function canSeeProfile(viewer: ProfileViewer, subject: ProfileSubject): boolean {
  if (viewer.kind === 'staff') return true
  if (viewer.kind === 'anonymous') return false

  // Your own profile is always yours to see, whatever it is set to — otherwise
  // choosing PRIVATE would hide your own page from you.
  if (viewer.residentId === subject.id) return true

  switch (subject.profileVisibility) {
    case 'PRIVATE':
      return false
    case 'ROOMMATES':
      return viewer.sharesUnit
    case 'RESIDENTS':
      return true
    default:
      // An unknown value is a schema change nobody finished. Withhold, because
      // the safe direction for a privacy default is always "show less".
      return false
  }
}

/** The options a resident chooses between, in the order they are offered. */
export const PROFILE_VISIBILITY_OPTIONS: ProfileVisibility[] = ['PRIVATE', 'ROOMMATES', 'RESIDENTS']

/**
 * Strip the profile off a row the viewer may not see it on.
 *
 * Enforcing visibility only at the photo endpoint would be half a rule: the
 * roommates page renders the name and bio from its own query, so a resident
 * set to PRIVATE would have their photo withheld and their bio printed
 * directly underneath. Redacting the ROW keeps the whole profile behind one
 * decision.
 *
 * The code is deliberately untouched — it is the identifier the product runs
 * on, everyone in a shared flat already knows it, and blanking it would leave
 * a card identifying nobody.
 */
export function redactProfile<
  T extends {
    id: string
    profileVisibility: ProfileVisibility
    displayName: string | null
    bio?: string | null
  },
>(row: T, viewer: ProfileViewer): T {
  if (canSeeProfile(viewer, row)) return row

  return {
    ...row,
    displayName: null,
    ...('bio' in row ? { bio: null } : {}),
    // Callers that carry a photo version use it to build the <img> URL. Null
    // means "render initials" — and the endpoint would 404 anyway, so leaving
    // it set would only produce a broken image.
    ...('photoVersion' in row ? { photoVersion: null } : {}),
  }
}
