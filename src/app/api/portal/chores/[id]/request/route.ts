import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getPortalAuth } from '@/lib/portal-auth'
import { portalTaskRequestSchema } from '@/lib/validation/schemas'
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

  let requestedResidentId: string | undefined
  let message: string | undefined
  try {
    const body = await request.json()
    const parsed = portalTaskRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: ERROR_MESSAGES.INVALID_INPUT }, { status: 400 })
    }
    requestedResidentId = parsed.data.requestedResidentId
    message = parsed.data.message
  } catch {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.INVALID_INPUT }, { status: 400 })
  }

  try {
    const task = await prisma.householdTask.findFirst({
      where: { id, housingUnitId: auth.placement.housingUnitId },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: ERROR_MESSAGES.TASK_NOT_FOUND }, { status: 404 })
    }

    if (task.isCompleted) {
      return NextResponse.json({ success: false, error: ERROR_MESSAGES.TASK_ALREADY_COMPLETED }, { status: 400 })
    }

    const isBroadcast = !requestedResidentId

    const taskRequest = await prisma.taskRequest.create({
      data: {
        taskId: id,
        requestedById: auth.resident.id,
        requestedResidentId: requestedResidentId || null,
        isBroadcast,
        message: message || null,
      },
    })

    // Update task status to REQUESTED
    await prisma.householdTask.update({
      where: { id },
      data: { currentStatus: 'REQUESTED' },
    })

    return NextResponse.json({ success: true, data: taskRequest })
  } catch (error) {
    logger.errorWithCause('Failed to create task request', error)
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.TASK_REQUEST_ERROR }, { status: 500 })
  }
}
