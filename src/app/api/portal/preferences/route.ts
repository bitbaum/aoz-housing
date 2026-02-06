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

  // Find resident
  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
  })

  if (!resident) {
    redirect('/portal')
  }

  const formData = await request.formData()

  // Parse form data
  const sleepSchedule = formData.get('sleepSchedule')?.toString()
  const noiseTolerance = parseInt(formData.get('noiseTolerance')?.toString() || '3')
  const cleanlinessLevel = parseInt(formData.get('cleanlinessLevel')?.toString() || '3')
  const socialStyle = formData.get('socialStyle')?.toString()
  const privacyNeed = parseInt(formData.get('privacyNeed')?.toString() || '3')
  const smokingStatus = formData.get('smokingStatus')?.toString()
  const petTolerance = formData.get('petTolerance') === 'on'
  const sharedBathroom = formData.get('sharedBathroom') === 'on'
  const sharedKitchen = formData.get('sharedKitchen') === 'on'

  // Languages (multiple checkboxes)
  const languages = formData.getAll('languages').map(l => l.toString())

  // Dietary needs (multiple checkboxes)
  const dietaryNeeds = formData.getAll('dietaryNeeds').map(d => d.toString())

  // Optional roommate preferences
  const preferredAgeRange = formData.get('preferredAgeRange')?.toString() || null
  const culturalPreference = formData.get('culturalPreference')?.toString() || null
  const additionalPreferences = formData.get('additionalPreferences')?.toString() || null

  try {
    // Update resident
    await prisma.resident.update({
      where: { id: resident.id },
      data: {
        sleepSchedule: sleepSchedule as any,
        noiseTolerance,
        cleanlinessLevel,
        socialStyle: socialStyle as any,
        privacyNeed,
        smokingStatus: smokingStatus as any,
        petTolerance,
        sharedBathroom,
        sharedKitchen,
        languages,
        dietaryNeeds,
        // Store additional preferences in notes for now
        notes: additionalPreferences
          ? `Präferenzen: ${preferredAgeRange || 'keine'} Altersgruppe, ${culturalPreference || 'keine'} kulturelle Präferenz. ${additionalPreferences}`
          : resident.notes,
      },
    })

    // Audit log
    await logAudit({
      action: 'UPDATE',
      entity: 'RESIDENT',
      entityId: resident.id,
      changes: {
        updatedBy: 'portal',
        fields: ['sleepSchedule', 'noiseTolerance', 'cleanlinessLevel', 'socialStyle', 'privacyNeed', 'smokingStatus', 'languages', 'dietaryNeeds'],
      },
    })

    redirect('/portal?success=preferences_saved')
  } catch (error) {
    console.error('Failed to update preferences:', error)
    redirect('/portal/preferences?error=save_failed')
  }
}
