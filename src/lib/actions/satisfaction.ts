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
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { requirePermission } from '@/lib/auth'
import { weeksBetween } from '@/lib/utils'

export async function createCheckInFromForm(formData: FormData): Promise<void> {
  const user = await requirePermission('residents:write')
  const data = validateFormData(SatisfactionCheckInInputSchema, formData)

  const placement = await prisma.placement.findUnique({
    where: { id: data.placementId },
    select: { residentId: true, startDate: true },
  })

  if (!placement) {
    throw new Error(ERROR_MESSAGES.PLACEMENT_NOT_FOUND)
  }

  try {
    // Calculate week number since placement start
    const weeksSinceStart = weeksBetween(placement.startDate)

    // Wrap both writes in a transaction so a partial failure can't leave
    // the placement's cached rating out of sync with its check-in history.
    const checkIn = await prisma.$transaction(async (tx) => {
      const created = await tx.satisfactionCheckIn.create({
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
      await tx.placement.update({
        where: { id: data.placementId },
        data: {
          satisfactionRating: data.overallSatisfaction,
        },
      })

      return created
    })

    await logAudit({
      action: 'CREATE',
      entity: 'CHECK_IN',
      entityId: checkIn.id,
      userId: user.id,
      changes: {
        placementId: data.placementId,
        checkInType: data.checkInType,
        overallSatisfaction: data.overallSatisfaction,
        hasConcerns: !!data.concerns,
      },
    })
  } catch (error) {
    logger.errorWithCause('Failed to create check-in', error, { placementId: data.placementId })
    throw new Error(ERROR_MESSAGES.CHECKIN_SAVE_ERROR)
  }

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
  const user = await requirePermission('residents:write')
  try {
    const placement = await prisma.placement.findUnique({
      where: { id: input.placementId },
      select: { residentId: true, status: true },
    })

    if (!placement) {
      return { success: false, error: ERROR_MESSAGES.PLACEMENT_NOT_FOUND }
    }

    if (placement.status !== 'ACTIVE') {
      return { success: false, error: ERROR_MESSAGES.PLACEMENT_NOT_ACTIVE }
    }

    // Validate satisfaction score
    if (input.overallSatisfaction < 1 || input.overallSatisfaction > 5) {
      return { success: false, error: ERROR_MESSAGES.INVALID_SATISFACTION_VALUE }
    }

    // Wrap both writes in a transaction so a partial failure can't leave
    // the placement's cached rating out of sync with its check-in history.
    const checkIn = await prisma.$transaction(async (tx) => {
      const created = await tx.satisfactionCheckIn.create({
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
      await tx.placement.update({
        where: { id: input.placementId },
        data: {
          satisfactionRating: input.overallSatisfaction,
        },
      })

      return created
    })

    await logAudit({
      action: 'CREATE',
      entity: 'CHECK_IN',
      entityId: checkIn.id,
      userId: user.id,
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
    return { success: false, error: ERROR_MESSAGES.SAVE_ERROR }
  }
}

export async function getPlacementCheckIns(placementId: string) {
  await requirePermission('residents:read')
  return prisma.satisfactionCheckIn.findMany({
    where: { placementId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getPlacementSatisfactionTrend(placementId: string) {
  await requirePermission('residents:read')
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
