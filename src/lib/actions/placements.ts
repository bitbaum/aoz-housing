'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  validateFormData,
  EndPlacementSchema,
  TransferPlacementSchema,
} from '@/lib/validation'
import { logAudit } from '@/lib/audit'
import { calculateCompatibility } from '@/lib/compatibility'
import { toResidentProfile } from '@/lib/compatibility/convert'
import { DEFAULT_STATUSES } from '@/lib/config/thresholds'
import type { Resident, Placement } from '@prisma/client'

interface CreatePlacementInput {
  residentId: string
  housingUnitId: string
  spotId: string
  startDate: Date
  notes?: string
}

/** Calculate average compatibility scores between a resident and existing placements */
function calculateAverageScores(resident: Resident, existingPlacements: (Placement & { resident: Resident })[]) {
  if (existingPlacements.length === 0) {
    return { compatibilityScore: 100, lifestyleScore: 100, socialScore: 100, practicalScore: 100, riskScore: 0 }
  }

  const residentProfile = toResidentProfile(resident)
  const scores = existingPlacements.map((p) => {
    const otherProfile = toResidentProfile(p.resident)
    return calculateCompatibility(residentProfile, otherProfile)
  })

  return {
    compatibilityScore: Math.round(scores.reduce((a, s) => a + s.overall, 0) / scores.length),
    lifestyleScore: Math.round(scores.reduce((a, s) => a + s.lifestyle, 0) / scores.length),
    socialScore: Math.round(scores.reduce((a, s) => a + s.social, 0) / scores.length),
    practicalScore: Math.round(scores.reduce((a, s) => a + s.practical, 0) / scores.length),
    riskScore: Math.round(scores.reduce((a, s) => a + s.risk, 0) / scores.length),
  }
}

export async function createPlacement(input: CreatePlacementInput): Promise<{ success: boolean; placementId?: string; error?: string }> {
  const { residentId, housingUnitId, spotId, startDate, notes } = input

  try {
    // 1. Validate resident exists
    const resident = await prisma.resident.findUnique({ where: { id: residentId } })
    if (!resident) {
      return { success: false, error: 'Resident not found' }
    }

    // 2. Prevent duplicate active placement
    const existingActivePlacement = await prisma.placement.findFirst({
      where: { residentId, status: 'ACTIVE' },
    })
    if (existingActivePlacement) {
      return { success: false, error: 'Bewohner hat bereits eine aktive Platzierung' }
    }

    // 3. Validate spot is available
    const spot = await prisma.placementSpot.findUnique({ where: { id: spotId } })
    if (!spot) {
      return { success: false, error: 'Platz nicht gefunden' }
    }
    if (spot.status !== 'AVAILABLE') {
      return { success: false, error: 'Platz ist nicht verfügbar' }
    }

    // 4. Calculate compatibility scores with existing residents
    const existingPlacements = await prisma.placement.findMany({
      where: { housingUnitId, status: 'ACTIVE' },
      include: { resident: true },
    })

    const { compatibilityScore, lifestyleScore, socialScore, practicalScore, riskScore } =
      calculateAverageScores(resident, existingPlacements)

    // 2. Create pair-wise compatibility assessments with each existing resident
    if (existingPlacements.length > 0) {
      const residentProfile = toResidentProfile(resident)

      for (const existingPlacement of existingPlacements) {
        const otherProfile = toResidentProfile(existingPlacement.resident)
        const score = calculateCompatibility(residentProfile, otherProfile)

        // Create assessment for new resident -> existing resident
        await prisma.compatibilityAssessment.upsert({
          where: {
            residentId_comparedWithId: {
              residentId: residentId,
              comparedWithId: existingPlacement.residentId,
            },
          },
          update: {
            overallScore: score.overall,
            lifestyleScore: score.lifestyle,
            socialScore: score.social,
            practicalScore: score.practical,
            riskScore: score.risk,
            strengths: score.strengths || [],
            concerns: score.concerns || [],
          },
          create: {
            residentId: residentId,
            comparedWithId: existingPlacement.residentId,
            overallScore: score.overall,
            lifestyleScore: score.lifestyle,
            socialScore: score.social,
            practicalScore: score.practical,
            riskScore: score.risk,
            strengths: score.strengths || [],
            concerns: score.concerns || [],
          },
        })

        // Create reverse assessment (existing -> new) for matrix symmetry
        await prisma.compatibilityAssessment.upsert({
          where: {
            residentId_comparedWithId: {
              residentId: existingPlacement.residentId,
              comparedWithId: residentId,
            },
          },
          update: {
            overallScore: score.overall,
            lifestyleScore: score.lifestyle,
            socialScore: score.social,
            practicalScore: score.practical,
            riskScore: score.risk,
            strengths: score.strengths || [],
            concerns: score.concerns || [],
          },
          create: {
            residentId: existingPlacement.residentId,
            comparedWithId: residentId,
            overallScore: score.overall,
            lifestyleScore: score.lifestyle,
            socialScore: score.social,
            practicalScore: score.practical,
            riskScore: score.risk,
            strengths: score.strengths || [],
            concerns: score.concerns || [],
          },
        })
      }
    }

    // 3. Create the placement
    const placement = await prisma.placement.create({
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

    // 4. Mark spot as occupied
    await prisma.placementSpot.update({
      where: { id: spotId },
      data: { status: 'OCCUPIED' },
    })

    // 5. Update resident status
    await prisma.resident.update({
      where: { id: residentId },
      data: { status: 'PLACED' },
    })

    // 6. Check if housing unit is now full
    const unit = await prisma.housingUnit.findUnique({
      where: { id: housingUnitId },
      include: {
        spots: { where: { status: 'AVAILABLE', type: { not: 'ROOM' } } },
      },
    })
    if (unit && unit.spots.length === 0) {
      await prisma.housingUnit.update({
        where: { id: housingUnitId },
        data: { status: 'FULL' },
      })
    }

    await logAudit({
      action: 'CREATE',
      entity: 'PLACEMENT',
      entityId: placement.id,
      changes: { residentId, housingUnitId, spotId },
      reason: notes,
    })

    revalidatePath(`/residents/${residentId}`)
    revalidatePath(`/housing/${housingUnitId}`)
    revalidatePath('/placements')

    return { success: true, placementId: placement.id }
  } catch (error) {
    console.error('Failed to create placement:', error)
    return { success: false, error: 'Failed to create placement' }
  }
}

export async function endPlacement(formData: FormData): Promise<void> {
  const {
    placementId,
    residentId,
    endReason,
    notes,
    conflictGap,
    wasPredictable,
    relatedIncidentId
  } = validateFormData(EndPlacementSchema, formData)

  const currentPlacement = await prisma.placement.findUnique({
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

  // Only save conflict analysis fields when ending due to CONFLICT
  if (endReason === 'CONFLICT') {
    if (conflictGap) updateData.conflictGap = conflictGap
    if (wasPredictable !== null && wasPredictable !== undefined) {
      updateData.wasPredictable = wasPredictable
    }
    if (relatedIncidentId) updateData.relatedIncidentId = relatedIncidentId
  }

  await prisma.placement.update({
    where: { id: placementId },
    data: updateData,
  })

  // Free up the old spot if there was one
  if (currentPlacement?.spotId) {
    await prisma.placementSpot.update({
      where: { id: currentPlacement.spotId },
      data: { status: 'AVAILABLE' },
    })
  }

  // Update resident status back to ACTIVE (unplaced)
  await prisma.resident.update({
    where: { id: residentId },
    data: { status: 'ACTIVE' },
  })

  // Update housing unit status if it was full
  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
    include: {
      housingUnit: {
        include: { placements: { where: { status: 'ACTIVE' } } },
      },
    },
  })

  if (placement?.housingUnit.status === 'FULL') {
    await prisma.housingUnit.update({
      where: { id: placement.housingUnitId },
      data: { status: 'AVAILABLE' },
    })
  }

  await logAudit({
    action: 'END',
    entity: 'PLACEMENT',
    entityId: placementId,
    changes: { residentId, endReason },
    reason: notes || undefined,
  })

  revalidatePath(`/residents/${residentId}`)
  revalidatePath('/placements')
  redirect(`/residents/${residentId}`)
}

export async function transferPlacement(formData: FormData): Promise<void> {
  const {
    currentPlacementId,
    residentId,
    targetHousingUnitId,
    targetSpotId,
    transferReason,
    notes
  } = validateFormData(TransferPlacementSchema, formData)

  // 1. Get current placement to access spot
  const currentPlacement = await prisma.placement.findUnique({
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
  const targetSpot = await prisma.placementSpot.findUnique({ where: { id: targetSpotId } })
  if (!targetSpot || targetSpot.status !== 'AVAILABLE') {
    throw new Error('Target spot is not available')
  }

  // 3. End current placement with TRANSFERRED status
  await prisma.placement.update({
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
    await prisma.placementSpot.update({
      where: { id: currentPlacement.spotId },
      data: { status: 'AVAILABLE' },
    })
  }

  // 5. Calculate compatibility scores with existing residents at target
  const resident = await prisma.resident.findUnique({ where: { id: residentId } })
  if (!resident) throw new Error('Resident not found')

  const targetResidents = await prisma.placement.findMany({
    where: { housingUnitId: targetHousingUnitId, status: 'ACTIVE' },
    include: { resident: true },
  })

  const { compatibilityScore, lifestyleScore, socialScore, practicalScore, riskScore } =
    calculateAverageScores(resident, targetResidents)

  // 6. Create new placement at target with calculated scores
  await prisma.placement.create({
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

  // 7. Mark new spot as occupied
  await prisma.placementSpot.update({
    where: { id: targetSpotId },
    data: { status: 'OCCUPIED' },
  })

  // 8. Update resident status
  await prisma.resident.update({
    where: { id: residentId },
    data: { status: 'PLACED' },
  })

  // 9. Update housing unit statuses
  // Old unit: check if it was FULL and now has space
  const oldUnit = await prisma.housingUnit.findUnique({
    where: { id: currentPlacement.housingUnitId },
    include: { placements: { where: { status: 'ACTIVE' } } },
  })
  if (oldUnit?.status === 'FULL') {
    await prisma.housingUnit.update({
      where: { id: currentPlacement.housingUnitId },
      data: { status: 'AVAILABLE' },
    })
  }

  // New unit: check if it's now full
  const newUnit = await prisma.housingUnit.findUnique({
    where: { id: targetHousingUnitId },
    include: {
      placements: { where: { status: 'ACTIVE' } },
      spots: { where: { status: 'AVAILABLE', type: { not: 'ROOM' } } },
    },
  })
  if (newUnit && newUnit.spots.length === 0) {
    await prisma.housingUnit.update({
      where: { id: targetHousingUnitId },
      data: { status: 'FULL' },
    })
  }

  await logAudit({
    action: 'TRANSFER',
    entity: 'PLACEMENT',
    entityId: currentPlacementId,
    changes: {
      residentId,
      fromHousingUnitId: currentPlacement.housingUnitId,
      toHousingUnitId: targetHousingUnitId,
      toSpotId: targetSpotId,
      transferReason,
    },
    reason: notes || undefined,
  })

  revalidatePath(`/residents/${residentId}`)
  revalidatePath('/placements')
  revalidatePath(`/housing/${currentPlacement.housingUnitId}`)
  revalidatePath(`/housing/${targetHousingUnitId}`)
  redirect(`/residents/${residentId}`)
}
