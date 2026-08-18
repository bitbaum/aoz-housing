import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { portalReportSchema, validateFormData, ValidationError } from '@/lib/validation/schemas'
import { logger } from '@/lib/logger'
import { PORTAL_LABELS, INCIDENT_TYPE_LABELS, getLabel } from '@/lib/constants'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import {
  notifyStaff,
  newIncidentNotification,
  newMaintenanceRequestNotification,
} from '@/lib/email'
import { getResidentCookie } from '@/lib/portal-auth'
import {
  isMaintenanceType,
  maintenanceCategoryFor,
  maintenancePriorityFor,
} from '@/lib/reports/routing'
import { DISPLAY_LIMITS } from '@/lib/config/thresholds'

export async function POST(request: NextRequest) {
  const residentCode = await getResidentCookie()

  if (!residentCode) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }, { status: 401 })
  }

  // Derive resident and placement from cookie — never trust client-submitted IDs
  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
    include: {
      placements: {
        where: { status: 'ACTIVE' },
        take: 1,
        include: { housingUnit: { select: { code: true } } },
      },
    },
  })

  if (!resident) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND }, { status: 404 })
  }

  const placement = resident.placements[0]
  if (!placement) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.NO_ACTIVE_PLACEMENT }, { status: 400 })
  }

  let data: ReturnType<typeof validateFormData<typeof portalReportSchema>>
  try {
    const formData = await request.formData()
    data = validateFormData(portalReportSchema, formData)
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.INVALID_INPUT }, { status: 400 })
  }

  // The maintenance board carries the location in its own column; the incident
  // table has no such field, so only that path folds it into the text.
  const locationLabel = data.location
    ? PORTAL_LABELS.report.locations.find(l => l.value === data.location)?.label || data.location
    : null

  let fullDescription = data.description
  if (data.category === 'MAINTENANCE' && locationLabel) {
    fullDescription = `[${locationLabel}] ${data.description}`
  }

  // Add mediation request note for conflicts
  if (data.category === 'INTERPERSONAL' && data.requestMediation) {
    fullDescription += '\n\n[Bewohner wünscht Vermittlungsgespräch]'
  }

  // Validate `involvedResident` belongs to the same housing unit — prevents
  // residents from naming anyone in the system as an incident subject.
  let validatedSubjectId: string | null = null
  if (data.involvedResident && data.involvedResident !== 'external' && data.involvedResident !== 'anonymous') {
    const candidate = await prisma.placement.findFirst({
      where: {
        residentId: data.involvedResident,
        housingUnitId: placement.housingUnitId,
        status: 'ACTIVE',
      },
      select: { residentId: true },
    })
    if (!candidate) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INVALID_INPUT },
        { status: 400 }
      )
    }
    validatedSubjectId = candidate.residentId
  }

  try {
    // A broken tap goes to the maintenance board, not onto the conflict ladder.
    // @see lib/reports/routing.ts for why the two must not share a table.
    if (data.category === 'MAINTENANCE' && isMaintenanceType(data.type)) {
      const request = await prisma.maintenanceRequest.create({
        data: {
          housingUnitId: placement.housingUnitId,
          reportedById: resident.id,
          category: maintenanceCategoryFor(data.type),
          priority: maintenancePriorityFor(data.severity),
          title: getLabel(INCIDENT_TYPE_LABELS, data.type),
          description: data.description,
          location: locationLabel,
        },
      })

      await logAudit({
        action: 'CREATE',
        entity: 'MAINTENANCE',
        entityId: request.id,
        changes: {
          category: request.category,
          priority: request.priority,
          reportedBy: residentCode,
          description: data.description.slice(0, DISPLAY_LIMITS.auditChangePreview),
        },
      })

      const mail = newMaintenanceRequestNotification({
        residentCode,
        housingUnitCode: placement.housingUnit?.code || '-',
        category: request.category,
        priority: request.priority,
        title: request.title,
        description: data.description.slice(0, DISPLAY_LIMITS.reportEmailDescription),
        location: locationLabel,
      })
      notifyStaff(mail.subject, mail.html).catch((err) =>
        logger.errorWithCause('Failed to send maintenance notification', err)
      )

      return NextResponse.json({ success: true })
    }

    const incident = await prisma.incident.create({
      data: {
        housingUnitId: placement.housingUnitId,
        reportedById: resident.id,
        subjectId: validatedSubjectId,
        category: data.category,
        type: data.type,
        severity: data.severity,
        description: fullDescription,
        date: data.incidentDate ? new Date(data.incidentDate) : new Date(),
      },
    })

    await logAudit({
      action: 'CREATE',
      entity: 'INCIDENT',
      entityId: incident.id,
      changes: {
        category: data.category,
        type: data.type,
        severity: data.severity,
        reportedBy: residentCode,
        subjectId: validatedSubjectId,
        description: fullDescription.slice(0, DISPLAY_LIMITS.auditChangePreview),
        requestedMediation: data.requestMediation,
      },
    })

    // Fire-and-forget staff notification
    const housingUnitCode = placement.housingUnit?.code || '-'
    const email = newIncidentNotification({
      residentCode,
      housingUnitCode,
      category: data.category,
      type: data.type,
      severity: data.severity,
      description: fullDescription.slice(0, DISPLAY_LIMITS.reportEmailDescription),
      subjectCode: data.involvedResident && data.involvedResident !== 'external' && data.involvedResident !== 'anonymous'
        ? data.involvedResident : undefined,
      requestedMediation: data.requestMediation ?? false,
    })
    notifyStaff(email.subject, email.html)
      .catch((err) => logger.errorWithCause('Failed to send incident notification', err))

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.errorWithCause('Failed to create portal incident', error)
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.REPORT_SAVE_ERROR }, { status: 500 })
  }
}
