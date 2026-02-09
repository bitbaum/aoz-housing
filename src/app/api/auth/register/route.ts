import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { staffRegistrationSchema } from '@/lib/validation/schemas'
import { hashPassword } from '@/lib/auth/password'
import { setSessionCookie } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'

// Rate limiting: 3 registrations per IP per minute
const registerAttempts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
const MAX_ATTEMPTS = 3

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = registerAttempts.get(ip)

  if (!record || now > record.resetAt) {
    registerAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }

  record.count++
  return record.count > MAX_ATTEMPTS
}

const INVITE_CODE = process.env.STAFF_INVITE_CODE || '0000'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: 'Zu viele Versuche. Bitte warte eine Minute.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Ungültige Anfrage.' },
      { status: 400 }
    )
  }

  const result = staffRegistrationSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: 'Bitte alle Pflichtfelder korrekt ausfüllen.', details: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // Verify invite code
  if (result.data.inviteCode !== INVITE_CODE) {
    return NextResponse.json(
      { success: false, error: 'Ungültiger Einladungscode' },
      { status: 403 }
    )
  }

  // Check email uniqueness
  const existing = await prisma.user.findUnique({
    where: { email: result.data.email.toLowerCase() },
    select: { id: true },
  })

  if (existing) {
    return NextResponse.json(
      { success: false, error: 'Diese E-Mail ist bereits registriert' },
      { status: 409 }
    )
  }

  // Create user
  const passwordHash = await hashPassword(result.data.password)
  const user = await prisma.user.create({
    data: {
      email: result.data.email.toLowerCase(),
      name: result.data.name,
      passwordHash,
      role: 'CASE_WORKER',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  })

  // Auto-login via session cookie
  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
  await setSessionCookie(authUser)

  return NextResponse.json({
    success: true,
    user: authUser,
  })
}
