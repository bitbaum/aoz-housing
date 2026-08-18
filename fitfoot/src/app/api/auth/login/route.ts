import { NextResponse } from 'next/server'
import { loginSchema } from '@/lib/validation/schemas'
import { loginCustomer, FlowError } from '@/lib/auth/flows'
import { setSessionCookie } from '@/lib/auth/session'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { handleRouteError, jsonError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    if (!rateLimit(`login:${getClientIp(request)}`, 10, 15 * 60 * 1000)) {
      return jsonError(429, 'Too many attempts. Please try again later.')
    }
    const input = loginSchema.parse(await request.json())
    const customer = await loginCustomer(input)
    await setSessionCookie({ sub: customer.id, email: customer.email, role: customer.role })
    return NextResponse.json({ ok: true, role: customer.role })
  } catch (error) {
    if (error instanceof FlowError) return jsonError(error.status, error.message)
    return handleRouteError(error, 'auth/login')
  }
}
