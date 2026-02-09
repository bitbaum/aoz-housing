'use server'

import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { logAudit } from '@/lib/audit'
import { calculateCompatibility } from '@/lib/compatibility'
import { toResidentProfile } from '@/lib/compatibility/convert'
import type { Resident, Placement } from '@prisma/client'
import { z } from 'zod'

/** Minimal schema — scores are now computed server-side */
const placeResidentSchema = z.object({
  residentId: z.string().min(1),
  housingUnitId: z.string().min(1),
  spotId: z.string().nullable(),
  apartmentFitScore: z.number().min(0).max(100).default(100),
  hasBlockingConflicts: z.boolean().default(false),
  notes: z.string().optional(),
})

/** Calculate average compatibility scores between a resident and existing placements */
function calculateAverageScores(
  resident: Resident,
  existingPlacements: (Placement & { resident: Resident })[]
) {
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
      apartmentFitScore: parseFloat(formData.get('apartmentFitScore') as string) || 100,
      hasBlockingConflicts: formData.get('hasBlockingConflicts') === 'true',
      notes: (formData.get('notes') as string) || undefined,
    })
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

    // 3. Fetch existing active placements in the unit for score calculation
    const existingPlacements = await tx.placement.findMany({
      where: { housingUnitId, status: 'ACTIVE' },
      include: { resident: true },
    })

    // 4. Calculate scores server-side (replaces client-sent scores)
    const { compatibilityScore, lifestyleScore, socialScore, practicalScore, riskScore } =
      calculateAverageScores(resident, existingPlacements)

    // 5. Collect strengths/concerns for structured rationale
    const allStrengths: string[] = []
    const allConcerns: string[] = []

    if (existingPlacements.length > 0) {
      const residentProfile = toResidentProfile(resident)

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

    if (unit && unit.placements.length + 1 >= unit.totalBeds) {
      await tx.housingUnit.update({
        where: { id: housingUnitId },
        data: { status: 'FULL' },
      })
    }

    return { placement: newPlacement, compatibilityScore, lifestyleScore, socialScore, practicalScore, riskScore }
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
        apartmentFit: apartmentFitScore,
      },
      hasBlockingConflicts,
    },
    reason: notes || undefined,
  })

  redirect(`/residents/${residentId}`)
}
