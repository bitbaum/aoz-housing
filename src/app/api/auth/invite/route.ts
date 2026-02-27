import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sendEmail } from '@/lib/email/service'
import { staffInviteEmail } from '@/lib/email/templates'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

function generateStaffCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'AOZ-'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * POST /api/auth/invite
 * Invite a new staff member by email.
 * Creates a User record with a generated AOZ code and sends the code by email.
 *
 * Body: { email: string, name: string }
 * Requires: authenticated admin session
 */
export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.AUTH_REQUIRED },
      { status: 401 }
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

  const { email, name } = body as { email?: string; name?: string }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json(
      { success: false, error: 'Gültige E-Mail-Adresse erforderlich' },
      { status: 400 }
    )
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
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
  const user = await prisma.user.create({
    data: {
      code,
      email: email.toLowerCase(),
      name: name.trim(),
      role: 'ADMIN',
      active: true,
    },
    select: { id: true, code: true, name: true, email: true },
  })

  // Send invite email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const { subject, html } = staffInviteEmail({
    recipientEmail: email,
    staffCode: code,
    invitedByName: currentUser.name,
    appUrl,
  })

  const emailSent = await sendEmail([email], subject, html)

  return NextResponse.json({
    success: true,
    user: { id: user.id, code: user.code, name: user.name, email: user.email },
    emailSent,
  })
}
