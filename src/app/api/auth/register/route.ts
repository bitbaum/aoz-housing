import { BRAND } from '@/lib/config/brand'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import {
  ASSIGNABLE_STAFF_ROLES,
  hasPermission,
  isStaffRole,
  isStaffScope,
  type StaffRole,
  type StaffScopeId,
} from '@/lib/auth/role-policy'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { generateStaffCode } from '@/lib/auth/code-generation'
import { logger } from '@/lib/logger'
import { Prisma } from '@prisma/client'

/**
 * Staff user provisioning (Leitung only).
 * Creates a new staff user with a code.
 *
 * POST { name, code?, role?, scope?, isSystemAdmin? }
 * - If code is not provided, one is generated.
 * - Every omitted field defaults to the NARROW answer: own domain, no
 *   administration. A new colleague is given reach deliberately or not at all.
 * - ADMIN is refused: it is the retired all-in-one role.
 * - Requires `users:manage`.
 */

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.AUTH_REQUIRED },
      { status: 401 },
    )
  }

  // The docstring said "admin-only" and the code checked only that you were
  // signed in. Combined with the hardcoded ADMIN role below, any authenticated
  // staff member — a Jobcoach, a Freiwilligenarbeit coordinator — could mint
  // themselves a Leitung account. /api/auth/invite has always checked this;
  // the two provisioning paths simply disagreed.
  if (!hasPermission(currentUser, 'users:manage')) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS },
      { status: 403 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.INVALID_REQUEST },
      { status: 400 },
    )
  }

  const {
    name,
    code: requestedCode,
    role: rawRole,
    scope: rawScope,
    isSystemAdmin: rawIsSystemAdmin,
  } = body as {
    name?: string
    code?: string
    role?: string
    scope?: string
    isSystemAdmin?: boolean
  }

  // Least privilege by default. This used to be hardcoded to 'ADMIN', which is
  // why all 23 staff accounts in production are Leitung: every account this
  // endpoint ever created got the widest role in the product, and the role
  // system therefore had no subjects to differentiate.
  // ADMIN is refused even though it is still a valid enum value: it is the
  // retired all-in-one role, kept only so existing rows and live JWTs resolve.
  // What it used to grant is now `scope` and `isSystemAdmin`, which can be
  // given to any role — so there is never a reason to mint a new one.
  const assignable = ASSIGNABLE_STAFF_ROLES as readonly string[]
  if (rawRole !== undefined && !assignable.includes(rawRole)) {
    return NextResponse.json({ success: false, error: 'Ungültige Rolle' }, { status: 400 })
  }
  const role: StaffRole = rawRole && isStaffRole(rawRole) ? rawRole : 'BETREUUNG'

  // The two facts that used to be bundled into ADMIN. Both default to the
  // narrow answer: a new colleague sees their own domain and administers
  // nothing until someone says otherwise.
  const scope: StaffScopeId = isStaffScope(String(rawScope ?? ''))
    ? (rawScope as StaffScopeId)
    : 'OWN_DOMAIN'
  const isSystemAdmin = rawIsSystemAdmin === true

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json(
      { success: false, error: 'Name ist erforderlich (mindestens 2 Zeichen)' },
      { status: 400 },
    )
  }

  // Generate or validate code
  let code = requestedCode?.trim().toUpperCase()
  if (code && !code.startsWith(BRAND.codePrefix)) {
    return NextResponse.json(
      { success: false, error: `Code muss mit ${BRAND.codePrefix} beginnen` },
      { status: 400 },
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
        { status: 500 },
      )
    }
  }

  // Check code uniqueness
  const existing = await prisma.user.findUnique({ where: { code } })
  if (existing) {
    return NextResponse.json(
      { success: false, error: 'Dieser Code ist bereits vergeben' },
      { status: 409 },
    )
  }

  try {
    const user = await prisma.user.create({
      data: {
        code,
        name: name.trim(),
        role,
        scope,
        isSystemAdmin,
        active: true,
      },
      select: { id: true, code: true, name: true, role: true, scope: true, isSystemAdmin: true },
    })

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    // Race between unique pre-check and create: report friendly conflict.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Dieser Code ist bereits vergeben' },
        { status: 409 },
      )
    }
    // Don't log the freshly-minted login code — it would leak working
    // credentials into log aggregation / error-tracking dashboards.
    logger.errorWithCause('Failed to create staff user', error)
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.SAVE_ERROR }, { status: 500 })
  }
}
