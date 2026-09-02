import { db, householdTask, incident } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getPortalAuth } from '@/lib/portal-auth'
import { portalTaskComplaintSchema } from '@/lib/validation/schemas'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { CHORE_COMPLAINT_INCIDENT_MAP } from '@/lib/config/household-tasks'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getPortalAuth()
  if (!auth) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 },
    )
  }

  const { id } = await params

  let description: string
  try {
    const body = await request.json()
    const parsed = portalTaskComplaintSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            parsed.error.flatten().fieldErrors.description?.[0] || ERROR_MESSAGES.INVALID_INPUT,
        },
        { status: 400 },
      )
    }
    description = parsed.data.description
  } catch {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.INVALID_INPUT },
      { status: 400 },
    )
  }

  try {
    const task = await db.query.householdTask.findFirst({
      where: and(
        eq(householdTask.id, id),
        eq(householdTask.housingUnitId, auth.placement.housingUnitId),
      ),
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.TASK_NOT_FOUND },
        { status: 404 },
      )
    }

    // Map chore category to incident type. The map is typed against the db
    // enums so the fallback is only used for unknown categories.
    const incidentType = CHORE_COMPLAINT_INCIDENT_MAP[task.category] ?? 'PERSONAL_CONFLICT'

    // Create an Incident (escalation to staff)
    const [createdIncident] = await db
      .insert(incident)
      .values({
        housingUnitId: auth.placement.housingUnitId,
        placementId: auth.placement.id,
        reportedById: auth.resident.id,
        category: 'INTERPERSONAL',
        type: incidentType,
        severity: 'MEDIUM',
        description: `[Haushaltsaufgabe: ${task.title}]\n\n${description}`,
        date: new Date(),
      })
      .returning()

    await logAudit({
      action: 'CREATE',
      entity: 'INCIDENT',
      entityId: createdIncident.id,
      changes: {
        source: 'household_task_complaint',
        taskId: id,
        taskTitle: task.title,
        reportedBy: auth.resident.code,
      },
    })

    return NextResponse.json({ success: true, data: { incidentId: createdIncident.id } })
  } catch (error) {
    logger.errorWithCause('Failed to create task complaint incident', error)
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.TASK_COMPLAINT_ERROR },
      { status: 500 },
    )
  }
}
