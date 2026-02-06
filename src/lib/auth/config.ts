/**
 * Auth Configuration - Single Source of Truth
 *
 * All auth-related settings in one place.
 * Environment variables with sensible defaults.
 */

export const AUTH_CONFIG = {
  // JWT Settings
  jwt: {
    /** Secret for signing tokens - MUST be set in production */
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    /** Token expiry in seconds (default: 8 hours) */
    expiresIn: parseInt(process.env.SESSION_DURATION || '28800', 10),
    /** Algorithm for JWT signing */
    algorithm: 'HS256' as const,
    /** Issuer claim */
    issuer: 'aoz-housing',
  },

  // Cookie Settings
  cookie: {
    /** Cookie name for staff sessions */
    name: 'staff_session',
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
    refreshThreshold: 60 * 60,
  },
} as const

export type AuthConfig = typeof AUTH_CONFIG
