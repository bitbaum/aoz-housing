import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { customers } from '@/db/schema'
import { resetPasswordSchema } from '@/lib/validation/schemas'
import { consumeResetToken } from '@/lib/auth/reset-tokens'
import { hashPassword } from '@/lib/auth/passwords'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { handleRouteError, jsonError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    if (!rateLimit(`reset:${getClientIp(request)}`, 10, 60 * 60 * 1000)) {
      return jsonError(429, 'Too many attempts. Please try again later.')
    }
    const input = resetPasswordSchema.parse(await request.json())

    const customerId = await consumeResetToken(input.token)
    if (!customerId) {
      return jsonError(400, 'This link has expired or was already used. Please request a new one.')
    }

    const passwordHash = await hashPassword(input.password)
    await db.update(customers).set({ passwordHash }).where(eq(customers.id, customerId))

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error, 'auth/reset-password')
  }
}
