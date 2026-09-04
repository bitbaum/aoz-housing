'use server'

import { db, placementSpot, placement, isUniqueViolation } from '@/lib/db'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import {
  validateFormData,
  idSchema,
  SpotInputSchema,
  SpotUpdateSchema,
  MultipleSpotInputSchema,
} from '@/lib/validation'
import { logger } from '@/lib/logger'
import { DEFAULT_STATUSES } from '@/lib/config/thresholds'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { requirePermission } from '@/lib/auth'

// Simple schema for delete operation
const DeleteSpotSchema = z.object({
  id: idSchema,
  housingUnitId: idSchema,
})

export async function createSpot(formData: FormData): Promise<void> {
  await requirePermission('housing:write')
  const data = validateFormData(SpotInputSchema, formData)

  try {
    await db.insert(placementSpot).values({
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
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error(ERROR_MESSAGES.SPOT_CODE_EXISTS)
    }
    logger.errorWithCause('Failed to create spot', error, { housingUnitId: data.housingUnitId })
    throw new Error(ERROR_MESSAGES.SPOT_CREATE_ERROR)
  }

  revalidatePath(`/housing/${data.housingUnitId}`)
  revalidatePath(`/housing/${data.housingUnitId}/spots`)
  redirect(`/housing/${data.housingUnitId}/spots?created=true`)
}

export async function updateSpot(formData: FormData): Promise<void> {
  await requirePermission('housing:write')
  const data = validateFormData(SpotUpdateSchema, formData)
  const { id, housingUnitId, ...updateData } = data

  try {
    const [updated] = await db
      .update(placementSpot)
      .set({
        ...updateData,
        parentSpotId: updateData.parentSpotId || null,
      })
      .where(eq(placementSpot.id, id))
      .returning({ id: placementSpot.id })

    // Updating a missing row used to throw (P2025); keep that error path.
    if (!updated) {
      throw new Error(ERROR_MESSAGES.SPOT_UPDATE_ERROR)
    }
  } catch (error) {
    logger.errorWithCause('Failed to update spot', error, { spotId: id, housingUnitId })
    throw new Error(ERROR_MESSAGES.SPOT_UPDATE_ERROR)
  }

  revalidatePath(`/housing/${housingUnitId}`)
  revalidatePath(`/housing/${housingUnitId}/spots`)
  redirect(`/housing/${housingUnitId}/spots?updated=true`)
}

export async function deleteSpot(formData: FormData): Promise<void> {
  await requirePermission('housing:write')
  const { id, housingUnitId } = validateFormData(DeleteSpotSchema, formData)

  try {
    // Check if spot has active placements
    const activePlacements = await db.$count(
      placement,
      and(eq(placement.spotId, id), eq(placement.status, 'ACTIVE')),
    )

    if (activePlacements > 0) {
      throw new Error(ERROR_MESSAGES.SPOT_DELETE_BLOCKED)
    }

    // Delete child spots first if this is a container
    await db.delete(placementSpot).where(eq(placementSpot.parentSpotId, id))

    const deleted = await db
      .delete(placementSpot)
      .where(eq(placementSpot.id, id))
      .returning({ id: placementSpot.id })

    // Deleting a missing row used to throw (P2025); keep that error path.
    if (deleted.length === 0) {
      throw new Error(ERROR_MESSAGES.SPOT_DELETE_ERROR)
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes(ERROR_MESSAGES.SPOT_DELETE_BLOCKED)) {
      throw error
    }
    logger.errorWithCause('Failed to delete spot', error, { spotId: id, housingUnitId })
    throw new Error(ERROR_MESSAGES.SPOT_DELETE_ERROR)
  }

  revalidatePath(`/housing/${housingUnitId}`)
  revalidatePath(`/housing/${housingUnitId}/spots`)
  redirect(`/housing/${housingUnitId}/spots?deleted=true`)
}

export async function createMultipleSpots(formData: FormData): Promise<void> {
  await requirePermission('housing:write')
  const data = validateFormData(MultipleSpotInputSchema, formData)

  try {
    // Create the room (container)
    const [room] = await db
      .insert(placementSpot)
      .values({
        housingUnitId: data.housingUnitId,
        code: data.roomCode,
        label: data.roomLabel,
        type: 'ROOM',
        squareMeters: data.squareMeters,
        floor: data.floor,
        status: DEFAULT_STATUSES.spot,
      })
      .returning()

    // Create beds inside the room
    for (let i = 1; i <= data.bedCount; i++) {
      await db.insert(placementSpot).values({
        housingUnitId: data.housingUnitId,
        code: `${data.roomCode}-B${i}`,
        label: `Bett ${i}`,
        type: 'BED',
        parentSpotId: room.id,
        status: DEFAULT_STATUSES.spot,
      })
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error(ERROR_MESSAGES.SPOT_CODE_EXISTS)
    }
    logger.errorWithCause('Failed to create multiple spots', error, {
      housingUnitId: data.housingUnitId,
    })
    throw new Error(ERROR_MESSAGES.SPOTS_BATCH_CREATE_ERROR)
  }

  revalidatePath(`/housing/${data.housingUnitId}`)
  revalidatePath(`/housing/${data.housingUnitId}/spots`)
  redirect(`/housing/${data.housingUnitId}/spots?createdMultiple=true`)
}
