'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  validateFormData,
  SatisfactionCheckInInputSchema,
} from '@/lib/validation'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'

export async function createCheckInFromForm(formData: FormData): Promise<void> {
  const data = validateFormData(SatisfactionCheckInInputSchema, formData)

  const placement = await prisma.placement.findUnique({
    where: { id: data.placementId },
    select: { residentId: true, startDate: true },
  })

  if (!placement) {
    throw new Error('Platzierung nicht gefunden')
  }

  // Calculate week number since placement start
  const weeksSinceStart = Math.floor(
    (Date.now() - new Date(placement.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)
  )

  const checkIn = await prisma.satisfactionCheckIn.create({
    data: {
      placementId: data.placementId,
      checkInType: data.checkInType,
      weekNumber: data.weekNumber ?? weeksSinceStart,
      overallSatisfaction: data.overallSatisfaction,
      roommateRelations: data.roommateRelations,
      facilitySatisfaction: data.facilitySatisfaction,
      safetyFeeling: data.safetyFeeling,
      concerns: data.concerns || null,
      improvements: data.improvements || null,
      positives: data.positives || null,
      collectedBy: data.collectedBy || null,
      isAnonymous: data.isAnonymous ?? false,
    },
  })

  // Update placement satisfaction rating with latest overall
  await prisma.placement.update({
    where: { id: data.placementId },
    data: {
      satisfactionRating: data.overallSatisfaction,
    },
  })

  await logAudit({
    action: 'CREATE',
    entity: 'CHECK_IN',
    entityId: checkIn.id,
    changes: {
      placementId: data.placementId,
      checkInType: data.checkInType,
      overallSatisfaction: data.overallSatisfaction,
      hasConcerns: !!data.concerns,
    },
  })

  revalidatePath('/placements')
  revalidatePath('/residents')
  redirect(`/residents/${placement.residentId}?checkin=true`)
}

/**
 * Quick check-in - minimal data collection for fast feedback
 * Used by the inline QuickCheckIn component
 */
interface QuickCheckInInput {
  placementId: string
  overallSatisfaction: number
  roommateRelations?: number | null
  concerns?: string
  checkInType: 'INITIAL' | 'REGULAR' | 'AD_HOC' | 'EXIT'
  weekNumber: number
}

export async function createQuickCheckIn(
  input: QuickCheckInInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const placement = await prisma.placement.findUnique({
      where: { id: input.placementId },
      select: { residentId: true, status: true },
    })

    if (!placement) {
      return { success: false, error: 'Platzierung nicht gefunden' }
    }

    if (placement.status !== 'ACTIVE') {
      return { success: false, error: 'Platzierung ist nicht aktiv' }
    }

    // Validate satisfaction score
    if (input.overallSatisfaction < 1 || input.overallSatisfaction > 5) {
      return { success: false, error: 'Ungültiger Zufriedenheitswert' }
    }

    const checkIn = await prisma.satisfactionCheckIn.create({
      data: {
        placementId: input.placementId,
        checkInType: input.checkInType,
        weekNumber: input.weekNumber,
        overallSatisfaction: input.overallSatisfaction,
        roommateRelations: input.roommateRelations ?? null,
        concerns: input.concerns || null,
        // Quick check-ins don't collect these - use full form for detailed data
        facilitySatisfaction: null,
        safetyFeeling: null,
        improvements: null,
        positives: null,
        collectedBy: null,
        isAnonymous: false,
      },
    })

    // Update placement satisfaction rating with latest overall
    await prisma.placement.update({
      where: { id: input.placementId },
      data: {
        satisfactionRating: input.overallSatisfaction,
      },
    })

    await logAudit({
      action: 'CREATE',
      entity: 'CHECK_IN',
      entityId: checkIn.id,
      changes: {
        type: 'QUICK',
        placementId: input.placementId,
        overallSatisfaction: input.overallSatisfaction,
        roommateRelations: input.roommateRelations,
        hasConcerns: !!input.concerns,
      },
    })

    revalidatePath('/placements')
    revalidatePath('/residents')
    revalidatePath(`/residents/${placement.residentId}`)

    return { success: true }
  } catch (error) {
    logger.errorWithCause('Quick check-in failed', error)
    return { success: false, error: 'Fehler beim Speichern' }
  }
}

export async function getPlacementCheckIns(placementId: string) {
  return prisma.satisfactionCheckIn.findMany({
    where: { placementId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getPlacementSatisfactionTrend(placementId: string) {
  const checkIns = await prisma.satisfactionCheckIn.findMany({
    where: { placementId },
    orderBy: { createdAt: 'asc' },
    select: {
      createdAt: true,
      weekNumber: true,
      overallSatisfaction: true,
      roommateRelations: true,
    },
  })

  return checkIns.map((c) => ({
    date: c.createdAt,
    week: c.weekNumber,
    overall: c.overallSatisfaction,
    roommates: c.roommateRelations,
  }))
}
