/**
 * Demo access configuration (SSOT).
 *
 * The demo is a deliberate product feature: this deployment is a presentation
 * instance, and anyone landing on /login can tour BOTH sides of the product —
 * staff view and resident portal — without an account. The credentials are
 * public BY DESIGN; safety comes from the daily reset (api/cron/reset-demo),
 * the login rate limit, and the operator opt-in via env.
 *
 * Relative-import-safe (no '@/' aliases): prisma/seed-demo.ts loads this
 * through ts-node, which does not resolve tsconfig path aliases.
 */

/** Master switch — server-side. The login page reads the NEXT_PUBLIC_ twin. */
export function isDemoEnabled(): boolean {
  return process.env.DEMO_ACCESS_ENABLED === 'true'
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
 * The demo resident login code. The seed assigns this code to a PLACED
 * resident in the success-story unit, so the portal demo shows roommates,
 * rules and chores instead of an empty shell.
 */
export function getDemoResidentCode(): string | null {
  return process.env.DEMO_RESIDENT_CODE || null
}

/** Fallback used by the seed when DEMO_RESIDENT_CODE is not configured. */
export const DEFAULT_DEMO_RESIDENT_CODE = 'RES-001'
