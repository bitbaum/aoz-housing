/**
 * Demo access configuration (SSOT).
 *
 * The demo is not a separate product — it is the REAL product behind a door
 * that needs no account. Anyone landing on /login can try it exactly as a
 * resident (or, where configured, staff) would use it. The credentials are
 * public BY DESIGN; safety comes from the reset (api/cron/reset-demo), the
 * login rate limit, and the operator opt-in via env.
 *
 * Two reset scopes (DEMO_RESET_SCOPE):
 * - 'unit' (DEFAULT): only the dedicated demo apartment is torn down and
 *   reseeded. Safe on instances holding real data — the demo lives alongside
 *   it, isolated by the portal's unit scoping.
 * - 'full': truncate-everything + AOZ presentation narrative. ONLY for
 *   dedicated demo deployments; must be opted into explicitly.
 *
 * Relative-import-safe (no '@/' aliases): prisma/seed-demo.ts loads this
 * through ts-node, which does not resolve tsconfig path aliases.
 */

/** Master switch — server-side. The login page asks GET /api/auth/demo. */
export function isDemoEnabled(): boolean {
  return process.env.DEMO_ACCESS_ENABLED === 'true'
}

export type DemoResetScope = 'UNIT' | 'FULL'

/** Default is the safe scope; the destructive full wipe is explicit opt-in. */
export function getDemoResetScope(): DemoResetScope {
  return process.env.DEMO_RESET_SCOPE === 'full' ? 'FULL' : 'UNIT'
}

/**
 * The demo staff login code. A DEDICATED account (not a real admin's code) so
 * drive-by demo sessions never share a real staff member's identity or audit
 * trail. Re-upserted on every reset, so a demo visitor renaming or breaking
 * it self-heals within a day.
 */
export function getDemoStaffCode(): string | null {
  return process.env.DEMO_STAFF_CODE || null
}

/** Display name for the upserted demo staff account (German UI). */
export const DEMO_STAFF_NAME = 'Demo-Zugang'

/**
 * Every fictional resident in the demo world gets a code with this prefix,
 * so the scoped reset can always find them for deletion — even after a
 * visitor edited their profiles.
 */
export const DEMO_RESIDENT_CODE_PREFIX = 'RES-DEMO'

/**
 * Every demo housing unit's code carries this prefix. It is what makes the
 * scoped reset safe on an instance holding real data: deletion targets
 * prefixes, never tables.
 */
export const DEMO_UNIT_CODE_PREFIX = 'DEMO-'

/**
 * The demo resident login code — the seed assigns it to a PLACED resident,
 * so the portal demo shows a lived-in apartment, not an empty shell.
 * Always resolvable: env override, else the default.
 */
export function resolveDemoResidentCode(): string {
  return process.env.DEMO_RESIDENT_CODE || `${DEMO_RESIDENT_CODE_PREFIX}1`
}
