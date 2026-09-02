/**
 * The real AOZ team — data config for scripts/maintenance/ensure-aoz-team.ts.
 *
 * Three people, and the product must describe them as they actually are rather
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
 * Nobody here is a system administrator. Running the house is not the same as
 * configuring the product; that stays with the operator account, and granting
 * it is a deliberate one-line change, not something a care role implies.
 *
 * There is no Sozialarbeit staff member. That is a fact about AOZ, not a gap
 * in this file — the SOCIAL care seat is covered by Franziska's oversight, and
 * `ensure-aoz-team.ts` reports it rather than leaving it silently unstaffed.
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
] as const
