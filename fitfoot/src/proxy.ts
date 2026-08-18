/**
 * Proxy (Next.js 16's renamed middleware) — coarse route protection.
 * /admin needs a session whose token claims STAFF or ADMIN; the
 * server-side guards re-check the database on every request (tokens can
 * outlive a role change — the guard is the truth).
 */
import { NextResponse, type NextRequest } from 'next/server'
import { verifySessionToken } from '@/lib/auth/session'

const SESSION_COOKIE = 'fitfoot_session'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const needsStaff = pathname.startsWith('/admin')
  const needsAuth = needsStaff || pathname.startsWith('/account')

  if (!needsAuth) return NextResponse.next()

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await verifySessionToken(token) : null

  if (!session) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', pathname)
    return NextResponse.redirect(login)
  }

  if (needsStaff && session.role !== 'STAFF' && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
}
