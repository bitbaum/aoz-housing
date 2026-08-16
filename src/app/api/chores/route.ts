import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireStaffAuth } from '@/lib/auth'
import { portalCreateTaskSchema, ValidationError, validateFormData } from '@/lib/validation/schemas'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

/**
 * Staff creating a household task for a unit.
 *
 * The gap this fills: chores could only ever be created by a resident, because
 * the only route that made one read its unit from the resident's own placement.
 * The staff `/chores` page was four counters and a table. So a caseworker who
 * agreed a cleaning rota in a house visit had no way to write it down, and the
 * agreement lived in their notes.
 *
 * `createdByStaff` already existed on the model — "Creator (dual: resident OR
 * staff)" — so the schema had always expected this. Only the route was missing.
 *
 * WHY THE AUTHOR IS RECORDED AS STAFF rather than left blank: the fairness
 * balance credits whoever COMPLETES a task, so authorship changes no numbers.
 * What it changes is whether residents can tell where a task came from. A chore
 * that appears in a shared flat with no author reads as someone quietly adding
 * work; one that says the support team set it up is a different message, and
 * the honest one.
 */

const staffCreateTaskSchema = z.object({ housingUnitId: z.string().min(1) })

export async function POST(request: NextRequest) {
  let staff
  try {
    staff = await requireStaffAuth()
  } catch {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }, { status: 401 })
  }

  let unitId: string
  let data: ReturnType<typeof validateFormData<typeof portalCreateTaskSchema>>
  try {
    const formData = await request.formData()

    const unit = staffCreateTaskSchema.safeParse({ housingUnitId: formData.get('housingUnitId') })
    if (!unit.success) {
      return NextResponse.json({ success: false, error: ERROR_MESSAGES.INVALID_INPUT }, { status: 400 })
    }
    unitId = unit.data.housingUnitId

    // The SAME schema the portal uses. A second definition of what a task is
    // would drift, and the drift would show up as a task residents can see but
    // not complete.
    data = validateFormData(portalCreateTaskSchema, formData)
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.INVALID_INPUT }, { status: 400 })
  }

  try {
    // Checked rather than trusted: an id from a form is an id a caller chose,
    // and creating a task against a unit that does not exist would fail with a
    // foreign-key error rather than a message anybody can act on.
    const unit = await prisma.housingUnit.findUnique({
      where: { id: unitId },
      select: { id: true, code: true },
    })
    if (!unit) {
      return NextResponse.json({ success: false, error: ERROR_MESSAGES.UNIT_NOT_FOUND }, { status: 404 })
    }

    const task = await prisma.householdTask.create({
      data: {
        housingUnitId: unit.id,
        createdByStaff: staff.name,
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
      changes: { title: data.title, unit: unit.code, createdBy: staff.name },
    })

    return NextResponse.json({ success: true, data: task })
  } catch (error) {
    logger.errorWithCause('Failed to create household task as staff', error)
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.TASK_CREATE_ERROR }, { status: 500 })
  }
}
