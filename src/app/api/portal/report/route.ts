import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { portalReportSchema, validateFormData, ValidationError } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })
  }

  // Derive resident and placement from cookie — never trust client-submitted IDs
  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
    include: {
      placements: {
        where: { status: 'ACTIVE' },
        take: 1,
      },
    },
  })

  if (!resident) {
    return NextResponse.json({ success: false, error: 'Bewohner nicht gefunden' }, { status: 404 })
  }

  const placement = resident.placements[0]
  if (!placement) {
    return NextResponse.json({ success: false, error: 'Keine aktive Platzierung' }, { status: 400 })
  }

  let data: ReturnType<typeof validateFormData<typeof portalReportSchema>>
  try {
    const formData = await request.formData()
    data = validateFormData(portalReportSchema, formData)
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Ungültige Eingabe' }, { status: 400 })
  }

  // Build description with location for maintenance
  let fullDescription = data.description
  if (data.category === 'MAINTENANCE' && data.location) {
    const locationLabels: Record<string, string> = {
      room: 'Zimmer',
      bathroom: 'Badezimmer',
      kitchen: 'Küche',
      common: 'Gemeinschaftsraum',
      entrance: 'Eingang/Flur',
      other: 'Anderer Ort',
    }
    fullDescription = `[${locationLabels[data.location] || data.location}] ${data.description}`
  }

  // Add mediation request note for conflicts
  if (data.category === 'INTERPERSONAL' && data.requestMediation) {
    fullDescription += '\n\n[Bewohner wünscht Vermittlungsgespräch]'
  }

  try {
    const incident = await prisma.incident.create({
      data: {
        housingUnitId: placement.housingUnitId,
        reportedById: resident.id,
        subjectId: data.involvedResident && data.involvedResident !== 'external' ? data.involvedResident : null,
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
        requestedMediation: data.requestMediation,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to create incident:', error)
    return NextResponse.json({ success: false, error: 'Meldung konnte nicht gespeichert werden' }, { status: 500 })
  }
}
