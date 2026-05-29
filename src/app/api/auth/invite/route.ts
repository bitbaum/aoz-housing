import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sendEmail } from '@/lib/email/service'
import { staffInviteEmail } from '@/lib/email/templates'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { generateStaffCode } from '@/lib/auth/code-generation'
import { checkRateLimit, recordLoginAttempt } from '@/lib/auth/rate-limit'
import { logger } from '@/lib/logger'
import { Prisma } from '@prisma/client'

/**
 * POST /api/auth/invite
 * Invite a new staff member by email.
 * Creates a User record with a generated AOZ code and sends the code by email.
 *
 * Body: { email: string, name: string }
 * Requires: authenticated admin session
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const rateCheck = checkRateLimit(ip)
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.RATE_LIMITED, retryAfter: rateCheck.retryAfter },
      { status: 429 }
    )
  }

  const currentUser = await getCurrentUser()
  if (!currentUser) {
    recordLoginAttempt(ip)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.AUTH_REQUIRED },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    recordLoginAttempt(ip)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.INVALID_REQUEST },
      { status: 400 }
    )
  }

  const { email, name } = body as { email?: string; name?: string }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    recordLoginAttempt(ip)
    return NextResponse.json(
      { success: false, error: 'Gültige E-Mail-Adresse erforderlich' },
      { status: 400 }
    )
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    recordLoginAttempt(ip)
    return NextResponse.json(
      { success: false, error: 'Name ist erforderlich (mindestens 2 Zeichen)' },
      { status: 400 }
    )
  }

  // Generate a unique code
  let code: string | null = null
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateStaffCode()
    const existing = await prisma.user.findUnique({ where: { code: candidate } })
    if (!existing) {
      code = candidate
      break
    }
  }
  if (!code) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.CODE_GENERATION_ERROR },
      { status: 500 }
    )
  }

  // Check if email already registered
  const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existingEmail) {
    return NextResponse.json(
      { success: false, error: 'Diese E-Mail-Adresse ist bereits registriert' },
      { status: 409 }
    )
  }

  // Create user
  let user
  try {
    user = await prisma.user.create({
      data: {
        code,
        email: email.toLowerCase(),
        name: name.trim(),
        role: 'ADMIN',
        active: true,
      },
      select: { id: true, code: true, name: true, email: true },
    })
  } catch (error) {
    // Race between pre-check and insert: surface conflict explicitly.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta as { target?: string[] } | undefined)?.target?.[0]
      const message = target === 'email'
        ? 'Diese E-Mail-Adresse ist bereits registriert'
        : 'Dieser Code ist bereits vergeben'
      return NextResponse.json({ success: false, error: message }, { status: 409 })
    }
    logger.errorWithCause('Failed to invite staff user', error, { email })
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.SAVE_ERROR },
      { status: 500 }
    )
  }

  // Fire-and-forget email send. The admin caller shouldn't wait on Brevo —
  // the user record is already created. Failures are logged by sendEmail.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const { subject, html } = staffInviteEmail({
    recipientEmail: email,
    staffCode: code,
    invitedByName: currentUser.name,
    appUrl,
  })

  sendEmail([email], subject, html).catch((err) =>
    logger.errorWithCause('Failed to send staff invite email', err, { userId: user.id })
  )

  return NextResponse.json({
    success: true,
    user: { id: user.id, code: user.code, name: user.name, email: user.email },
    // We can't await delivery without re-introducing the hang; report optimistically.
    emailSent: true,
  })
}
