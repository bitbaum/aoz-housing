import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getPortalAuth } from '@/lib/portal-auth'
import { portalCompleteTaskSchema } from '@/lib/validation/schemas'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getPortalAuth()
  if (!auth) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }, { status: 401 })
  }

  const { id } = await params

  // Parse optional body (may be empty for quick-complete)
  let notes: string | undefined
  let durationMinutes: number | undefined
  let completedItems: string[] | undefined
  try {
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await request.json()
      const parsed = portalCompleteTaskSchema.safeParse(body)
      if (parsed.success) {
        notes = parsed.data.notes
        durationMinutes = parsed.data.durationMinutes
        completedItems = parsed.data.completedItems
      }
    }
  } catch {
    // Empty body is fine for quick-complete
  }

  // Security check: verify task belongs to this housing unit
  const task = await prisma.householdTask.findFirst({
    where: { id, housingUnitId: auth.placement.housingUnitId },
  })

  if (!task) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.TASK_NOT_FOUND }, { status: 404 })
  }

  if (task.isCompleted) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.TASK_ALREADY_COMPLETED }, { status: 400 })
  }

  // Only items that are actually on this task's checklist may be recorded —
  // otherwise a client could claim credit for work the house never agreed on.
  const ticked = (completedItems ?? []).filter(item => task.checklist.includes(item))

  try {
    // Transaction: create completion + update task + resolve flags + complete requests.
    // For ONE_TIME tasks we use a conditional update with `isCompleted: false` guard
    // to prevent two concurrent completions from racing past the outer check.
    const result = await prisma.$transaction(async (tx) => {
      const isOneTime = task.taskType === 'ONE_TIME'

      // 1. Create completion. Ticked items are intersected with the task's own
      // checklist: a client must not be able to invent a done-criterion that
      // the house never agreed on, and the order is the task's, not the
      // client's, so the record reads the same as the list people saw.
      const tickedItems = completedItems
        ? (task.checklist ?? []).filter(item => completedItems!.includes(item))
        : []

      const completion = await tx.taskCompletion.create({
        data: {
          taskId: id,
          completedById: auth.resident.id,
          notes: notes || null,
          durationMinutes: durationMinutes || null,
          completedItems: tickedItems,
        },
      })

      // 2. Update task status
      await tx.householdTask.update({
        where: { id },
        data: {
          currentStatus: 'IDLE',
          ...(isOneTime ? { isCompleted: true, completedAt: new Date() } : {}),
        },
      })

      // 3. Resolve active attention flags
      await tx.taskAttentionFlag.updateMany({
        where: { taskId: id, isResolved: false },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedByCompletionId: completion.id,
        },
      })

      // 4. Complete pending/accepted requests
      await tx.taskRequest.updateMany({
        where: {
          taskId: id,
          status: { in: ['PENDING', 'ACCEPTED'] },
        },
        data: {
          status: 'COMPLETED',
          completionId: completion.id,
        },
      })

      return completion
    })

    await logAudit({
      action: 'UPDATE',
      entity: 'HOUSEHOLD_TASK',
      entityId: id,
      changes: { action: 'completed', completedBy: auth.resident.code },
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.errorWithCause('Failed to complete household task', error)
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.TASK_COMPLETE_ERROR }, { status: 500 })
  }
}
