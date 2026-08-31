import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPortalAuth } from '@/lib/portal-auth'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const auth = await getPortalAuth()
  if (!auth) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 },
    )
  }

  try {
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        housingUnitId: true,
        paidById: true,
        createdById: true,
        amountRappen: true,
      },
    })

    // Unit scoping first: an expense outside the caller's unit is a 404, not
    // a 403 — its existence is none of their business.
    if (!expense || expense.housingUnitId !== auth.placement.housingUnitId) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.EXPENSE_NOT_FOUND },
        { status: 404 },
      )
    }

    if (expense.paidById !== auth.resident.id && expense.createdById !== auth.resident.id) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.EXPENSE_DELETE_FORBIDDEN },
        { status: 403 },
      )
    }

    await prisma.expense.delete({ where: { id: expense.id } })

    await logAudit({
      action: 'DELETE',
      entity: 'EXPENSE',
      entityId: expense.id,
      changes: { amountRappen: expense.amountRappen, deletedBy: auth.resident.code },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.errorWithCause('Failed to delete expense', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.EXPENSE_DELETE_ERROR },
      { status: 500 },
    )
  }
}
