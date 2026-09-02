import { NextRequest, NextResponse } from 'next/server'
import { db, expense as expenseTable, expenseShare } from '@/lib/db'
import { getPortalAuth, getActiveUnitMembers } from '@/lib/portal-auth'
import { CreateExpenseSchema } from '@/lib/validation/expenses'
import { splitEqually } from '@/lib/expenses'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

export async function POST(request: NextRequest) {
  const auth = await getPortalAuth()
  if (!auth) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 },
    )
  }

  const parsed = CreateExpenseSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.INVALID_INPUT },
      { status: 400 },
    )
  }
  const data = parsed.data

  try {
    const members = await getActiveUnitMembers(auth.placement.housingUnitId)
    const memberIds = new Set(members.map((m) => m.id))

    const paidById = data.paidById ?? auth.resident.id
    const participantIds = data.participantIds ?? members.map((m) => m.id)

    // Payer and every participant must currently live in this unit — an
    // expense involving outsiders is unexplainable to the people who share it.
    if (!memberIds.has(paidById) || !participantIds.every((id) => memberIds.has(id))) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.EXPENSE_MEMBER_INVALID },
        { status: 400 },
      )
    }

    const shares = splitEqually(data.amountRappen, participantIds)

    // Expense and its shares stand or fall together (Prisma's nested create was
    // one transaction); the returned shape mirrors the old `include: { shares }`.
    const expense = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(expenseTable)
        .values({
          housingUnitId: auth.placement.housingUnitId,
          paidById,
          createdById: auth.resident.id,
          description: data.description,
          category: data.category,
          amountRappen: data.amountRappen,
          date: data.date ?? new Date(),
        })
        .returning()
      const shareRows = await tx
        .insert(expenseShare)
        .values(shares.map((share) => ({ ...share, expenseId: created.id })))
        .returning()
      return { ...created, shares: shareRows }
    })

    await logAudit({
      action: 'CREATE',
      entity: 'EXPENSE',
      entityId: expense.id,
      changes: {
        amountRappen: data.amountRappen,
        category: data.category,
        createdBy: auth.resident.code,
      },
    })

    return NextResponse.json({ success: true, data: expense })
  } catch (error) {
    logger.errorWithCause('Failed to create expense', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.EXPENSE_CREATE_ERROR },
      { status: 500 },
    )
  }
}
