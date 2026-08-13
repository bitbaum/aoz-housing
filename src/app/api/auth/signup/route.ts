/**
 * POST /api/auth/signup — claim your code with email + password.
 *
 * Public, rate-limited. Every attempt counts (an attacker probing codes gets
 * throttled whether the codes exist or not). Success logs the account in
 * immediately — a register → login round-trip is friction with no benefit.
 */
import { NextRequest, NextResponse } from 'next/server'
import { registerAccount } from '@/lib/auth/account'
import { setSessionCookie } from '@/lib/auth'
import { setResidentCookie } from '@/lib/portal-auth'
import { consumeRateLimit, getClientIp } from '@/lib/auth/rate-limit'
import { registerSchema } from '@/lib/validation/auth'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const rateCheck = consumeRateLimit(getClientIp(request))
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.RATE_LIMITED, retryAfter: rateCheck.retryAfter },
        { status: 429 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INVALID_REQUEST },
        { status: 400 }
      )
    }

    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || ERROR_MESSAGES.INVALID_INPUT },
        { status: 400 }
      )
    }

    const result = await registerAccount(parsed.data)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    if (result.identity.type === 'staff') {
      const { id, email, name, role } = result.identity
      await setSessionCookie({ id, email, name, role })
    } else {
      await setResidentCookie(result.identity.code)
    }

    return NextResponse.json({ success: true, type: result.identity.type })
  } catch (error) {
    logger.errorWithCause('Signup failed', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.SESSION_ERROR },
      { status: 500 }
    )
  }
}
