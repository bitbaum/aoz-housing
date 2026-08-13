import { NextRequest, NextResponse } from 'next/server'
import { loginByCode, setSessionCookie } from '@/lib/auth'
import { checkRateLimit, recordLoginAttempt, getClientIp } from '@/lib/auth/rate-limit'
import { logger } from '@/lib/logger'
import { setResidentCookie } from '@/lib/portal-auth'
import { isDemoEnabled, getDemoStaffCode, resolveDemoResidentCode } from '@/lib/demo/config'

type DemoRole = 'staff' | 'resident'

function getDemoCode(role: DemoRole) {
  if (!isDemoEnabled()) return null
  return role === 'staff' ? getDemoStaffCode() : resolveDemoResidentCode()
}

/**
 * Which demo doors exist on THIS deployment — asked by the login page at
 * render time. Server truth instead of a build-baked NEXT_PUBLIC flag, so
 * one build serves any demo configuration and a button is only ever shown
 * when pressing it can succeed.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      staff: Boolean(getDemoCode('staff')),
      resident: Boolean(getDemoCode('resident')),
    },
  })
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

    // The staff demo IS a full ADMIN session — this app has a single staff
    // role, so there is no lesser one to hand out. That is safe here by
    // construction, not by restriction: DEMO_ACCESS_ENABLED marks the whole
    // deployment as a presentation instance holding only seeded data, the
    // demo staff account is dedicated (never a real admin's code), and
    // api/cron/reset-demo restores the pristine dataset daily. Deployments
    // holding real data must never set DEMO_ACCESS_ENABLED.
    const code = getDemoCode(role)
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Demo-Zugang ist nicht konfiguriert' },
        { status: 404 }
      )
    }

    const clientIp = getClientIp(request)

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
