import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) {
    redirect('/portal')
  }

  const formData = await request.formData()

  const category = formData.get('category')?.toString() as 'MAINTENANCE' | 'INTERPERSONAL'
  const type = formData.get('type')?.toString()
  const description = formData.get('description')?.toString()
  const housingUnitId = formData.get('housingUnitId')?.toString()
  const residentId = formData.get('residentId')?.toString()
  const severity = formData.get('severity')?.toString() || 'MEDIUM'
  const location = formData.get('location')?.toString()
  const incidentDate = formData.get('incidentDate')?.toString()
  const involvedResident = formData.get('involvedResident')?.toString()
  const requestMediation = formData.get('requestMediation') === 'on'

  if (!type || !description || !housingUnitId || !residentId) {
    redirect('/portal/report?error=missing_fields')
  }

  // Build description with location for maintenance
  let fullDescription = description
  if (category === 'MAINTENANCE' && location) {
    const locationLabels: Record<string, string> = {
      room: 'Zimmer',
      bathroom: 'Badezimmer',
      kitchen: 'Küche',
      common: 'Gemeinschaftsraum',
      entrance: 'Eingang/Flur',
      other: 'Anderer Ort',
    }
    fullDescription = `[${locationLabels[location] || location}] ${description}`
  }

  // Add mediation request note for conflicts
  if (category === 'INTERPERSONAL' && requestMediation) {
    fullDescription += '\n\n[Bewohner wünscht Vermittlungsgespräch]'
  }

  try {
    // Create incident (resolvedAt = null means it's open)
    const incident = await prisma.incident.create({
      data: {
        housingUnitId,
        reportedById: residentId,
        subjectId: involvedResident && involvedResident !== 'external' ? involvedResident : null,
        category,
        type: type as any,
        severity: severity as any,
        description: fullDescription,
        date: incidentDate ? new Date(incidentDate) : new Date(),
        // No status field - open incidents have resolvedAt = null
      },
    })

    // Audit log
    await logAudit({
      action: 'CREATE',
      entity: 'INCIDENT',
      entityId: incident.id,
      changes: {
        category,
        type,
        severity,
        reportedBy: residentCode,
        requestedMediation: requestMediation,
      },
    })
  } catch (error) {
    console.error('Failed to create incident:', error)
    redirect('/portal/report?error=submission_failed')
  }

  // Redirect outside try/catch to avoid catching NEXT_REDIRECT error
  redirect('/portal?success=report_submitted')
}
