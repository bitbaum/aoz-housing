import { NextRequest, NextResponse } from 'next/server'
import { loginByCode, setSessionCookie } from '@/lib/auth'
import { checkRateLimit, recordLoginAttempt, getClientIp } from '@/lib/auth/rate-limit'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { setResidentCookie } from '@/lib/portal-auth'
import { isDemoEnabled, resolveDemoResidentCode } from '@/lib/demo/config'
import { demoStaffDoors } from '@/lib/demo/roles'
import { isStaffRole } from '@/lib/auth/role-policy'
import { ROLE_LABELS } from '@/lib/constants/labels'
import { BRAND } from '@/lib/config/brand'

/** A door is identified by the staff role it opens, or by 'resident'. */
type DemoDoorId = string

interface DemoDoor {
  id: DemoDoorId
  label: string
}

function residentDoorLabel(): string {
  return BRAND.clientTerm
}

/**
 * Which demo doors this deployment can actually open.
 *
 * The accounts are checked in the DATABASE, not merely in config. The codes
 * are derived now rather than configured, so config presence proves nothing —
 * it would happily offer five buttons on an instance where the seed never ran,
 * and every one of them would answer "invalid code". The rule the old version
 * stated is the right one and this keeps it: a button appears only when
 * pressing it can succeed.
 */
async function availableDoors(): Promise<DemoDoor[]> {
  if (!isDemoEnabled()) return []

  const codes = demoStaffDoors().map((door) => door.code)
  const present = await prisma.user.findMany({
    where: { code: { in: codes }, active: true },
    select: { code: true },
  })
  const live = new Set(present.map((user) => user.code))

  const doors: DemoDoor[] = demoStaffDoors()
    .filter((door) => live.has(door.code))
    .map((door) => ({
      id: door.role,
      label: ROLE_LABELS[door.role] ?? door.role,
    }))

  const residentCode = resolveDemoResidentCode()
  if (residentCode) {
    const resident = await prisma.resident.findUnique({
      where: { code: residentCode },
      select: { id: true },
    })
    if (resident) doors.push({ id: 'resident', label: residentDoorLabel() })
  }

  return doors
}

/** The code behind a door id, or null when that door is not on offer. */
async function codeForDoor(id: DemoDoorId): Promise<string | null> {
  const doors = await availableDoors()
  if (!doors.some((door) => door.id === id)) return null

  if (id === 'resident') return resolveDemoResidentCode()
  if (!isStaffRole(id)) return null

  return demoStaffDoors().find((door) => door.role === id)?.code ?? null
}

export async function GET() {
  try {
    const doors = await availableDoors()

    return NextResponse.json({
      success: true,
      data: {
        doors,
        // Kept so an older cached login bundle still renders its two buttons
        // instead of none while the new one rolls out.
        staff: doors.some((door) => door.id !== 'resident'),
        resident: doors.some((door) => door.id === 'resident'),
      },
    })
  } catch (error) {
    logger.errorWithCause('Demo door listing failed', error)
    return NextResponse.json({ success: true, data: { doors: [], staff: false, resident: false } })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const requested = typeof body?.role === 'string' ? body.role : ''

    // 'staff' is the old identifier for what is now the Leitung door. Old
    // clients and bookmarks still send it, and answering them "invalid" would
    // break a door that worked yesterday for no reason the user could act on.
    const doorId = requested === 'staff' ? 'ADMIN' : requested

    const code = doorId ? await codeForDoor(doorId) : null
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Demo-Zugang ist nicht konfiguriert' },
        { status: 404 },
      )
    }

    const clientIp = getClientIp(request)

    // Throttle: the demo endpoint issues real sessions; rate-limit per IP.
    const rateCheck = checkRateLimit(clientIp)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Zu viele Versuche. Bitte warten Sie ${rateCheck.retryAfter} Sekunden.`,
        },
        { status: 429 },
      )
    }

    const result = await loginByCode(code.trim().toUpperCase(), clientIp)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 })
    }

    // Count the SUCCESS. loginByCode already records failed codes, but the
    // thing this endpoint throttles is session issuance, and a demo code is
    // valid by definition — so without this one IP could mint unlimited
    // sessions from a known-good code while the counter stayed at zero.
    recordLoginAttempt(clientIp)

    if (result.type === 'staff') {
      await setSessionCookie(result.user)
      return NextResponse.json({ success: true, type: 'staff' })
    }

    await setResidentCookie(result.code)

    return NextResponse.json({ success: true, type: 'resident' })
  } catch (error) {
    logger.errorWithCause('Demo login failed', error)
    return NextResponse.json(
      { success: false, error: 'Demo-Zugang fehlgeschlagen' },
      { status: 500 },
    )
  }
}
