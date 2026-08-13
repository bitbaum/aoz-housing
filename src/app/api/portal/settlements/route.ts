import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPortalAuth, getActiveUnitMembers } from '@/lib/portal-auth'
import { CreateSettlementSchema } from '@/lib/validation/expenses'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

export async function POST(request: NextRequest) {
  const auth = await getPortalAuth()
  if (!auth) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }, { status: 401 })
  }

  const parsed = CreateSettlementSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.INVALID_INPUT }, { status: 400 })
  }
  const data = parsed.data

  // A settlement is always recorded by the person who paid it (fromId = self).
  if (data.toResidentId === auth.resident.id) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.SETTLEMENT_SELF }, { status: 400 })
  }

  try {
    const members = await getActiveUnitMembers(auth.placement.housingUnitId)
    if (!members.some((m) => m.id === data.toResidentId)) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.EXPENSE_MEMBER_INVALID },
        { status: 400 }
      )
    }

    const settlement = await prisma.settlement.create({
      data: {
        housingUnitId: auth.placement.housingUnitId,
        fromId: auth.resident.id,
        toId: data.toResidentId,
        amountRappen: data.amountRappen,
        note: data.note || null,
      },
    })

    await logAudit({
      action: 'CREATE',
      entity: 'SETTLEMENT',
      entityId: settlement.id,
      changes: { amountRappen: data.amountRappen, from: auth.resident.code },
    })

    return NextResponse.json({ success: true, data: settlement })
  } catch (error) {
    logger.errorWithCause('Failed to create settlement', error)
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.SETTLEMENT_CREATE_ERROR }, { status: 500 })
  }
}
