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

/** Resolved staff session secret. */
export const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production'

/** Staff session lifetime in seconds (default: 8 hours). */
export const SESSION_DURATION_SECONDS = parseInt(process.env.SESSION_DURATION || '28800', 10)

/** Resident login cookie lifetime in seconds (default: 30 days). */
export const RESIDENT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
