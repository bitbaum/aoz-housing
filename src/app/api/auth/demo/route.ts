import { NextRequest, NextResponse } from 'next/server'
import { loginByCode, setSessionCookie } from '@/lib/auth'
import { checkRateLimit, recordLoginAttempt } from '@/lib/auth/rate-limit'
import { logger } from '@/lib/logger'
import { setResidentCookie } from '@/lib/portal-auth'

type DemoRole = 'staff' | 'resident'

function getDemoCode(role: DemoRole) {
  if (process.env.DEMO_ACCESS_ENABLED !== 'true') return null
  return role === 'staff'
    ? process.env.DEMO_STAFF_CODE
    : process.env.DEMO_RESIDENT_CODE
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const role = body?.role

    if (role !== 'staff' && role !== 'resident') {
      return NextResponse.json(
        { success: false, error: 'Demo-Rolle ungültig' },
        { status: 400 }
      )
    }

    // Production safety: never hand out a full-privilege ADMIN demo session
    // in production, regardless of DEMO_ACCESS_ENABLED. Resident demo is fine
    // (read-only data scoped to that resident).
    if (process.env.NODE_ENV === 'production' && role === 'staff') {
      return NextResponse.json(
        { success: false, error: 'Demo-Zugang ist nicht konfiguriert' },
        { status: 404 }
      )
    }

    const code = getDemoCode(role)
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Demo-Zugang ist nicht konfiguriert' },
        { status: 404 }
      )
    }

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'demo'

    // Throttle: the demo endpoint issues real sessions; rate-limit per IP.
    const rateCheck = checkRateLimit(clientIp)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `Zu viele Versuche. Bitte warten Sie ${rateCheck.retryAfter} Sekunden.` },
        { status: 429 }
      )
    }

    const result = await loginByCode(code.trim().toUpperCase(), clientIp)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      )
    }

    // Count the SUCCESS. loginByCode already records failed codes, but the
    // thing this endpoint throttles is session issuance, and a demo code is
    // valid by definition — so without this one IP could mint unlimited
    // sessions from a known-good code while the counter stayed at zero.
    recordLoginAttempt(clientIp)

    if (result.type === 'staff') {
      await setSessionCookie(result.user)
      return NextResponse.json({ success: true, type: 'staff' })
    }

    await setResidentCookie(result.code)

    return NextResponse.json({ success: true, type: 'resident' })
  } catch (error) {
    logger.errorWithCause('Demo login failed', error)
    return NextResponse.json(
      { success: false, error: 'Demo-Zugang fehlgeschlagen' },
      { status: 500 }
    )
  }
}
