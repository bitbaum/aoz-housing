import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { customers } from '@/db/schema'
import { forgotPasswordSchema } from '@/lib/validation/schemas'
import { createResetToken } from '@/lib/auth/reset-tokens'
import { sendEmail } from '@/lib/email'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { handleRouteError, jsonError } from '@/lib/api'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3005'

/**
 * Always responds with the same generic success message — whether or not
 * the email exists — so this endpoint can't be used to check who has an
 * account (an enumeration oracle).
 */
export async function POST(request: Request) {
  try {
    if (!rateLimit(`forgot:${getClientIp(request)}`, 5, 60 * 60 * 1000)) {
      return jsonError(429, 'Too many attempts. Please try again later.')
    }
    const input = forgotPasswordSchema.parse(await request.json())

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, input.email))
      .limit(1)

    if (customer?.passwordHash && customer.active) {
      const token = await createResetToken(customer.id)
      const resetUrl = `${APP_URL}/reset-password?token=${token}`
      await sendEmail(customer.email, 'passwordReset', resetUrl)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error, 'auth/forgot-password')
  }
}
