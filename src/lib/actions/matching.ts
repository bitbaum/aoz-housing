'use server'

import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { logAudit } from '@/lib/audit'
import { calculateCompatibility } from '@/lib/compatibility'
import { toResidentProfile } from '@/lib/compatibility/convert'
import { calculateApartmentProfile, calculateApartmentFit } from '@/lib/compatibility/aggregate'
import { calculateAverageScores } from '@/lib/compatibility/placement-scores'
import { logger } from '@/lib/logger'
import type { Resident, Placement } from '@prisma/client'
import { z } from 'zod'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

/** Minimal schema — scores are now computed server-side */
const placeResidentSchema = z.object({
  residentId: z.string().min(1),
  housingUnitId: z.string().min(1),
  spotId: z.string().nullable(),
  notes: z.string().optional(),
})

/** Build structured placement rationale from computed scores and compatibility data */
function buildPlacementRationale(
  apartmentFitScore: number,
  scores: ReturnType<typeof calculateAverageScores>,
  allStrengths: string[],
  allConcerns: string[],
  roommateCount: number,
  userNotes?: string,
): string {
  const parts: string[] = [`Apartment Fit: ${apartmentFitScore}%`]

  if (allStrengths.length > 0) {
    parts.push('')
    parts.push('Stärken:')
    allStrengths.slice(0, 5).forEach((s) => parts.push(`• ${s}`))
  }

  if (allConcerns.length > 0) {
    parts.push('')
    parts.push('Bedenken:')
    allConcerns.slice(0, 5).forEach((c) => parts.push(`• ${c}`))
  }

  if (roommateCount > 0) {
    parts.push('')
    parts.push(`Kompatibilität: ${roommateCount} Mitbewohner, Ø ${scores.compatibilityScore}% Score`)
  } else {
    parts.push('')
    parts.push('Kompatibilität: Keine Mitbewohner (leere Einheit)')
  }

  if (userNotes) {
    parts.push('')
    parts.push(`Notizen: ${userNotes}`)
  }

  return parts.join('\n')
}

export async function placeResident(formData: FormData) {
  // Parse minimal form data (scores excluded — computed server-side)
  let validatedData
  try {
    validatedData = placeResidentSchema.parse({
      residentId: formData.get('residentId') as string,
      housingUnitId: formData.get('housingUnitId') as string,
      spotId: (formData.get('spotId') as string) || null,
      notes: (formData.get('notes') as string) || undefined,
    })
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Validierungsfehler: ${error.message}`)
    }
    throw new Error(ERROR_MESSAGES.INVALID_INPUT_DATA)
  }

  const {
    residentId,
    housingUnitId,
    spotId,
    notes,
  } = validatedData

  // Execute all placement operations in a transaction to ensure atomicity
  let placement
  try {
    placement = await prisma.$transaction(async (tx) => {
    // 1. Check if spot is still available (prevents double-booking)
    if (spotId) {
      const spot = await tx.placementSpot.findUnique({
        where: { id: spotId },
        include: { placements: { where: { status: 'ACTIVE' } } },
      })

      if (!spot) {
        throw new Error(ERROR_MESSAGES.SPOT_NOT_FOUND_P)
      }

      if (spot.status !== 'AVAILABLE') {
        throw new Error(ERROR_MESSAGES.SPOT_NOT_AVAILABLE_ANYMORE)
      }

      if (spot.placements.length > 0) {
        throw new Error(ERROR_MESSAGES.SPOT_ALREADY_OCCUPIED)
      }
    }

    // 2. Check if resident is still unplaced
    const resident = await tx.resident.findUnique({
      where: { id: residentId },
      include: { placements: { where: { status: 'ACTIVE' } } },
    })

    if (!resident) {
      throw new Error(ERROR_MESSAGES.RESIDENT_NOT_FOUND_P)
    }

    if (resident.placements.length > 0) {
      throw new Error(ERROR_MESSAGES.RESIDENT_ALREADY_PLACED)
    }

    // 3. Fetch existing active placements in the unit for score calculation
    const existingPlacements = await tx.placement.findMany({
      where: { housingUnitId, status: 'ACTIVE' },
      include: { resident: true },
    })

    // 4. Server-side blocking conflict check (never trust client)
    const residentProfile = toResidentProfile(resident)
    const existingProfiles = existingPlacements.map(p => toResidentProfile(p.resident))
    const apartmentProfile = calculateApartmentProfile(existingProfiles)
    const apartmentFit = calculateApartmentFit(residentProfile, apartmentProfile)
    const apartmentFitScore = apartmentFit.fitScore

    const hasBlockingConflicts = apartmentFit.conflicts.some(c => c.severity === 'BLOCKING')
    if (hasBlockingConflicts) {
      const blockingDetails = apartmentFit.conflicts
        .filter(c => c.severity === 'BLOCKING')
        .map(c => c.message)
        .join('; ')
      throw new Error(
        `Placement blockiert: ${blockingDetails}. ` +
        'Bitte wählen Sie eine besser passende Unterkunft.'
      )
    }

    // 5. Calculate scores server-side
    const { compatibilityScore, lifestyleScore, socialScore, practicalScore, riskScore } =
      calculateAverageScores(resident, existingPlacements)

    // 6. Collect strengths/concerns for structured rationale
    const allStrengths: string[] = []
    const allConcerns: string[] = []

    if (existingPlacements.length > 0) {
      for (const existingPlacement of existingPlacements) {
        const otherProfile = toResidentProfile(existingPlacement.resident)
        const score = calculateCompatibility(residentProfile, otherProfile)

        // Collect insights
        score.strengths?.forEach((s) => {
          if (!allStrengths.includes(s)) allStrengths.push(s)
        })
        score.concerns?.forEach((c) => {
          if (!allConcerns.includes(c)) allConcerns.push(c)
        })

        // Create bidirectional CompatibilityAssessment records
        await tx.compatibilityAssessment.upsert({
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

        // Reverse assessment for matrix symmetry
        await tx.compatibilityAssessment.upsert({
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

    // 6. Build structured placement rationale
    const placementNotes = buildPlacementRationale(
      apartmentFitScore,
      { compatibilityScore, lifestyleScore, socialScore, practicalScore, riskScore },
      allStrengths,
      allConcerns,
      existingPlacements.length,
      notes,
    )

    // 7. Create placement with server-computed scores
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
        placementNotes,
      },
    })

    // 8. Update spot status if assigned
    if (spotId) {
      await tx.placementSpot.update({
        where: { id: spotId },
        data: { status: 'OCCUPIED' },
      })
    }

    // 9. Update resident status
    await tx.resident.update({
      where: { id: residentId },
      data: { status: 'PLACED' },
    })

    // 10. Check if unit is now full and update status
    const unit = await tx.housingUnit.findUnique({
      where: { id: housingUnitId },
      include: { placements: { where: { status: 'ACTIVE' } } },
    })

    // placements already includes the newly created one (same transaction)
    if (unit && unit.placements.length >= unit.totalBeds) {
      await tx.housingUnit.update({
        where: { id: housingUnitId },
        data: { status: 'FULL' },
      })
    }

      return { placement: newPlacement, compatibilityScore, lifestyleScore, socialScore, practicalScore, riskScore, apartmentFitScore }
    })

    // AUDIT LOG: Record placement for compliance and debugging
    await logAudit({
      action: 'CREATE',
      entity: 'PLACEMENT',
      entityId: placement.placement.id,
      changes: {
        residentId,
        housingUnitId,
        spotId,
        scores: {
          compatibility: placement.compatibilityScore,
          lifestyle: placement.lifestyleScore,
          social: placement.socialScore,
          practical: placement.practicalScore,
          risk: placement.riskScore,
          apartmentFit: placement.apartmentFitScore,
        },
      },
      reason: notes || undefined,
    })
  } catch (error) {
    // Re-throw known validation errors (from inside transaction)
    if (error instanceof Error && (
      error.message.includes('nicht gefunden') ||
      error.message.includes('nicht mehr verfügbar') ||
      error.message.includes('bereits') ||
      error.message.includes('blockiert')
    )) {
      throw error
    }
    logger.errorWithCause('Failed to place resident', error, { residentId, housingUnitId, spotId })
    throw new Error(ERROR_MESSAGES.PLACEMENT_ERROR)
  }

  redirect(`/residents/${residentId}?placed=true`)
}
