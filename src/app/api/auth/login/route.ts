import { NextRequest, NextResponse } from 'next/server'
import { loginByCode, setSessionCookie } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { checkRateLimit, clearLoginAttempts } from '@/lib/auth/rate-limit'
import { setResidentCookie } from '@/lib/portal-auth'

export async function POST(request: NextRequest) {
  try {
    // A body that is absent, truncated (client disconnected mid-request) or not
    // JSON is a *client* error. Letting request.json() throw into the catch
    // below turned it into a 500 + ERROR-level log, which is both wrong for the
    // caller and noise for alerting.
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Code erforderlich' },
        { status: 400 }
      )
    }

    const { code } = (body ?? {}) as { code?: unknown }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Code erforderlich' },
        { status: 400 }
      )
    }

    const trimmedCode = code.trim().toUpperCase()

    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    // Check rate limit
    const rateCheck = checkRateLimit(clientIp)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `Zu viele Anmeldeversuche. Bitte warten Sie ${rateCheck.retryAfter} Sekunden.`, retryAfter: rateCheck.retryAfter },
        { status: 429 }
      )
    }

    const result = await loginByCode(trimmedCode, clientIp)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      )
    }

    // Clear rate limit on success
    clearLoginAttempts(clientIp)

    if (result.type === 'staff') {
      await setSessionCookie(result.user)
      return NextResponse.json({
        success: true,
        type: 'staff',
        user: result.user,
      })
    }

    // Resident login — set resident_code cookie
    await setResidentCookie(trimmedCode)

    return NextResponse.json({
      success: true,
      type: 'resident',
      code: result.code,
    })
  } catch (error) {
    logger.errorWithCause('Login failed', error)
    return NextResponse.json(
      { success: false, error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
