import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getPortalAuth } from '@/lib/portal-auth'
import { portalTaskRequestSchema, ValidationError } from '@/lib/validation/schemas'
import { logger } from '@/lib/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getPortalAuth()
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })
  }

  const { id } = await params

  let requestedResidentId: string | undefined
  let message: string | undefined
  try {
    const body = await request.json()
    const parsed = portalTaskRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Ungültige Eingabe' }, { status: 400 })
    }
    requestedResidentId = parsed.data.requestedResidentId
    message = parsed.data.message
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültige Eingabe' }, { status: 400 })
  }

  try {
    const task = await prisma.householdTask.findFirst({
      where: { id, housingUnitId: auth.placement.housingUnitId },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: 'Aufgabe nicht gefunden' }, { status: 404 })
    }

    if (task.isCompleted) {
      return NextResponse.json({ success: false, error: 'Aufgabe ist bereits abgeschlossen' }, { status: 400 })
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
    return NextResponse.json({ success: false, error: 'Anfrage konnte nicht gesendet werden' }, { status: 500 })
  }
}
