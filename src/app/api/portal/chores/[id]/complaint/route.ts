import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getPortalAuth } from '@/lib/portal-auth'
import { portalTaskComplaintSchema, ValidationError } from '@/lib/validation/schemas'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { CHORE_COMPLAINT_INCIDENT_MAP } from '@/lib/config/household-tasks'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getPortalAuth()
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })
  }

  const { id } = await params

  let description: string
  try {
    const body = await request.json()
    const parsed = portalTaskComplaintSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors.description?.[0] || 'Ungültige Eingabe' }, { status: 400 })
    }
    description = parsed.data.description
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

    // Map chore category to incident type
    const incidentType = CHORE_COMPLAINT_INCIDENT_MAP[task.category] || 'PERSONAL_CONFLICT'

    // Create an Incident (escalation to staff)
    const incident = await prisma.incident.create({
      data: {
        housingUnitId: auth.placement.housingUnitId,
        placementId: auth.placement.id,
        reportedById: auth.resident.id,
        category: 'INTERPERSONAL',
        type: incidentType as any,
        severity: 'MEDIUM',
        description: `[Haushaltsaufgabe: ${task.title}]\n\n${description}`,
        date: new Date(),
      },
    })

    await logAudit({
      action: 'CREATE',
      entity: 'INCIDENT',
      entityId: incident.id,
      changes: {
        source: 'household_task_complaint',
        taskId: id,
        taskTitle: task.title,
        reportedBy: auth.resident.code,
      },
    })

    return NextResponse.json({ success: true, data: { incidentId: incident.id } })
  } catch (error) {
    logger.errorWithCause('Failed to create task complaint incident', error)
    return NextResponse.json({ success: false, error: 'Problem konnte nicht gemeldet werden' }, { status: 500 })
  }
}
