import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { portalRegistrationSchema } from '@/lib/validation/schemas'

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

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No I/O/0/1 to avoid confusion
  let code = 'RES-'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

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

  const result = portalRegistrationSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: 'Bitte alle Pflichtfelder ausfüllen.', details: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // Generate unique code with retry
  let code: string | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = generateCode()
    const existing = await prisma.resident.findUnique({ where: { code: candidate } })
    if (!existing) {
      code = candidate
      break
    }
  }

  if (!code) {
    return NextResponse.json(
      { success: false, error: 'Code-Generierung fehlgeschlagen. Bitte erneut versuchen.' },
      { status: 500 }
    )
  }

  // Create resident with sensible defaults
  await prisma.resident.create({
    data: {
      code,
      ageRange: result.data.ageRange,
      gender: result.data.gender,
      familyStatus: result.data.familyStatus,
      languages: result.data.languages,
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
      notes: 'Selbstregistrierung via Portal',
    },
  })

  // Set resident_code cookie
  const cookieStore = await cookies()
  cookieStore.set('resident_code', code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return NextResponse.json({ success: true, code })
}
