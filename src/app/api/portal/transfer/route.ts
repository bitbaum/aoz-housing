import {
  db,
  resident as residentTable,
  placement as placementTable,
  transferRequest as transferRequestTable,
  housingUnit,
} from '@/lib/db'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { CreateTransferRequestSchema } from '@/lib/validation/transfer'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { getResidentCookie } from '@/lib/portal-auth'

export async function POST(request: NextRequest) {
  const residentCode = await getResidentCookie()

  if (!residentCode) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 },
    )
  }

  const body = await request.json()
  const parsed = CreateTransferRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.INVALID_INPUT },
      { status: 400 },
    )
  }

  const { reason, targetUnitId } = parsed.data

  // Find resident and active placement
  const resident = await db.query.resident.findFirst({
    where: eq(residentTable.code, residentCode),
    with: {
      placements: { where: eq(placementTable.status, 'ACTIVE'), limit: 1 },
      transferRequests: { where: eq(transferRequestTable.status, 'PENDING'), limit: 1 },
    },
  })

  if (!resident) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND },
      { status: 404 },
    )
  }

  const placement = resident.placements[0]
  if (!placement) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_NO_PLACEMENT },
      { status: 400 },
    )
  }

  // Prevent duplicate pending requests
  if (resident.transferRequests.length > 0) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_ALREADY_PENDING },
      { status: 409 },
    )
  }

  try {
    const [transferRequest] = await db
      .insert(transferRequestTable)
      .values({
        residentId: resident.id,
        currentPlacementId: placement.id,
        targetUnitId: targetUnitId || null,
        reason,
      })
      .returning()

    await logAudit({
      action: 'CREATE',
      entity: 'TRANSFER_REQUEST',
      entityId: transferRequest.id,
      changes: { residentCode: resident.code, reason },
    })

    // Fire-and-forget email notification to staff
    try {
      const { notifyStaff, newTransferRequestNotification } = await import('@/lib/email')

      let currentUnitCode = 'Unbekannt'
      if (placement.housingUnitId) {
        const unit = await db.query.housingUnit.findFirst({
          where: eq(housingUnit.id, placement.housingUnitId),
          columns: { code: true },
        })
        if (unit) currentUnitCode = unit.code
      }

      let targetUnitCode: string | undefined
      if (targetUnitId) {
        const target = await db.query.housingUnit.findFirst({
          where: eq(housingUnit.id, targetUnitId),
          columns: { code: true },
        })
        if (target) targetUnitCode = target.code
      }

      const template = newTransferRequestNotification({
        residentCode: resident.code,
        currentUnitCode,
        reason,
        targetUnitCode,
      })
      notifyStaff(template.subject, template.html)
    } catch {
      // Email failure should not block the response
    }

    return NextResponse.json({ success: true, id: transferRequest.id })
  } catch (error) {
    logger.errorWithCause('Failed to create transfer request', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_CREATE_ERROR },
      { status: 500 },
    )
  }
}
