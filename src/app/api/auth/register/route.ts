import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { generateStaffCode } from '@/lib/auth/code-generation'

/**
 * Staff user provisioning (admin-only).
 * Creates a new staff user with an AOZ code.
 *
 * POST { name: string, code?: string }
 * - If code is not provided, one is generated.
 * - Requires authenticated admin session.
 */

export async function POST(request: NextRequest) {
  // Only admins can create new staff users
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

  const { name, code: requestedCode } = body as { name?: string; code?: string }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json(
      { success: false, error: 'Name ist erforderlich (mindestens 2 Zeichen)' },
      { status: 400 }
    )
  }

  // Generate or validate code
  let code = requestedCode?.trim().toUpperCase()
  if (code && !code.startsWith('AOZ-')) {
    return NextResponse.json(
      { success: false, error: 'Code muss mit AOZ- beginnen' },
      { status: 400 }
    )
  }

  if (!code) {
    // Generate a unique code
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
  }

  // Check code uniqueness
  const existing = await prisma.user.findUnique({ where: { code } })
  if (existing) {
    return NextResponse.json(
      { success: false, error: 'Dieser Code ist bereits vergeben' },
      { status: 409 }
    )
  }

  try {
    const user = await prisma.user.create({
      data: {
        code,
        name: name.trim(),
        role: 'ADMIN',
        active: true,
      },
      select: { id: true, code: true, name: true, role: true },
    })

    return NextResponse.json({
      success: true,
      user,
    })
  } catch {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.SAVE_ERROR },
      { status: 500 }
    )
  }
}
