import { NextRequest, NextResponse } from 'next/server'
import { loginByCode, setSessionCookie } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { checkRateLimit, clearLoginAttempts } from '@/lib/auth/rate-limit'
import { RESIDENT_COOKIE } from '@/lib/portal-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

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
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.set(RESIDENT_COOKIE, trimmedCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

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
