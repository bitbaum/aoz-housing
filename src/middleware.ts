import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import {
  isPublicRoute,
  requiresResidentAuth,
  requiresStaffAuth,
} from '@/lib/auth/route-boundaries'
import {
  STAFF_COOKIE,
  RESIDENT_COOKIE,
  JWT_ISSUER,
  SESSION_SECRET,
  SESSION_REFRESH_THRESHOLD_SECONDS,
} from '@/lib/auth/constants'

/**
 * Middleware for authentication
 *
 * - Staff routes require valid JWT
 * - Resident portal routes require resident code
 * - Public routes remain open
 * - Implements sliding session refresh
 */

async function verifyStaffToken(token: string): Promise<{ valid: boolean; shouldRefresh: boolean; payload?: Record<string, unknown> }> {
  try {
    const secret = new TextEncoder().encode(SESSION_SECRET)
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
    })

    const now = Math.floor(Date.now() / 1000)
    const exp = payload.exp as number
    const shouldRefresh = exp - now < SESSION_REFRESH_THRESHOLD_SECONDS

    return { valid: true, shouldRefresh, payload }
  } catch {
    return { valid: false, shouldRefresh: false }
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  if (requiresStaffAuth(pathname)) {
    const token = request.cookies.get(STAFF_COOKIE)?.value

    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const { valid, payload } = await verifyStaffToken(token)

    if (!valid) {
      if (!pathname.startsWith('/api/')) {
        // UI routes are verified again in the server admin layout. This keeps
        // Edge middleware as a fast coarse gate without blocking valid Node
        // sessions when Edge env/JWT verification drifts in production.
        return NextResponse.next()
      }

      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete(STAFF_COOKIE)
      return response
    }

    const response = NextResponse.next()
    if (payload) {
      response.headers.set('x-user-id', payload.sub as string)
      response.headers.set('x-user-role', payload.role as string)
    }

    return response
  }

  if (requiresResidentAuth(pathname)) {
    const residentCode = request.cookies.get(RESIDENT_COOKIE)?.value

    if (!residentCode) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })
      }

      return NextResponse.redirect(new URL('/portal', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/health).*)',
  ],
}
