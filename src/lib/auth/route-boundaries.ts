/**
 * Auth route boundary definitions and pure match helpers.
 * Kept framework-agnostic for easy testing.
 */

// Routes that require staff authentication
export const STAFF_ROUTES = [
  '/',
  '/residents',
  '/housing',
  '/placements',
  '/incidents',
  '/maintenance',
  '/matching',
  '/analytics',
  '/chores',
  '/transfer-requests',
  '/api/export',
  '/api/import',
]

// Routes that require resident authentication
export const RESIDENT_ROUTES = [
  '/portal/preferences',
  '/portal/roommates',
  '/portal/report',
  '/portal/chores',
  '/portal/transfer',
  '/portal/expenses',
  '/portal/apartment',
  '/portal/profile',
  '/api/portal/transfer',
  '/api/portal/report',
  '/api/portal/preferences',
  '/api/portal/satisfaction',
  '/api/portal/chores',
  '/api/portal/expenses',
  '/api/portal/settlements',
  '/api/portal/profile',
  '/api/portal/apartment',
  '/api/portal/residents',
]

// Routes that remain public.
//
// Being listed here only means the middleware waves the request through — it
// does NOT make a page readable, because the layout above that page runs
// afterwards and can still redirect. `/algorithm` sat in this list for months
// while `(admin)/layout.tsx` bounced every signed-out visitor to /login, so the
// boundary the code declared and the boundary the app enforced disagreed.
// A page that is genuinely public belongs in the `(public)` route group, whose
// layout reads no session. `public-routes-reachable.test.ts` checks that.
export const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/portal',
  '/portal/help',
  '/blog',
  '/api/auth',
  '/api/health',
  '/api/cron',
]

export function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`)
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => matchesRoute(pathname, route))
}

export function requiresStaffAuth(pathname: string): boolean {
  if (pathname === '/') return true
  return STAFF_ROUTES.some((route) => route !== '/' && matchesRoute(pathname, route))
}

export function requiresResidentAuth(pathname: string): boolean {
  return RESIDENT_ROUTES.some((route) => matchesRoute(pathname, route))
}
