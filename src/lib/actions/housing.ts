'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Helper to extract housing data from FormData
function extractHousingData(formData: FormData) {
  return {
    code: formData.get('code') as string,
    address: formData.get('address') as string,
    totalBeds: parseInt(formData.get('totalBeds') as string),
    totalRooms: parseInt(formData.get('totalRooms') as string),
    sharedRooms: parseInt(formData.get('sharedRooms') as string) || 0,
    privateRooms: parseInt(formData.get('privateRooms') as string) || 0,
    sharedBathrooms: parseInt(formData.get('sharedBathrooms') as string) || 0,
    privateBathrooms: parseInt(formData.get('privateBathrooms') as string) || 0,
    sharedKitchen: formData.get('sharedKitchen') === 'true',
    privateKitchen: formData.get('privateKitchen') === 'true',
    groundFloor: formData.get('groundFloor') === 'true',
    wheelchairAccess: formData.get('wheelchairAccess') === 'true',
    elevator: formData.get('elevator') === 'true',
    smokingAllowed: formData.get('smokingAllowed') === 'true',
    petsAllowed: formData.get('petsAllowed') === 'true',
    quietHours: (formData.get('quietHours') as string) || null,
    nearPublicTransport: formData.get('nearPublicTransport') === 'true',
    nearHealthServices: formData.get('nearHealthServices') === 'true',
    nearSchools: formData.get('nearSchools') === 'true',
    notes: (formData.get('notes') as string) || null,
  }
}

export async function createHousingUnit(formData: FormData) {
  const data = extractHousingData(formData)

  const unit = await prisma.housingUnit.create({
    data: {
      ...data,
      status: 'AVAILABLE',
    },
  })

  revalidatePath('/housing')
  redirect(`/housing/${unit.id}`)
}

export async function updateHousingUnit(formData: FormData) {
  const id = formData.get('id') as string
  const data = extractHousingData(formData)

  await prisma.housingUnit.update({
    where: { id },
    data,
  })

  revalidatePath('/housing')
  revalidatePath(`/housing/${id}`)
  redirect(`/housing/${id}`)
}
