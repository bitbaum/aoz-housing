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

interface CreatePlacementInput {
  residentId: string
  housingUnitId: string
  spotId: string
  startDate: Date
  notes?: string
}

export async function createPlacement(input: CreatePlacementInput): Promise<{ success: boolean; placementId?: string; error?: string }> {
  const { residentId, housingUnitId, spotId, startDate, notes } = input

  try {
    // 1. Calculate compatibility scores with existing residents
    const resident = await prisma.resident.findUnique({ where: { id: residentId } })
    if (!resident) {
      return { success: false, error: 'Resident not found' }
    }

    const existingPlacements = await prisma.placement.findMany({
      where: { housingUnitId, status: 'ACTIVE' },
      include: { resident: true },
    })

    let compatibilityScore = 100
    let lifestyleScore = 100
    let socialScore = 100
    let practicalScore = 100
    let riskScore = 0

    if (existingPlacements.length > 0) {
      const residentProfile = toResidentProfile(resident)
      const scores = existingPlacements.map((p) => {
        const otherProfile = toResidentProfile(p.resident)
        return calculateCompatibility(residentProfile, otherProfile)
      })

      compatibilityScore = Math.round(scores.reduce((a, s) => a + s.overall, 0) / scores.length)
      lifestyleScore = Math.round(scores.reduce((a, s) => a + s.lifestyle, 0) / scores.length)
      socialScore = Math.round(scores.reduce((a, s) => a + s.social, 0) / scores.length)
      practicalScore = Math.round(scores.reduce((a, s) => a + s.practical, 0) / scores.length)
      riskScore = Math.round(scores.reduce((a, s) => a + s.risk, 0) / scores.length)
    }

    // 2. Create the placement
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

    // 3. Mark spot as occupied
    await prisma.placementSpot.update({
      where: { id: spotId },
      data: { status: 'OCCUPIED' },
    })

    // 4. Update resident status
    await prisma.resident.update({
      where: { id: residentId },
      data: { status: 'PLACED' },
    })

    // 5. Check if housing unit is now full
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
  const { placementId, residentId, endReason, notes } = validateFormData(EndPlacementSchema, formData)

  const currentPlacement = await prisma.placement.findUnique({
    where: { id: placementId },
    include: { spot: true },
  })

  await prisma.placement.update({
    where: { id: placementId },
    data: {
      status: 'ENDED',
      endDate: new Date(),
      endReason,
      placementNotes: notes || undefined,
    },
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

  // 2. End current placement with TRANSFERRED status
  await prisma.placement.update({
    where: { id: currentPlacementId },
    data: {
      status: 'TRANSFERRED',
      endDate: new Date(),
      endReason: transferReason,
      outcomeNotes: notes || undefined,
    },
  })

  // 3. Free up the old spot
  if (currentPlacement.spotId) {
    await prisma.placementSpot.update({
      where: { id: currentPlacement.spotId },
      data: { status: 'AVAILABLE' },
    })
  }

  // 4. Calculate compatibility scores with existing residents at target
  const resident = await prisma.resident.findUnique({ where: { id: residentId } })
  if (!resident) throw new Error('Resident not found')

  const targetResidents = await prisma.placement.findMany({
    where: { housingUnitId: targetHousingUnitId, status: 'ACTIVE' },
    include: { resident: true },
  })

  let compatibilityScore = 100
  let lifestyleScore = 100
  let socialScore = 100
  let practicalScore = 100
  let riskScore = 0

  if (targetResidents.length > 0) {
    const residentProfile = toResidentProfile(resident)
    const scores = targetResidents.map((p) => {
      const otherProfile = toResidentProfile(p.resident)
      return calculateCompatibility(residentProfile, otherProfile)
    })

    compatibilityScore = Math.round(scores.reduce((a, s) => a + s.overall, 0) / scores.length)
    lifestyleScore = Math.round(scores.reduce((a, s) => a + s.lifestyle, 0) / scores.length)
    socialScore = Math.round(scores.reduce((a, s) => a + s.social, 0) / scores.length)
    practicalScore = Math.round(scores.reduce((a, s) => a + s.practical, 0) / scores.length)
    riskScore = Math.round(scores.reduce((a, s) => a + s.risk, 0) / scores.length)
  }

  // 5. Create new placement at target with calculated scores
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

  // 6. Mark new spot as occupied
  await prisma.placementSpot.update({
    where: { id: targetSpotId },
    data: { status: 'OCCUPIED' },
  })

  // 7. Update resident status
  await prisma.resident.update({
    where: { id: residentId },
    data: { status: 'PLACED' },
  })

  // 8. Update housing unit statuses
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
