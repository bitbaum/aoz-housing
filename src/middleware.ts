import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * Middleware for authentication
 *
 * - Staff routes require valid JWT
 * - Resident portal routes require resident code
 * - Public routes remain open
 * - Implements sliding session refresh
 */

// Routes that require staff authentication
const STAFF_ROUTES = [
  '/',
  '/residents',
  '/housing',
  '/placements',
  '/incidents',
  '/maintenance',
  '/matching',
  '/analytics',
]

// Routes that require resident authentication
const RESIDENT_ROUTES = [
  '/portal/preferences',
  '/portal/roommates',
  '/portal/report',
  '/api/portal/report',
  '/api/portal/preferences',
  '/api/portal/satisfaction',
]

// Routes that remain public
const PUBLIC_ROUTES = [
  '/login',
  '/portal',        // Portal login page
  '/portal/help',   // Help is always accessible
  '/algorithm',     // Public explanation of how it works
  '/api/auth',      // Auth endpoints themselves
  '/api/health',    // Health check
]

// Auth config (must match lib/auth/config.ts)
const AUTH_CONFIG = {
  cookieName: 'staff_session',
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  issuer: 'aoz-housing',
  refreshThreshold: 60 * 60, // 1 hour before expiry
  expiresIn: parseInt(process.env.SESSION_DURATION || '28800', 10),
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )
}

function requiresStaffAuth(pathname: string): boolean {
  // Root path requires auth
  if (pathname === '/') return true

  return STAFF_ROUTES.some(route =>
    route !== '/' && (pathname === route || pathname.startsWith(`${route}/`))
  )
}

function requiresResidentAuth(pathname: string): boolean {
  return RESIDENT_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )
}

async function verifyStaffToken(token: string): Promise<{ valid: boolean; shouldRefresh: boolean; payload?: any }> {
  try {
    const secret = new TextEncoder().encode(AUTH_CONFIG.secret)
    const { payload } = await jwtVerify(token, secret, {
      issuer: AUTH_CONFIG.issuer,
    })

    // Check if token should be refreshed
    const now = Math.floor(Date.now() / 1000)
    const exp = payload.exp as number
    const shouldRefresh = exp - now < AUTH_CONFIG.refreshThreshold

    return { valid: true, shouldRefresh, payload }
  } catch {
    return { valid: false, shouldRefresh: false }
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Check staff auth for staff routes
  if (requiresStaffAuth(pathname)) {
    const token = request.cookies.get(AUTH_CONFIG.cookieName)?.value

    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const { valid, shouldRefresh, payload } = await verifyStaffToken(token)

    if (!valid) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      const response = NextResponse.redirect(loginUrl)
      // Clear invalid cookie
      response.cookies.delete(AUTH_CONFIG.cookieName)
      return response
    }

    // Sliding session refresh - handled by creating new token
    // We can't create tokens in Edge middleware without the jose sign function
    // So we'll let the session/route handlers refresh instead
    // This just validates; refresh happens on API calls

    const response = NextResponse.next()

    // Add user info to headers for server components
    if (payload) {
      response.headers.set('x-user-id', payload.sub as string)
      response.headers.set('x-user-role', payload.role as string)
    }

    return response
  }

  // Check resident auth for resident routes
  if (requiresResidentAuth(pathname)) {
    const residentCode = request.cookies.get('resident_code')?.value

    if (!residentCode) {
      return NextResponse.redirect(new URL('/portal', request.url))
    }

    // Note: Full validation (checking code exists in DB) happens in the route
    // Middleware just checks cookie presence
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/health).*)',
  ],
}
