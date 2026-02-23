import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { staffRegistrationSchema } from '@/lib/validation/schemas'
import { hashPassword } from '@/lib/auth/password'
import { setSessionCookie } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

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

function generateResidentCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No I/O/0/1 to avoid confusion
  let code = 'RES-'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

async function ensureResidentProfile(email: string, notesPrefix: string): Promise<string | null> {
  const marker = `${notesPrefix} (${email.toLowerCase()})`

  const existing = await prisma.resident.findFirst({
    where: { notes: marker },
    select: { code: true },
    orderBy: { createdAt: 'desc' },
  })

  if (existing?.code) return existing.code

  let code: string | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = generateResidentCode()
    const duplicate = await prisma.resident.findUnique({ where: { code: candidate } })
    if (!duplicate) {
      code = candidate
      break
    }
  }

  if (!code) return null

  await prisma.resident.create({
    data: {
      code,
      ageRange: 'ADULT',
      gender: 'PREFER_NOT_SAY',
      familyStatus: 'SINGLE',
      languages: [],
      sleepSchedule: 'STANDARD',
      socialStyle: 'MODERATE',
      smokingStatus: 'NON_SMOKER',
      noiseTolerance: 3,
      cleanlinessLevel: 3,
      privacyNeed: 3,
      choresContribution: 3,
      mobilityNeeds: 'NONE',
      status: 'ACTIVE',
      petTolerance: true,
      sharedBathroom: true,
      sharedKitchen: true,
      notes: marker,
    },
  })

  return code
}

async function setResidentCookie(code: string) {
  const cookieStore = await cookies()
  cookieStore.set('resident_code', code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}

async function createResidentAndSession(email: string) {
  const code = await ensureResidentProfile(email, 'Selbstregistrierung via Login (ohne AOZ-Code)')

  if (!code) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.CODE_GENERATION_ERROR },
      { status: 500 }
    )
  }

  await setResidentCookie(code)

  return NextResponse.json({
    success: true,
    profileType: 'resident',
    code,
  })
}

const AOZ_REGISTRATION_CODE = process.env.AOZ_REGISTRATION_CODE || process.env.STAFF_INVITE_CODE || '0000'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.RATE_LIMITED },
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

  const result = staffRegistrationSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.REGISTRATION_FIELDS_REQUIRED_CORRECT, details: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const inviteCode = result.data.inviteCode?.trim()

  // Without AOZ code, user is created as resident profile and logged into portal.
  if (!inviteCode) {
    return createResidentAndSession(result.data.email)
  }

  // With AOZ code, create staff profile.
  if (inviteCode !== AOZ_REGISTRATION_CODE) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.INVALID_AOZ_CODE },
      { status: 403 }
    )
  }

  const existing = await prisma.user.findUnique({
    where: { email: result.data.email.toLowerCase() },
    select: { id: true },
  })

  if (existing) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED },
      { status: 409 }
    )
  }

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

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
  await setSessionCookie(authUser)

  // For testing both sides with the same email, also provision/reuse a resident profile.
  const residentCode = await ensureResidentProfile(result.data.email, 'Dualprofil via AOZ-Registrierung')
  if (residentCode) {
    await setResidentCookie(residentCode)
  }

  return NextResponse.json({
    success: true,
    profileType: 'staff',
    residentCode,
    user: authUser,
  })
}
