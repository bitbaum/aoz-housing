import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { contactInquiries, customers } from '@/db/schema'
import { contactSchema } from '@/lib/validation/schemas'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { handleRouteError, jsonError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    if (!rateLimit(`contact:${getClientIp(request)}`, 5, 60 * 60 * 1000)) {
      return jsonError(429, 'Too many requests. Please try again later.')
    }
    const input = contactSchema.parse(await request.json())

    // Link the inquiry to a known customer so the CRM shows the full picture.
    const [known] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.email, input.email))
      .limit(1)

    await db.insert(contactInquiries).values({
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      customerId: known?.id ?? null,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error, 'contact')
  }
}
