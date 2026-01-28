'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  validateFormData,
  SpotInputSchema,
  SpotUpdateSchema,
  MultipleSpotInputSchema,
} from '@/lib/validation'
import { DEFAULT_STATUSES } from '@/lib/config/thresholds'

// Simple schema for delete operation
const DeleteSpotSchema = z.object({
  id: z.string().cuid(),
  housingUnitId: z.string().cuid(),
})

export async function createSpot(formData: FormData): Promise<void> {
  const data = validateFormData(SpotInputSchema, formData)

  await prisma.placementSpot.create({
    data: {
      housingUnitId: data.housingUnitId,
      code: data.code,
      label: data.label,
      type: data.type,
      parentSpotId: data.parentSpotId,
      squareMeters: data.squareMeters,
      floor: data.floor,
      requiresMedicalDocs: data.requiresMedicalDocs,
      status: data.status,
      notes: data.notes,
    },
  })

  revalidatePath(`/housing/${data.housingUnitId}`)
  revalidatePath(`/housing/${data.housingUnitId}/spots`)
}

export async function updateSpot(formData: FormData): Promise<void> {
  const data = validateFormData(SpotUpdateSchema, formData)
  const { id, housingUnitId, ...updateData } = data

  await prisma.placementSpot.update({
    where: { id },
    data: {
      ...updateData,
      parentSpotId: updateData.parentSpotId || null,
    },
  })

  revalidatePath(`/housing/${housingUnitId}`)
  revalidatePath(`/housing/${housingUnitId}/spots`)
}

export async function deleteSpot(formData: FormData): Promise<void> {
  const { id, housingUnitId } = validateFormData(DeleteSpotSchema, formData)

  // Check if spot has active placements
  const activePlacements = await prisma.placement.count({
    where: { spotId: id, status: 'ACTIVE' },
  })

  if (activePlacements > 0) {
    throw new Error('Platz kann nicht gelöscht werden, da aktive Platzierungen existieren')
  }

  // Delete child spots first if this is a container
  await prisma.placementSpot.deleteMany({
    where: { parentSpotId: id },
  })

  await prisma.placementSpot.delete({
    where: { id },
  })

  revalidatePath(`/housing/${housingUnitId}`)
  revalidatePath(`/housing/${housingUnitId}/spots`)
}

export async function createMultipleSpots(formData: FormData): Promise<void> {
  const data = validateFormData(MultipleSpotInputSchema, formData)

  // Create the room (container)
  const room = await prisma.placementSpot.create({
    data: {
      housingUnitId: data.housingUnitId,
      code: data.roomCode,
      label: data.roomLabel,
      type: 'ROOM',
      squareMeters: data.squareMeters,
      floor: data.floor,
      status: DEFAULT_STATUSES.spot,
    },
  })

  // Create beds inside the room
  for (let i = 1; i <= data.bedCount; i++) {
    await prisma.placementSpot.create({
      data: {
        housingUnitId: data.housingUnitId,
        code: `${data.roomCode}-B${i}`,
        label: `Bett ${i}`,
        type: 'BED',
        parentSpotId: room.id,
        status: DEFAULT_STATUSES.spot,
      },
    })
  }

  revalidatePath(`/housing/${data.housingUnitId}`)
  revalidatePath(`/housing/${data.housingUnitId}/spots`)
}
