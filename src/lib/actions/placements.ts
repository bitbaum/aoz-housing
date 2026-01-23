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

  // 4. Create new placement at target
  await prisma.placement.create({
    data: {
      residentId,
      housingUnitId: targetHousingUnitId,
      spotId: targetSpotId,
      startDate: new Date(),
      status: 'ACTIVE',
      placementNotes: `Verlegt von ${currentPlacement.housingUnitId}. ${notes || ''}`.trim(),
    },
  })

  // 5. Mark new spot as occupied
  await prisma.placementSpot.update({
    where: { id: targetSpotId },
    data: { status: 'OCCUPIED' },
  })

  // 6. Update resident status
  await prisma.resident.update({
    where: { id: residentId },
    data: { status: 'PLACED' },
  })

  // 7. Update housing unit statuses
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
