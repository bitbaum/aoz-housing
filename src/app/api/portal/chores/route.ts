import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getPortalAuth } from '@/lib/portal-auth'
import { portalCreateTaskSchema, ValidationError, validateFormData } from '@/lib/validation/schemas'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { loadChoreBalances } from '@/lib/chores/summary'

export async function GET() {
  const auth = await getPortalAuth()
  if (!auth) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 },
    )
  }

  try {
    const tasks = await prisma.householdTask.findMany({
      where: { housingUnitId: auth.placement.housingUnitId },
      include: {
        completions: {
          orderBy: { completedAt: 'desc' },
          take: 1,
          include: { completedBy: { select: { id: true, code: true } } },
        },
        attentionFlags: {
          where: { isResolved: false },
        },
        requests: {
          where: { status: { in: ['PENDING', 'ACCEPTED'] } },
        },
        createdByResident: { select: { id: true, code: true } },
      },
      orderBy: [{ currentStatus: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    })

    // Same loader the page uses — a balance that disagreed between the two
    // would be worse than showing none at all.
    const balances = await loadChoreBalances(auth.placement.housingUnitId)

    return NextResponse.json({ success: true, data: { tasks, balances } })
  } catch (error) {
    logger.errorWithCause('Failed to list household tasks', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.TASKS_LOAD_ERROR },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await getPortalAuth()
  if (!auth) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 },
    )
  }

  let data: ReturnType<typeof validateFormData<typeof portalCreateTaskSchema>>
  try {
    const formData = await request.formData()
    data = validateFormData(portalCreateTaskSchema, formData)
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.INVALID_INPUT },
      { status: 400 },
    )
  }

  try {
    const task = await prisma.householdTask.create({
      data: {
        housingUnitId: auth.placement.housingUnitId,
        createdByResidentId: auth.resident.id,
        title: data.title,
        description: data.description || null,
        instructions: data.instructions || null,
        taskType: data.taskType,
        category: data.category,
        priority: data.priority,
        scheduleHuman: data.scheduleHuman || null,
        estimatedMinutes: data.estimatedMinutes || null,
        checklist: data.checklist ?? [],
      },
    })

    await logAudit({
      action: 'CREATE',
      entity: 'HOUSEHOLD_TASK',
      entityId: task.id,
      changes: { title: data.title, category: data.category, createdBy: auth.resident.code },
    })

    return NextResponse.json({ success: true, data: task })
  } catch (error) {
    logger.errorWithCause('Failed to create household task', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.TASK_CREATE_ERROR },
      { status: 500 },
    )
  }
}
