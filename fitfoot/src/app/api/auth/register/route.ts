import { NextResponse } from 'next/server'
import { registerSchema } from '@/lib/validation/schemas'
import { registerCustomer, FlowError } from '@/lib/auth/flows'
import { setSessionCookie } from '@/lib/auth/session'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { handleRouteError, jsonError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    if (!rateLimit(`register:${getClientIp(request)}`, 5, 60 * 60 * 1000)) {
      return jsonError(429, 'Too many attempts. Please try again later.')
    }
    const input = registerSchema.parse(await request.json())
    const customer = await registerCustomer(input)
    await setSessionCookie({ sub: customer.id, email: customer.email, role: customer.role })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof FlowError) return jsonError(error.status, error.message)
    return handleRouteError(error, 'auth/register')
  }
}
