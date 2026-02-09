import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { portalPreferencesSchema, validateFormData, ValidationError } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get('resident_code')?.value

  if (!residentCode) {
    return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })
  }

  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
  })

  if (!resident) {
    return NextResponse.json({ success: false, error: 'Bewohner nicht gefunden' }, { status: 404 })
  }

  let data: ReturnType<typeof validateFormData<typeof portalPreferencesSchema>>
  try {
    const formData = await request.formData()
    data = validateFormData(portalPreferencesSchema, formData)
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Ungültige Eingabe' }, { status: 400 })
  }

  // Build roommate preferences text (stored in dedicated column, NOT notes)
  const roommatePrefsText = [
    data.preferredAgeRange ? `Altersgruppe: ${data.preferredAgeRange}` : null,
    data.culturalPreference ? `Kultur: ${data.culturalPreference}` : null,
    data.additionalPreferences || null,
  ].filter(Boolean).join('. ') || null

  try {
    await prisma.resident.update({
      where: { id: resident.id },
      data: {
        sleepSchedule: data.sleepSchedule,
        noiseTolerance: data.noiseTolerance,
        cleanlinessLevel: data.cleanlinessLevel,
        socialStyle: data.socialStyle,
        privacyNeed: data.privacyNeed,
        smokingStatus: data.smokingStatus,
        petTolerance: data.petTolerance,
        sharedBathroom: data.sharedBathroom,
        sharedKitchen: data.sharedKitchen,
        languages: data.languages,
        dietaryNeeds: data.dietaryNeeds,
        roommatePreferences: roommatePrefsText,
      },
    })

    await logAudit({
      action: 'UPDATE',
      entity: 'RESIDENT',
      entityId: resident.id,
      changes: {
        updatedBy: 'portal',
        fields: ['sleepSchedule', 'noiseTolerance', 'cleanlinessLevel', 'socialStyle', 'privacyNeed', 'smokingStatus', 'languages', 'dietaryNeeds', 'roommatePreferences'],
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update preferences:', error)
    return NextResponse.json({ success: false, error: 'Einstellungen konnten nicht gespeichert werden' }, { status: 500 })
  }
}
