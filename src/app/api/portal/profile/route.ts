import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPortalResident } from '@/lib/portal-auth'
import { UpdateProfileSchema } from '@/lib/validation/expenses'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

export async function PATCH(request: NextRequest) {
  // Deliberately placement-independent: your name and bio are yours even
  // between placements.
  const resident = await getPortalResident()
  if (!resident) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }, { status: 401 })
  }

  const parsed = UpdateProfileSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.INVALID_INPUT }, { status: 400 })
  }
  const data = parsed.data

  try {
    const updated = await prisma.resident.update({
      where: { id: resident.id },
      data: {
        // Empty string clears the field back to "code only".
        ...(data.displayName !== undefined && { displayName: data.displayName || null }),
        ...(data.bio !== undefined && { bio: data.bio || null }),
      },
      select: { id: true, code: true, displayName: true, bio: true },
    })

    await logAudit({
      action: 'UPDATE',
      entity: 'RESIDENT_PROFILE',
      entityId: resident.id,
      changes: { fields: Object.keys(data), by: resident.code },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    logger.errorWithCause('Failed to update resident profile', error)
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.PROFILE_UPDATE_ERROR }, { status: 500 })
  }
}
