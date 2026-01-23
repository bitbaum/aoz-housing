'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  validateFormData,
  SatisfactionCheckInInputSchema,
} from '@/lib/validation'
import { logAudit } from '@/lib/audit'

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
  redirect(`/residents/${placement.residentId}`)
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
