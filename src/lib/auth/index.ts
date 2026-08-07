/**
 * Authentication Module
 *
 * Provides session management for staff and residents.
 * Uses stateless JWT tokens stored in httpOnly cookies.
 */
import { ALL_CODE_PREFIXES, BRAND } from '@/lib/config/brand'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { AUTH_CONFIG } from './config'
import { RESIDENT_COOKIE } from '@/lib/portal-auth'
import { RESIDENT_CODE_PREFIX } from '@/lib/auth/code-prefixes'
import { createToken, verifyToken, shouldRefreshToken, refreshToken, type TokenPayload } from './jwt'
import { recordLoginAttempt, clearLoginAttempts } from './rate-limit'
import { canRoleAccess, hasPermission, type StaffPermission } from './role-policy'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// Re-export types
export type { TokenPayload }

// Types for auth
export interface AuthUser {
  id: string
  email: string // JWT still carries email (may be empty string for code-only users)
  name: string
  role: 'ADMIN'
}

export interface AuthResident {
  id: string
  code: string
}

export type LoginByCodeResult =
  | { success: true; type: 'staff'; user: AuthUser }
  | { success: true; type: 'resident'; code: string }
  | { success: false; error: string }

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
  const residentCode = cookieStore.get(RESIDENT_COOKIE)?.value

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
 * Require authenticated staff user — throws if not logged in.
 * Use as first line in all mutation server actions.
 */
export async function requireStaffAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error(ERROR_MESSAGES.AUTH_REQUIRED)
  }
  return user
}

/**
 * Check if current user has required role
 * Throws error if not authenticated or insufficient permissions
 */
export async function requireRole(allowedRoles: AuthUser['role'][]): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error(ERROR_MESSAGES.AUTH_REQUIRED)
  }

  if (!canRoleAccess(allowedRoles, user.role)) {
    throw new Error(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS)
  }

  return user
}

/**
 * Check if current user has required permission
 */
export async function requirePermission(permission: StaffPermission): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error(ERROR_MESSAGES.AUTH_REQUIRED)
  }

  if (!hasPermission(user.role, permission)) {
    throw new Error(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS)
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
 * Authenticate by code (unified login).
 *  - a staff prefix from ANY brand → staff login
 *  - RES-prefixed codes           → resident login
 *
 * Staff routing deliberately accepts every prefix the product has ever issued,
 * not just the active brand's. Codes outlive the brand that issued them: after
 * the AOZ→AOZH rebrand an existing `AOZ-…` code matches neither the active
 * staff prefix nor the resident one, falls through to "Ungültiger Code", and
 * locks out every staff member who has not been re-issued a code — including
 * the seeded admin. The lookup itself is still by exact string, so no code
 * changes meaning.
 */
export async function loginByCode(code: string, clientIp: string): Promise<LoginByCodeResult> {
  if (ALL_CODE_PREFIXES.some((prefix) => code.startsWith(prefix))) {
    // Staff login
    const user = await prisma.user.findUnique({
      where: { code },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
      },
    })

    if (!user || !user.active) {
      recordLoginAttempt(clientIp)
      return { success: false, error: 'Ungültiger Code' }
    }

    clearLoginAttempts(clientIp)
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return {
      success: true,
      type: 'staff',
      user: {
        id: user.id,
        email: user.email || '',
        name: user.name,
        role: user.role,
      },
    }
  }

  if (code.startsWith(RESIDENT_CODE_PREFIX)) {
    // Resident login
    const resident = await prisma.resident.findUnique({
      where: { code },
      select: { id: true, code: true },
    })

    if (!resident) {
      recordLoginAttempt(clientIp)
      return { success: false, error: 'Ungültiger Code' }
    }

    clearLoginAttempts(clientIp)
    return {
      success: true,
      type: 'resident',
      code: resident.code,
    }
  }

  return {
    success: false,
    error: `Ungültiger Code. Codes beginnen mit ${BRAND.codePrefix} oder ${RESIDENT_CODE_PREFIX}.`,
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
 * Optionally clears both staff and resident cookies for full logout
 */
export async function clearSessionCookie(clearAll = false): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_CONFIG.cookie.name)
  if (clearAll) {
    cookieStore.delete(RESIDENT_COOKIE)
  }
}
