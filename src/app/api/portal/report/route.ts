import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { portalReportSchema, validateFormData, ValidationError } from '@/lib/validation/schemas'
import { logger } from '@/lib/logger'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { notifyStaff, newIncidentNotification } from '@/lib/email'
import { getResidentCookie } from '@/lib/portal-auth'

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

  // Build description with location for maintenance
  let fullDescription = data.description
  if (data.category === 'MAINTENANCE' && data.location) {
    const locationLabel = PORTAL_LABELS.report.locations.find(l => l.value === data.location)?.label || data.location
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
        description: fullDescription.slice(0, 200),
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
      description: fullDescription.slice(0, 500),
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
