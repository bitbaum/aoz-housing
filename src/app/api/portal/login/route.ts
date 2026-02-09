import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { portalLoginSchema, validateFormData } from '@/lib/validation/schemas'

// Simple in-memory rate limiting
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_ATTEMPTS = 5

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = loginAttempts.get(ip)

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }

  record.count++
  return record.count > MAX_ATTEMPTS
}

export async function POST(request: NextRequest) {
  // Rate limiting by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  if (isRateLimited(ip)) {
    redirect('/portal?error=rate_limited')
  }

  let code: string
  try {
    const formData = await request.formData()
    const data = validateFormData(portalLoginSchema, formData)
    code = data.code.trim().toUpperCase()
  } catch {
    redirect('/portal?error=code_required')
  }

  // Find resident by code
  const resident = await prisma.resident.findUnique({
    where: { code },
  })

  if (!resident) {
    redirect('/portal?error=invalid_code')
  }

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set('resident_code', code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  redirect('/portal')
}
