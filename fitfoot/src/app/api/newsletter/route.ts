import { NextResponse } from 'next/server'
import { db } from '@/db'
import { newsletterSubscribers } from '@/db/schema'
import { newsletterSchema } from '@/lib/validation/schemas'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { handleRouteError, jsonError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    if (!rateLimit(`newsletter:${getClientIp(request)}`, 5, 60 * 60 * 1000)) {
      return jsonError(429, 'Too many requests. Please try again later.')
    }
    const input = newsletterSchema.parse(await request.json())
    await db
      .insert(newsletterSubscribers)
      .values({ email: input.email })
      .onConflictDoUpdate({
        target: newsletterSubscribers.email,
        set: { unsubscribedAt: null, subscribedAt: new Date() },
      })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error, 'newsletter')
  }
}
