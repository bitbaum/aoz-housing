/**
 * Auth Configuration - Single Source of Truth
 *
 * All auth-related settings in one place.
 * Environment variables with sensible defaults.
 *
 * Edge-safe constants (cookie names, secrets, durations) live in ./constants
 * so middleware can share them without bundling Node-only modules.
 */

import {
  STAFF_COOKIE,
  JWT_ISSUER,
  SESSION_SECRET,
  SESSION_DURATION_SECONDS,
  SESSION_REFRESH_THRESHOLD_SECONDS,
} from './constants'

// Fail fast if production is missing the signing secret
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable must be set in production')
}

/**
 * The one prefix login routes on: RES- goes to residents, everything else to
 * staff, resolved by exact string.
 *
 * Deliberately not brand-derived. Resident codes were never branded, and
 * routing staff login on the *current* brand's prefix is what locked every
 * AOZ- account out of production when the default brand flipped to AOCH. A
 * prefix here is a router, not a validator — issued codes must keep resolving
 * forever, whatever the product is called this year.
 */
export const RESIDENT_CODE_PREFIX = 'RES-'

export const AUTH_CONFIG = {
  // JWT Settings
  jwt: {
    /** Secret for signing tokens - MUST be set in production */
    secret: SESSION_SECRET,
    /** Token expiry in seconds (default: 8 hours) */
    expiresIn: SESSION_DURATION_SECONDS,
    /** Algorithm for JWT signing */
    algorithm: 'HS256' as const,
    /** Issuer claim */
    issuer: JWT_ISSUER,
  },

  // Cookie Settings
  cookie: {
    /** Cookie name for staff sessions */
    name: STAFF_COOKIE,
    /** Cookie options */
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    },
  },

  // Rate Limiting
  rateLimit: {
    /** Max login attempts per window */
    maxAttempts: parseInt(process.env.LOGIN_RATE_LIMIT || '10', 10),
    /** Window duration in milliseconds (default: 15 minutes) */
    windowMs: 15 * 60 * 1000,
  },

  // Session Refresh
  session: {
    /** Refresh token if less than this many seconds remain (default: 1 hour) */
    refreshThreshold: SESSION_REFRESH_THRESHOLD_SECONDS,
  },
} as const

export type AuthConfig = typeof AUTH_CONFIG
