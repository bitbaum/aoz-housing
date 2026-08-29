'use server'

import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { validateFormData, EndPlacementSchema, TransferPlacementSchema } from '@/lib/validation'
import { logAudit } from '@/lib/audit'
import { calculateCompatibility, saveBidirectionalAssessment } from '@/lib/compatibility'
import { toResidentProfile } from '@/lib/compatibility/convert'
import { calculateAverageScores } from '@/lib/compatibility/placement-scores'
import { DEFAULT_STATUSES } from '@/lib/config/thresholds'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { requirePermission } from '@/lib/auth'

interface CreatePlacementInput {
  residentId: string
  housingUnitId: string
  spotId: string
  startDate: Date
  notes?: string
}

export async function createPlacement(
  input: CreatePlacementInput,
): Promise<{ success: boolean; placementId?: string; error?: string }> {
  const user = await requirePermission('placements:write')
  const { residentId, housingUnitId, spotId, startDate, notes } = input

  try {
    const placement = await prisma.$transaction(async (tx) => {
      // 1. Validate resident exists
      const resident = await tx.resident.findUnique({ where: { id: residentId } })
      if (!resident) {
        throw new Error(ERROR_MESSAGES.RESIDENT_NOT_FOUND)
      }

      // 2. Prevent duplicate active placement
      const existingActivePlacement = await tx.placement.findFirst({
        where: { residentId, status: 'ACTIVE' },
      })
      if (existingActivePlacement) {
        throw new Error(ERROR_MESSAGES.RESIDENT_HAS_ACTIVE_PLACEMENT)
      }

      // 3. Validate spot is available
      const spot = await tx.placementSpot.findUnique({ where: { id: spotId } })
      if (!spot) {
        throw new Error(ERROR_MESSAGES.SPOT_NOT_FOUND)
      }
      if (spot.status !== 'AVAILABLE') {
        throw new Error(ERROR_MESSAGES.SPOT_NOT_AVAILABLE)
      }

      // 4. Calculate compatibility scores with existing residents
      const existingPlacements = await tx.placement.findMany({
        where: { housingUnitId, status: 'ACTIVE' },
        include: { resident: true },
      })

      const { compatibilityScore, lifestyleScore, socialScore, practicalScore, riskScore } =
        calculateAverageScores(resident, existingPlacements)

      // 5. Create pair-wise compatibility assessments with each existing resident
      if (existingPlacements.length > 0) {
        const residentProfile = toResidentProfile(resident)

        for (const existingPlacement of existingPlacements) {
          const otherProfile = toResidentProfile(existingPlacement.resident)
          const score = calculateCompatibility(residentProfile, otherProfile)
          await saveBidirectionalAssessment(tx, residentId, existingPlacement.residentId, score)
        }
      }

      // 6. Create the placement
      const newPlacement = await tx.placement.create({
        data: {
          residentId,
          housingUnitId,
          spotId,
          startDate,
          status: DEFAULT_STATUSES.placement,
          compatibilityScore,
          lifestyleScore,
          socialScore,
          practicalScore,
          riskScore,
          placementNotes: notes,
        },
      })

      // 7. Mark spot as occupied
      await tx.placementSpot.update({
        where: { id: spotId },
        data: { status: 'OCCUPIED' },
      })

      // 8. Update resident status
      await tx.resident.update({
        where: { id: residentId },
        data: { status: 'PLACED' },
      })

      // 9. Check if housing unit is now full
      const unit = await tx.housingUnit.findUnique({
        where: { id: housingUnitId },
        include: {
          spots: { where: { status: 'AVAILABLE', type: { not: 'ROOM' } } },
        },
      })
      if (unit && unit.spots.length === 0) {
        await tx.housingUnit.update({
          where: { id: housingUnitId },
          data: { status: 'FULL' },
        })
      }

      return newPlacement
    })

    await logAudit({
      action: 'CREATE',
      entity: 'PLACEMENT',
      entityId: placement.id,
      userId: user.id,
      changes: { residentId, housingUnitId, spotId },
      reason: notes,
    })

    revalidatePath(`/residents/${residentId}`)
    revalidatePath(`/housing/${housingUnitId}`)
    revalidatePath('/placements')

    return { success: true, placementId: placement.id }
  } catch (error) {
    logger.errorWithCause('Failed to create placement', error, {
      residentId,
      housingUnitId,
      spotId,
    })
    const message = error instanceof Error ? error.message : 'Failed to create placement'
    return { success: false, error: message }
  }
}

export async function endPlacement(formData: FormData): Promise<void> {
  const user = await requirePermission('placements:write')
  const {
    placementId,
    residentId,
    endReason,
    notes,
    conflictGap,
    wasPredictable,
    relatedIncidentId,
  } = validateFormData(EndPlacementSchema, formData)

  try {
    await prisma.$transaction(async (tx) => {
      const currentPlacement = await tx.placement.findUnique({
        where: { id: placementId },
        include: { spot: true },
      })

      if (!currentPlacement || currentPlacement.status !== 'ACTIVE') {
        throw new Error('Placement not found or not active')
      }

      // Build update data, including conflict fields only when endReason is CONFLICT
      const updateData: {
        status: 'ENDED'
        endDate: Date
        endReason: typeof endReason
        placementNotes?: string
        conflictGap?: string
        wasPredictable?: boolean
        relatedIncidentId?: string
      } = {
        status: 'ENDED',
        endDate: new Date(),
        endReason,
        placementNotes: notes || undefined,
      }

      if (endReason === 'CONFLICT') {
        if (conflictGap) updateData.conflictGap = conflictGap
        if (wasPredictable !== null && wasPredictable !== undefined) {
          updateData.wasPredictable = wasPredictable
        }
        if (relatedIncidentId) updateData.relatedIncidentId = relatedIncidentId
      }

      await tx.placement.update({
        where: { id: placementId },
        data: updateData,
      })

      // Free up the old spot if there was one
      if (currentPlacement.spotId) {
        await tx.placementSpot.update({
          where: { id: currentPlacement.spotId },
          data: { status: 'AVAILABLE' },
        })
      }

      // Update resident status back to ACTIVE (unplaced)
      await tx.resident.update({
        where: { id: residentId },
        data: { status: 'ACTIVE' },
      })

      // Update housing unit status if it was full
      if (currentPlacement.housingUnitId) {
        const unit = await tx.housingUnit.findUnique({
          where: { id: currentPlacement.housingUnitId },
        })
        if (unit?.status === 'FULL') {
          await tx.housingUnit.update({
            where: { id: currentPlacement.housingUnitId },
            data: { status: 'AVAILABLE' },
          })
        }
      }
    })

    await logAudit({
      action: 'END',
      entity: 'PLACEMENT',
      entityId: placementId,
      userId: user.id,
      changes: { residentId, endReason },
      reason: notes || undefined,
    })
  } catch (error) {
    // Re-throw known validation errors from transaction
    if (
      error instanceof Error &&
      (error.message.includes('not found') || error.message.includes('not active'))
    ) {
      throw error
    }
    logger.errorWithCause('Failed to end placement', error, { placementId, residentId })
    throw new Error(ERROR_MESSAGES.PLACEMENT_END_ERROR)
  }

  revalidatePath(`/residents/${residentId}`)
  revalidatePath('/placements')
  redirect(`/residents/${residentId}?ended=true`)
}

export async function transferPlacement(formData: FormData): Promise<void> {
  const user = await requirePermission('placements:write')
  const {
    currentPlacementId,
    residentId,
    targetHousingUnitId,
    targetSpotId,
    transferReason,
    notes,
  } = validateFormData(TransferPlacementSchema, formData)

  let fromHousingUnitId: string
  try {
    fromHousingUnitId = await prisma.$transaction(async (tx) => {
      // 1. Get current placement to access spot
      const currentPlacement = await tx.placement.findUnique({
        where: { id: currentPlacementId },
        include: { spot: true },
      })

      if (!currentPlacement) {
        throw new Error('Current placement not found')
      }
      if (currentPlacement.status !== 'ACTIVE') {
        throw new Error('Only active placements can be transferred')
      }

      // 2. Validate target spot is available
      const targetSpot = await tx.placementSpot.findUnique({ where: { id: targetSpotId } })
      if (!targetSpot || targetSpot.status !== 'AVAILABLE') {
        throw new Error('Target spot is not available')
      }

      // 3. End current placement with TRANSFERRED status
      await tx.placement.update({
        where: { id: currentPlacementId },
        data: {
          status: 'TRANSFERRED',
          endDate: new Date(),
          endReason: transferReason,
          outcomeNotes: notes || undefined,
        },
      })

      // 4. Free up the old spot
      if (currentPlacement.spotId) {
        await tx.placementSpot.update({
          where: { id: currentPlacement.spotId },
          data: { status: 'AVAILABLE' },
        })
      }

      // 5. Calculate compatibility scores with existing residents at target
      const resident = await tx.resident.findUnique({ where: { id: residentId } })
      if (!resident) throw new Error('Resident not found')

      const targetResidents = await tx.placement.findMany({
        where: { housingUnitId: targetHousingUnitId, status: 'ACTIVE' },
        include: { resident: true },
      })

      const { compatibilityScore, lifestyleScore, socialScore, practicalScore, riskScore } =
        calculateAverageScores(resident, targetResidents)

      // 6. Create bidirectional CompatibilityAssessment records for target unit
      if (targetResidents.length > 0) {
        const residentProfile = toResidentProfile(resident)

        for (const existingPlacement of targetResidents) {
          const otherProfile = toResidentProfile(existingPlacement.resident)
          const score = calculateCompatibility(residentProfile, otherProfile)
          await saveBidirectionalAssessment(tx, residentId, existingPlacement.residentId, score)
        }
      }

      // 7. Create new placement at target with calculated scores
      await tx.placement.create({
        data: {
          residentId,
          housingUnitId: targetHousingUnitId,
          spotId: targetSpotId,
          startDate: new Date(),
          status: 'ACTIVE',
          compatibilityScore,
          lifestyleScore,
          socialScore,
          practicalScore,
          riskScore,
          placementNotes: `Verlegt von ${currentPlacement.housingUnitId}. ${notes || ''}`.trim(),
        },
      })

      // 8. Mark new spot as occupied
      await tx.placementSpot.update({
        where: { id: targetSpotId },
        data: { status: 'OCCUPIED' },
      })

      // 9. Update housing unit statuses
      const oldUnit = await tx.housingUnit.findUnique({
        where: { id: currentPlacement.housingUnitId },
      })
      if (oldUnit?.status === 'FULL') {
        await tx.housingUnit.update({
          where: { id: currentPlacement.housingUnitId },
          data: { status: 'AVAILABLE' },
        })
      }

      const newUnit = await tx.housingUnit.findUnique({
        where: { id: targetHousingUnitId },
        include: {
          spots: { where: { status: 'AVAILABLE', type: { not: 'ROOM' } } },
        },
      })
      if (newUnit && newUnit.spots.length === 0) {
        await tx.housingUnit.update({
          where: { id: targetHousingUnitId },
          data: { status: 'FULL' },
        })
      }

      return currentPlacement.housingUnitId
    })

    await logAudit({
      action: 'TRANSFER',
      entity: 'PLACEMENT',
      entityId: currentPlacementId,
      userId: user.id,
      changes: {
        residentId,
        fromHousingUnitId,
        toHousingUnitId: targetHousingUnitId,
        toSpotId: targetSpotId,
        transferReason,
      },
      reason: notes || undefined,
    })
  } catch (error) {
    // Re-throw known validation errors from transaction
    if (
      error instanceof Error &&
      (error.message.includes('not found') ||
        error.message.includes('not active') ||
        error.message.includes('not available') ||
        error.message.includes('cannot be transferred'))
    ) {
      throw error
    }
    logger.errorWithCause('Failed to transfer placement', error, {
      currentPlacementId,
      residentId,
      targetHousingUnitId,
    })
    throw new Error(ERROR_MESSAGES.TRANSFER_ERROR)
  }

  revalidatePath(`/residents/${residentId}`)
  revalidatePath('/placements')
  revalidatePath(`/housing/${fromHousingUnitId}`)
  revalidatePath(`/housing/${targetHousingUnitId}`)
  redirect(`/residents/${residentId}?transferred=true`)
}
