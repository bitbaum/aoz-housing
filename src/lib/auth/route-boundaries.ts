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
  '/messages',
  '/transfer-requests',
  '/api/messages',
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
  '/api/portal/messages',
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
  '/changelog',
  '/roadmap',
  // The landing page. `/` rewrites here for anonymous visitors, so it must be
  // reachable without a session — and it is also a real URL of its own.
  '/willkommen',
  '/api/auth',
  '/api/health',
  '/api/cron',
]

/** The landing page a stranger sees at the bare domain. */
export const LANDING_ROUTE = '/willkommen'

/**
 * What the product's own address should do, by who is asking.
 *
 * It used to answer every stranger with a login form, which says nothing except
 * "you are not welcome yet". Now:
 *
 *  - staff continue to their dashboard, which is what `/` has always been;
 *  - a resident goes to the portal, because someone who already lives here does
 *    not need to be sold the product they use;
 *  - everyone else gets the landing page, REWRITTEN rather than redirected, so
 *    the URL stays the bare domain instead of turning into /willkommen.
 *
 * Extracted as a pure function so the decision is testable on its own. Inside
 * the middleware it would only be reachable by constructing a NextRequest, and
 * an untested branch here means strangers, residents or staff silently landing
 * on the wrong side of the product.
 */
export type RootDestination =
  | { kind: 'staff-dashboard' }
  | { kind: 'redirect'; to: string }
  | { kind: 'rewrite'; to: string }

/**
 * The parameter is `hasVALIDStaffSession`, not `hasStaffSession`, and the
 * difference is the whole bug it was written to end.
 *
 * This used to be answered from cookie PRESENCE. A staff cookie that had
 * expired — or been signed with a secret that has since rotated — still sent
 * `/` to the dashboard, the dashboard bounced to /login, and the landing page
 * became permanently unreachable for that browser: every visit repeated the
 * loop, because nothing ever cleared the dead credential. The product's own
 * address answered "you are not welcome yet" to someone who had simply been
 * away too long, and no amount of navigating could escape it.
 *
 * Presence is not a session. The caller must verify before asking.
 */
export function destinationForRoot({
  hasValidStaffSession,
  hasResidentSession,
}: {
  hasValidStaffSession: boolean
  hasResidentSession: boolean
}): RootDestination {
  // Staff wins when someone holds both: it is the bigger surface, and the nav
  // offers the switch. Same rule as `establishSessions()` uses at login.
  if (hasValidStaffSession) return { kind: 'staff-dashboard' }
  if (hasResidentSession) return { kind: 'redirect', to: '/portal' }
  return { kind: 'rewrite', to: LANDING_ROUTE }
}

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
