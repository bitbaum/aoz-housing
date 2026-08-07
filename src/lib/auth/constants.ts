/**
 * Auth constants — Edge-runtime safe (no imports, no Node/Prisma deps).
 *
 * SSOT for cookie names and JWT settings that need to be referenced from BOTH
 * the Node-runtime auth library and the Edge-runtime middleware.
 */

/** Cookie name carrying the staff JWT session. */
export const STAFF_COOKIE = 'staff_session'

/** Cookie name carrying the resident login code. */
export const RESIDENT_COOKIE = 'resident_code'

/** JWT issuer claim. */
export const JWT_ISSUER = 'aoz-housing'

/** Refresh the JWT when less than this many seconds remain. */
export const SESSION_REFRESH_THRESHOLD_SECONDS = 60 * 60

// Fail fast in production if the signing secret is missing, preventing the
// middleware from silently falling back to a hardcoded secret and accepting
// forged JWTs. Runs in every SERVER runtime (Node and Edge both lack `window`).
//
// Explicitly NOT in the browser: a client bundle can never legitimately hold
// SESSION_SECRET, so throwing there checks nothing and instead kills the page
// during hydration — a blank screen that a passing build and a green test
// suite will both happily report as fine. If a client component ever pulls
// this module in transitively, that should degrade to nothing, not to an
// outage. @see ./code-prefixes.ts
if (
  typeof window === 'undefined' &&
  process.env.NODE_ENV === 'production' &&
  !process.env.SESSION_SECRET
) {
  throw new Error('SESSION_SECRET environment variable must be set in production')
}

/** Resolved staff session secret. */
export const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production'

/** Staff session lifetime in seconds (default: 8 hours). */
export const SESSION_DURATION_SECONDS = parseInt(process.env.SESSION_DURATION || '28800', 10)

/** Resident login cookie lifetime in seconds (default: 30 days). */
export const RESIDENT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
