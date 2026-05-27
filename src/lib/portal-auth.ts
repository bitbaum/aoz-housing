/**
 * Shared portal authentication helpers
 *
 * Extracts the repeated patterns of reading the `resident_code` cookie,
 * finding the resident, and getting their active placement.
 *
 * DRY: Used by all portal API routes and server components.
 */

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { RESIDENT_COOKIE, RESIDENT_COOKIE_MAX_AGE_SECONDS } from '@/lib/auth/constants'

// Re-export so existing call sites continue to import from '@/lib/portal-auth'.
export { RESIDENT_COOKIE }

export interface PortalAuthResult {
  resident: {
    id: string
    code: string
  }
  placement: {
    id: string
    housingUnitId: string
  }
}

/**
 * Read the resident_code cookie, or redirect to the given path if missing.
 * Use from server components when you need to perform a custom Prisma query.
 */
export async function requireResidentCookie(redirectTo = '/login'): Promise<string> {
  const cookieStore = await cookies()
  const code = cookieStore.get(RESIDENT_COOKIE)?.value
  if (!code) redirect(redirectTo)
  return code
}

/**
 * Read the resident_code cookie without redirecting.
 * Use from API routes that should return JSON 401 instead of redirecting.
 */
export async function getResidentCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(RESIDENT_COOKIE)?.value ?? null
}

/** Set the resident_code cookie after successful login. SSOT for cookie options. */
export async function setResidentCookie(code: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(RESIDENT_COOKIE, code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: RESIDENT_COOKIE_MAX_AGE_SECONDS,
    path: '/',
  })
}

/**
 * Authenticate portal request and return resident + active placement.
 * Returns null if not authenticated or no active placement.
 */
export async function getPortalAuth(): Promise<PortalAuthResult | null> {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get(RESIDENT_COOKIE)?.value

  if (!residentCode) return null

  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
    select: {
      id: true,
      code: true,
      placements: {
        where: { status: 'ACTIVE' },
        select: { id: true, housingUnitId: true },
        take: 1,
      },
    },
  })

  if (!resident) return null

  const placement = resident.placements[0]
  if (!placement) return null

  return {
    resident: { id: resident.id, code: resident.code },
    placement: { id: placement.id, housingUnitId: placement.housingUnitId },
  }
}
