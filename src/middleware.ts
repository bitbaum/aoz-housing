import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for authentication (prepared for future implementation)
 *
 * CURRENT STATE: Pass-through (no auth required for pilot)
 *
 * AFTER AUTH IMPLEMENTATION:
 * - Admin routes (/) require staff session
 * - Portal routes (/portal/*) require resident code
 * - Public routes (/portal/help, /algorithm) remain open
 */

// Routes that will require staff authentication
const STAFF_ROUTES = [
  '/residents',
  '/housing',
  '/placements',
  '/incidents',
  '/maintenance',
  '/matching',
  '/analytics',
]

// Routes that will require resident authentication
const RESIDENT_ROUTES = [
  '/portal/preferences',
  '/portal/roommates',
  '/portal/report',
]

// Routes that remain public
const PUBLIC_ROUTES = [
  '/portal',        // Login page
  '/portal/help',   // Help is always accessible
  '/algorithm',     // Public explanation of how it works
  '/api/auth',      // Auth endpoints themselves
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // PILOT MODE: Allow all access
  // TODO: Remove this block when implementing auth
  return NextResponse.next()

  // === FUTURE AUTH IMPLEMENTATION ===
  // Uncomment below when ready to enforce auth

  /*
  // Check if route requires staff auth
  const requiresStaffAuth = STAFF_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  if (requiresStaffAuth) {
    const session = request.cookies.get('staff_session')?.value
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // TODO: Validate session token
  }

  // Check if route requires resident auth
  const requiresResidentAuth = RESIDENT_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  if (requiresResidentAuth) {
    const residentCode = request.cookies.get('resident_code')?.value
    if (!residentCode) {
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    // TODO: Validate resident code exists in database
  }

  return NextResponse.next()
  */
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/health).*)',
  ],
}
