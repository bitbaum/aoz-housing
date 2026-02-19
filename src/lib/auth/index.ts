/**
 * Authentication Module
 *
 * Provides session management for staff and residents.
 * Uses stateless JWT tokens stored in httpOnly cookies.
 */

import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { AUTH_CONFIG } from './config'
import { createToken, verifyToken, shouldRefreshToken, refreshToken, type TokenPayload } from './jwt'
import { verifyPassword } from './password'
import { checkRateLimit, recordLoginAttempt, clearLoginAttempts } from './rate-limit'
import { canRoleAccess, hasPermission, type StaffPermission } from './role-policy'

// Re-export types
export type { TokenPayload }

// Types for auth
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

export type LoginResult =
  | { success: true; user: AuthUser }
  | { success: false; error: string; retryAfter?: number }

/**
 * Get current staff user from session cookie
 * Returns null if not logged in or session invalid
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_CONFIG.cookie.name)?.value

  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  }
}

/**
 * Get token payload for middleware use (no cookie access needed)
 */
export async function getTokenPayload(token: string): Promise<TokenPayload | null> {
  return verifyToken(token)
}

/**
 * Check if token should be refreshed and return new token if so
 */
export async function maybeRefreshToken(token: string): Promise<string | null> {
  const payload = await verifyToken(token)
  if (!payload) return null

  if (shouldRefreshToken(payload)) {
    return refreshToken(payload)
  }

  return null
}

/**
 * Get current resident from portal session
 * Returns null if not logged in
 */
export async function getCurrentResident(): Promise<AuthResident | null> {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) return null

  // Validate code exists in database
  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
    select: { id: true, code: true },
  })

  if (!resident) return null

  return {
    id: resident.id,
    code: resident.code,
  }
}

/**
 * Check if current user has required role
 * Throws error if not authenticated or insufficient permissions
 */
export async function requireRole(allowedRoles: AuthUser['role'][]): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentifizierung erforderlich')
  }

  if (!canRoleAccess(allowedRoles, user.role)) {
    throw new Error('Unzureichende Berechtigungen')
  }

  return user
}

/**
 * Check if current user has required permission
 */
export async function requirePermission(permission: StaffPermission): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentifizierung erforderlich')
  }

  if (!hasPermission(user.role, permission)) {
    throw new Error('Unzureichende Berechtigungen')
  }

  return user
}

/**
 * Check if current request is from authenticated staff
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Authenticate user with email and password
 * Returns user data on success, error on failure
 */
export async function login(email: string, password: string, clientIp: string): Promise<LoginResult> {
  // Check rate limit
  const rateCheck = checkRateLimit(clientIp)
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Zu viele Anmeldeversuche. Bitte warten Sie ${rateCheck.retryAfter} Sekunden.`,
      retryAfter: rateCheck.retryAfter,
    }
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
      active: true,
    },
  })

  // User not found or inactive
  if (!user || !user.active) {
    recordLoginAttempt(clientIp)
    return {
      success: false,
      error: 'Ungültige E-Mail oder Passwort',
    }
  }

  // No password set (shouldn't happen but handle gracefully)
  if (!user.passwordHash) {
    recordLoginAttempt(clientIp)
    return {
      success: false,
      error: 'Konto nicht vollständig eingerichtet',
    }
  }

  // Verify password
  const passwordValid = await verifyPassword(password, user.passwordHash)
  if (!passwordValid) {
    recordLoginAttempt(clientIp)
    return {
      success: false,
      error: 'Ungültige E-Mail oder Passwort',
    }
  }

  // Success - clear rate limit and update last login
  clearLoginAttempts(clientIp)
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }
}

/**
 * Create session cookie with JWT token
 */
export async function setSessionCookie(user: AuthUser): Promise<void> {
  const token = await createToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })

  const cookieStore = await cookies()
  cookieStore.set(AUTH_CONFIG.cookie.name, token, {
    ...AUTH_CONFIG.cookie.options,
    maxAge: AUTH_CONFIG.jwt.expiresIn,
  })
}

/**
 * Clear session cookie (logout)
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_CONFIG.cookie.name)
}
