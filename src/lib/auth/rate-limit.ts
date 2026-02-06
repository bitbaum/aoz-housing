/**
 * Rate Limiting for Login Attempts
 *
 * In-memory rate limiting. Simple but effective for single-instance deployments.
 * For multi-instance, replace with Redis-based solution.
 */

import { AUTH_CONFIG } from './config'

interface RateLimitEntry {
  attempts: number
  firstAttempt: number
}

// In-memory store (cleared on server restart)
const loginAttempts = new Map<string, RateLimitEntry>()

// Cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000

// Start cleanup timer
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    loginAttempts.forEach((entry, key) => {
      if (now - entry.firstAttempt > AUTH_CONFIG.rateLimit.windowMs) {
        loginAttempts.delete(key)
      }
    })
  }, CLEANUP_INTERVAL)
}

/**
 * Check if an IP/identifier is rate limited
 * Returns { allowed: true } or { allowed: false, retryAfter: seconds }
 */
export function checkRateLimit(identifier: string): { allowed: true } | { allowed: false; retryAfter: number } {
  const now = Date.now()
  const entry = loginAttempts.get(identifier)

  // No previous attempts
  if (!entry) {
    return { allowed: true }
  }

  // Window expired, reset
  if (now - entry.firstAttempt > AUTH_CONFIG.rateLimit.windowMs) {
    loginAttempts.delete(identifier)
    return { allowed: true }
  }

  // Still within window, check attempts
  if (entry.attempts >= AUTH_CONFIG.rateLimit.maxAttempts) {
    const retryAfter = Math.ceil((AUTH_CONFIG.rateLimit.windowMs - (now - entry.firstAttempt)) / 1000)
    return { allowed: false, retryAfter }
  }

  return { allowed: true }
}

/**
 * Record a login attempt (call after failed login)
 */
export function recordLoginAttempt(identifier: string): void {
  const now = Date.now()
  const entry = loginAttempts.get(identifier)

  if (!entry || now - entry.firstAttempt > AUTH_CONFIG.rateLimit.windowMs) {
    // New window
    loginAttempts.set(identifier, { attempts: 1, firstAttempt: now })
  } else {
    // Increment attempts
    entry.attempts++
  }
}

/**
 * Clear login attempts (call after successful login)
 */
export function clearLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier)
}
