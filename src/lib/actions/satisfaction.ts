'use server'

import { db, placement as placementTable, satisfactionCheckIn } from '@/lib/db'
import { eq, asc, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { validateFormData, SatisfactionCheckInInputSchema } from '@/lib/validation'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { requirePermission } from '@/lib/auth'
import { weeksBetween } from '@/lib/utils'

export async function createCheckInFromForm(formData: FormData): Promise<void> {
  const user = await requirePermission('residents:write')
  const data = validateFormData(SatisfactionCheckInInputSchema, formData)

  const placement = await db.query.placement.findFirst({
    where: eq(placementTable.id, data.placementId),
    columns: { residentId: true, startDate: true },
  })

  if (!placement) {
    throw new Error(ERROR_MESSAGES.PLACEMENT_NOT_FOUND)
  }

  try {
    // Calculate week number since placement start
    const weeksSinceStart = weeksBetween(placement.startDate)

    // Wrap both writes in a transaction so a partial failure can't leave
    // the placement's cached rating out of sync with its check-in history.
    const checkIn = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(satisfactionCheckIn)
        .values({
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
          // Prose the caseworker typed, and the account that submitted it.
          // Two fields because they answer different questions: the form lets
          // someone record that a colleague or a team collected the answer,
          // which is not the same fact as who was signed in.
          collectedBy: data.collectedBy || null,
          collectedByUserId: user.id,
          isAnonymous: data.isAnonymous ?? false,
        })
        .returning()

      // Update placement satisfaction rating with latest overall
      await tx
        .update(placementTable)
        .set({
          satisfactionRating: data.overallSatisfaction,
        })
        .where(eq(placementTable.id, data.placementId))

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

/*
 * `createQuickCheckIn` lived here: a one-call check-in used by two always-on
 * staff widgets — an emoji strip on the client page and another in every row
 * of the placements table. Both let a caseworker record how a resident felt
 * without having spoken to them, and both auto-submitted the happy end of the
 * scale while only routing 1-3 to a real form, which biased the input toward
 * pleasant answers.
 *
 * Recording a reading now happens where a conversation happened: closing an
 * appointment (lib/actions/care.ts) or the full form below. Deleted rather
 * than left unused, so nothing can quietly mount it again.
 */

export async function getPlacementCheckIns(placementId: string) {
  await requirePermission('residents:read')
  return db.query.satisfactionCheckIn.findMany({
    where: eq(satisfactionCheckIn.placementId, placementId),
    orderBy: [desc(satisfactionCheckIn.createdAt)],
  })
}

export async function getPlacementSatisfactionTrend(placementId: string) {
  await requirePermission('residents:read')
  const checkIns = await db.query.satisfactionCheckIn.findMany({
    where: eq(satisfactionCheckIn.placementId, placementId),
    orderBy: [asc(satisfactionCheckIn.createdAt)],
    columns: {
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
