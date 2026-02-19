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
]

// Routes that require resident authentication
export const RESIDENT_ROUTES = [
  '/portal/preferences',
  '/portal/roommates',
  '/portal/report',
  '/portal/chores',
  '/api/portal/report',
  '/api/portal/preferences',
  '/api/portal/satisfaction',
  '/api/portal/chores',
]

// Routes that remain public
export const PUBLIC_ROUTES = [
  '/login',
  '/portal',
  '/portal/help',
  '/algorithm',
  '/api/auth',
  '/api/health',
  '/api/portal/login',
  '/api/portal/register',
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
