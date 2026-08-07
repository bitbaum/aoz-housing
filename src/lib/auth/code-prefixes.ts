/**
 * Login code prefixes — pure constants, safe to import from anywhere.
 *
 * This module exists SEPARATELY from `auth/constants.ts` on purpose. That file
 * throws at module load when `SESSION_SECRET` is missing in production — a
 * correct fail-fast for the server, but fatal if the module is ever pulled
 * into the client bundle, because the browser has no `SESSION_SECRET` and the
 * throw takes the whole page down during hydration.
 *
 * The German UI strings need the prefix ("Codes beginnen mit AOZH- oder RES-"),
 * and label modules are imported by client components. So the prefix lives
 * here, with no imports and no side effects, and nothing that a client
 * component can reach ever has to touch the server's env guard.
 */

/**
 * Prefix on every resident login code.
 *
 * Unlike the staff prefix — which is brand-dependent and lives in
 * `lib/config/brand.ts` — this never changes with the badge on the product,
 * because residents are not the organisation.
 */
export const RESIDENT_CODE_PREFIX = 'RES-'
