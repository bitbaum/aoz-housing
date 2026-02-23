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
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { DEFAULT_STATUSES } from '@/lib/config/thresholds'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// Simple schema for delete operation
const DeleteSpotSchema = z.object({
  id: z.string().cuid(),
  housingUnitId: z.string().cuid(),
})

export async function createSpot(formData: FormData): Promise<void> {
  const data = validateFormData(SpotInputSchema, formData)

  try {
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
  } catch (error) {
    logger.errorWithCause('Failed to create spot', error, { housingUnitId: data.housingUnitId })
    throw new Error(ERROR_MESSAGES.SPOT_CREATE_ERROR)
  }

  revalidatePath(`/housing/${data.housingUnitId}`)
  revalidatePath(`/housing/${data.housingUnitId}/spots`)
}

export async function updateSpot(formData: FormData): Promise<void> {
  const data = validateFormData(SpotUpdateSchema, formData)
  const { id, housingUnitId, ...updateData } = data

  try {
    await prisma.placementSpot.update({
      where: { id },
      data: {
        ...updateData,
        parentSpotId: updateData.parentSpotId || null,
      },
    })
  } catch (error) {
    logger.errorWithCause('Failed to update spot', error, { spotId: id, housingUnitId })
    throw new Error(ERROR_MESSAGES.SPOT_UPDATE_ERROR)
  }

  revalidatePath(`/housing/${housingUnitId}`)
  revalidatePath(`/housing/${housingUnitId}/spots`)
}

export async function deleteSpot(formData: FormData): Promise<void> {
  const { id, housingUnitId } = validateFormData(DeleteSpotSchema, formData)

  try {
    // Check if spot has active placements
    const activePlacements = await prisma.placement.count({
      where: { spotId: id, status: 'ACTIVE' },
    })

    if (activePlacements > 0) {
      throw new Error(ERROR_MESSAGES.SPOT_DELETE_BLOCKED)
    }

    // Delete child spots first if this is a container
    await prisma.placementSpot.deleteMany({
      where: { parentSpotId: id },
    })

    await prisma.placementSpot.delete({
      where: { id },
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes(ERROR_MESSAGES.SPOT_DELETE_BLOCKED)) {
      throw error
    }
    logger.errorWithCause('Failed to delete spot', error, { spotId: id, housingUnitId })
    throw new Error(ERROR_MESSAGES.SPOT_DELETE_ERROR)
  }

  revalidatePath(`/housing/${housingUnitId}`)
  revalidatePath(`/housing/${housingUnitId}/spots`)
}

export async function createMultipleSpots(formData: FormData): Promise<void> {
  const data = validateFormData(MultipleSpotInputSchema, formData)

  try {
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
  } catch (error) {
    logger.errorWithCause('Failed to create multiple spots', error, { housingUnitId: data.housingUnitId })
    throw new Error(ERROR_MESSAGES.SPOTS_BATCH_CREATE_ERROR)
  }

  revalidatePath(`/housing/${data.housingUnitId}`)
  revalidatePath(`/housing/${data.housingUnitId}/spots`)
}
