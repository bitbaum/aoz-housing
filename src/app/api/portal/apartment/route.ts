import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPortalAuth } from '@/lib/portal-auth'
import { UpdateApartmentSchema } from '@/lib/validation/expenses'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

export async function PATCH(request: NextRequest) {
  const auth = await getPortalAuth()
  if (!auth) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 },
    )
  }

  const parsed = UpdateApartmentSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.INVALID_INPUT },
      { status: 400 },
    )
  }

  try {
    // Any current resident may (re)name their own home; the audit trail
    // records who did. An empty string clears the nickname.
    const unit = await prisma.housingUnit.update({
      where: { id: auth.placement.housingUnitId },
      data: { nickname: parsed.data.nickname || null },
      select: { id: true, nickname: true },
    })

    await logAudit({
      action: 'UPDATE',
      entity: 'HOUSING_UNIT',
      entityId: unit.id,
      changes: { nickname: unit.nickname, by: auth.resident.code },
    })

    return NextResponse.json({ success: true, data: unit })
  } catch (error) {
    logger.errorWithCause('Failed to update apartment nickname', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.APARTMENT_UPDATE_ERROR },
      { status: 500 },
    )
  }
}
