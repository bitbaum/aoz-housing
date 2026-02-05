/**
 * Authentication helpers (prepared for future implementation)
 *
 * CURRENT STATE: Returns null/undefined (no auth during pilot)
 *
 * USAGE IN SERVER ACTIONS:
 * ```typescript
 * import { getCurrentUser } from '@/lib/auth'
 *
 * export async function createPlacement(...) {
 *   const user = await getCurrentUser() // null during pilot
 *   // ... do work ...
 *   await logAudit({ userId: user?.id, ... })
 * }
 * ```
 */

import { cookies } from 'next/headers'

// Types for future auth
export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'CASE_WORKER' | 'VIEWER'
}

export interface AuthResident {
  id: string
  code: string
}

/**
 * Get current staff user from session
 * Returns null during pilot (no auth implemented)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  // PILOT MODE: No auth
  // TODO: Implement session validation
  return null

  /*
  // FUTURE IMPLEMENTATION:
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('staff_session')?.value

  if (!sessionToken) return null

  // Validate and decode session token
  // Return user from database
  */
}

/**
 * Get current resident from portal session
 * Returns null if not logged in
 */
export async function getCurrentResident(): Promise<AuthResident | null> {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) return null

  // During pilot, just return the code
  // TODO: Validate code exists in database
  return {
    id: '', // Would be fetched from DB
    code: residentCode,
  }
}

/**
 * Check if current user has required role
 * During pilot: Always returns true (no restrictions)
 */
export async function requireRole(
  allowedRoles: AuthUser['role'][]
): Promise<AuthUser> {
  const user = await getCurrentUser()

  // PILOT MODE: Return mock user
  // TODO: Throw error if no user or wrong role
  return user || {
    id: 'pilot-user',
    email: 'pilot@aoz.ch',
    name: 'Pilot User',
    role: 'ADMIN',
  }

  /*
  // FUTURE IMPLEMENTATION:
  if (!user) {
    throw new Error('Authentication required')
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions')
  }

  return user
  */
}

/**
 * Check if current request is from authenticated staff
 * During pilot: Always returns true
 */
export async function isAuthenticated(): Promise<boolean> {
  // PILOT MODE: Everyone is authenticated
  return true

  /*
  // FUTURE IMPLEMENTATION:
  const user = await getCurrentUser()
  return user !== null
  */
}
