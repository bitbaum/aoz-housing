'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Helper to extract resident data from FormData
function extractResidentData(formData: FormData) {
  return {
    code: formData.get('code') as string,
    ageRange: formData.get('ageRange') as any,
    gender: formData.get('gender') as any,
    familyStatus: formData.get('familyStatus') as any,
    sleepSchedule: formData.get('sleepSchedule') as any,
    noiseTolerance: parseInt(formData.get('noiseTolerance') as string) || 3,
    cleanlinessLevel: parseInt(formData.get('cleanlinessLevel') as string) || 3,
    socialStyle: formData.get('socialStyle') as any,
    languages: formData.getAll('languages') as string[],
    culturalRegion: (formData.get('culturalRegion') as string) || null,
    smokingStatus: formData.get('smokingStatus') as any,
    dietaryNeeds: formData.getAll('dietaryNeeds') as string[],
    mobilityNeeds: formData.get('mobilityNeeds') as any,
    medicalEquipment: formData.get('medicalEquipment') === 'true',
    petTolerance: formData.get('petTolerance') === 'true',
    sharedBathroom: formData.get('sharedBathroom') === 'true',
    sharedKitchen: formData.get('sharedKitchen') === 'true',
    privacyNeed: parseInt(formData.get('privacyNeed') as string) || 3,
    // Household fields
    choresContribution: parseInt(formData.get('choresContribution') as string) || 3,
    recyclingKnowledge: (formData.get('recyclingKnowledge') as any) || 'NONE',
    // Health/Support fields
    roomSharingStatus: (formData.get('roomSharingStatus') as any) || 'CAN_SHARE',
    hasNightDisturbances: formData.get('hasNightDisturbances') === 'true',
    needsQuietEnvironment: formData.get('needsQuietEnvironment') === 'true',
    hasSleepEquipment: formData.get('hasSleepEquipment') === 'true',
    supportLevel: (formData.get('supportLevel') as any) || 'STANDARD',
    notes: (formData.get('notes') as string) || null,
  }
}

export async function createResident(formData: FormData) {
  const data = extractResidentData(formData)

  const resident = await prisma.resident.create({
    data: {
      ...data,
      status: 'ACTIVE',
    },
  })

  revalidatePath('/residents')
  redirect(`/residents/${resident.id}`)
}

export async function updateResident(formData: FormData) {
  const id = formData.get('id') as string
  const data = extractResidentData(formData)

  await prisma.resident.update({
    where: { id },
    data,
  })

  revalidatePath('/residents')
  revalidatePath(`/residents/${id}`)
  redirect(`/residents/${id}`)
}
