/**
 * The real AOZ team — data config for scripts/maintenance/ensure-aoz-team.ts.
 *
 * Four people, and the product must describe them as they actually are rather
 * than approximate them with the nearest available enum value. That was the
 * whole reason role, reach and administration became three columns:
 *
 *   Franziska is a Betreuerin who ALSO sees every client. The only way to say
 *   that used to be `ADMIN`, which erased the fact that housing is her domain
 *   and handed her the settings page as a side effect. Here her role stays
 *   true and her breadth is stated separately.
 *
 *   Simon and Sandra each work one domain, which is the ordinary shape.
 *
 *   Manuel is responsible for the HOUSING ITSELF — units, placements,
 *   maintenance. ⚠️ He and Franziska carry the same `role`, and that is the
 *   one place this file approximates. `BETREUUNG` bundles two jobs the axes
 *   cannot separate: supporting a PERSON about their housing (Franziska is
 *   somebody's Betreuerin, and holds their HOUSING care seat) and running the
 *   BUILDING (Manuel, who will hold no care seat at all). The permissions
 *   happen to coincide — `OPERATIONAL` carries both `residents:*` and
 *   `housing:*`/`placements:*`/`maintenance:*` — so nobody is over- or
 *   under-granted, and his first login was verified against production: he
 *   lands on "4 Aufgaben warten auf Sie" with beds to fill and tickets open,
 *   NOT on the onboarding screen. `workspaceState` puts `openTaskCount > 0`
 *   ahead of the empty-caseload check for exactly this reason, and says so.
 *
 *   Where it still shows is a day with no open housing work at all: then a
 *   man who will never hold a care seat is told "Ihnen ist noch niemand
 *   zugewiesen". Rare rather than daily, and worth knowing rather than
 *   fixing blind.
 *
 *   The deeper version is the missing dimension CLAUDE.md flags for a
 *   Springer*in, and the reason four of five helpers in `site-access.ts` are
 *   wired to nothing. Decide it before the second apartment, not after.
 *
 * Nobody here is a system administrator. Running the house is not the same as
 * configuring the product; that stays with the operator account, and granting
 * it is a deliberate one-line change, not something a care role implies.
 *
 * There is no Sozialarbeit staff member. That is a fact about AOZ, not a gap
 * in this file — the SOCIAL care seat is covered by Franziska's oversight, and
 * `ensure-aoz-team.ts` reports it rather than leaving it silently unstaffed.
 *
 * ⚠️ People are matched by NAME. Adding a surname to "Sandra" or "Manuel"
 * later does not rename anybody — it mints a SECOND user, which is exactly the
 * duplicate this instance is already carrying for one resident. Correct a name
 * in the database, not by editing this file.
 *
 * Login codes are NOT in this file, for the same reason they are absent from
 * witikonerstrasse-458.ts: they are generated when the script runs and printed
 * once. Committing them would publish three working staff logins.
 */

import type { StaffRole, StaffScopeId } from '../../../src/lib/auth/role-policy'

export interface RealStaffSeed {
  /** Shown wherever staff are listed; never a bare code. */
  name: string
  /** The care domain this person is staffed for. */
  role: StaffRole
  /** Whose files they may open. */
  scope: StaffScopeId
  /** May they reconfigure the product? Deliberately false for all three. */
  isSystemAdmin: boolean
  /** Why this shape, in one line — read by the script's output. */
  note: string
}

export const AOZ_TEAM: readonly RealStaffSeed[] = [
  {
    name: 'Franziska Heimhuber',
    role: 'BETREUUNG',
    scope: 'ALL_DOMAINS',
    isSystemAdmin: false,
    note: 'Betreuerin — Wohnen ist ihr Bereich, sie sieht zusätzlich alle Klient*innen.',
  },
  {
    name: 'Simon B.',
    role: 'JOBCOACH',
    scope: 'OWN_DOMAIN',
    isSystemAdmin: false,
    note: 'Jobcoach — sieht die Personen, die er begleitet.',
  },
  {
    name: 'Sandra',
    role: 'FREIWILLIGENARBEIT',
    scope: 'OWN_DOMAIN',
    isSystemAdmin: false,
    note: 'Freiwilligenarbeit — sieht die Personen, die sie begleitet.',
  },
  {
    name: 'Manuel',
    role: 'BETREUUNG',
    scope: 'OWN_DOMAIN',
    isSystemAdmin: false,
    note: 'Wohnen — Unterkünfte, Platzierungen und Unterhalt.',
  },
] as const
