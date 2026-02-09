'use server'

import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { validatePlacementFormData } from '@/lib/validation/placement'
import { logAudit } from '@/lib/audit'

export async function placeResident(formData: FormData) {
  // SERVER-SIDE VALIDATION: Validate all inputs
  let validatedData
  try {
    validatedData = validatePlacementFormData(formData)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Validierungsfehler: ${error.message}`)
    }
    throw new Error('Ungültige Eingabedaten')
  }

  const {
    residentId,
    housingUnitId,
    spotId,
    compatibilityScore,
    lifestyleScore,
    socialScore,
    practicalScore,
    riskScore,
    apartmentFitScore,
    hasBlockingConflicts,
    notes,
  } = validatedData

  // BLOCKING CHECK: Prevent placement if blocking conflicts exist
  if (hasBlockingConflicts) {
    throw new Error(
      'Placement blockiert: Kritische Konflikte mit Wohnungsprofil erkannt. ' +
      'Bitte wählen Sie eine besser passende Unterkunft.'
    )
  }

  // Execute all placement operations in a transaction to ensure atomicity
  // RACE CONDITION PROTECTION:
  // - All checks and updates happen within a single database transaction
  // - Database isolation level prevents concurrent transactions from seeing same state
  // - Explicit checks ensure spot/resident availability before modification
  // - If any check fails, entire transaction rolls back
  const placement = await prisma.$transaction(async (tx) => {
    // 1. Check if spot is still available (prevents double-booking)
    if (spotId) {
      const spot = await tx.placementSpot.findUnique({
        where: { id: spotId },
        include: { placements: { where: { status: 'ACTIVE' } } },
      })

      if (!spot) {
        throw new Error('Platz nicht gefunden.')
      }

      if (spot.status !== 'AVAILABLE') {
        throw new Error('Platz ist nicht mehr verfügbar.')
      }

      if (spot.placements.length > 0) {
        throw new Error('Platz ist bereits belegt.')
      }
    }

    // 2. Check if resident is still unplaced
    const resident = await tx.resident.findUnique({
      where: { id: residentId },
      include: { placements: { where: { status: 'ACTIVE' } } },
    })

    if (!resident) {
      throw new Error('Bewohner nicht gefunden.')
    }

    if (resident.placements.length > 0) {
      throw new Error('Bewohner ist bereits platziert.')
    }

    // 3. Create placement
    const newPlacement = await tx.placement.create({
      data: {
        residentId,
        housingUnitId,
        spotId,
        startDate: new Date(),
        status: 'ACTIVE',
        compatibilityScore,
        lifestyleScore,
        socialScore,
        practicalScore,
        riskScore,
        placementNotes: notes
          ? `Apartment Fit: ${apartmentFitScore}%\n\n${notes}`
          : `Apartment Fit: ${apartmentFitScore}%`,
      },
    })

    // 4. Update spot status if assigned
    if (spotId) {
      await tx.placementSpot.update({
        where: { id: spotId },
        data: { status: 'OCCUPIED' },
      })
    }

    // 5. Update resident status
    await tx.resident.update({
      where: { id: residentId },
      data: { status: 'PLACED' },
    })

    // 6. Check if unit is now full and update status
    const unit = await tx.housingUnit.findUnique({
      where: { id: housingUnitId },
      include: { placements: { where: { status: 'ACTIVE' } } },
    })

    if (unit && unit.placements.length + 1 >= unit.totalBeds) {
      await tx.housingUnit.update({
        where: { id: housingUnitId },
        data: { status: 'FULL' },
      })
    }

    return newPlacement
  })

  // AUDIT LOG: Record placement for compliance and debugging
  await logAudit({
    action: 'CREATE',
    entity: 'PLACEMENT',
    entityId: placement.id,
    changes: {
      residentId,
      housingUnitId,
      spotId,
      scores: {
        compatibility: compatibilityScore,
        lifestyle: lifestyleScore,
        social: socialScore,
        practical: practicalScore,
        risk: riskScore,
        apartmentFit: apartmentFitScore,
      },
      hasBlockingConflicts,
    },
    reason: notes || undefined,
  })

  redirect(`/residents/${residentId}`)
}
