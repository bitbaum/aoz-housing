'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import type { CheckInType } from '@prisma/client'

interface CreateCheckInData {
  placementId: string
  checkInType: CheckInType
  overallSatisfaction: number
  roommateRelations?: number
  facilitySatisfaction?: number
  safetyFeeling?: number
  concerns?: string
  improvements?: string
  positives?: string
  collectedBy?: string
  isAnonymous?: boolean
}

export async function createSatisfactionCheckIn(data: CreateCheckInData) {
  const placement = await prisma.placement.findUnique({
    where: { id: data.placementId },
  })

  if (!placement) {
    throw new Error('Placement not found')
  }

  // Calculate week number since placement start
  const weeksSinceStart = Math.floor(
    (Date.now() - new Date(placement.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)
  )

  const checkIn = await prisma.satisfactionCheckIn.create({
    data: {
      placementId: data.placementId,
      checkInType: data.checkInType,
      weekNumber: weeksSinceStart,
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

  revalidatePath('/placements')
  revalidatePath(`/residents`)

  return checkIn
}

export async function createCheckInFromForm(formData: FormData) {
  const placementId = formData.get('placementId') as string
  const checkInType = formData.get('checkInType') as CheckInType
  const overallSatisfaction = parseInt(formData.get('overallSatisfaction') as string)
  const roommateRelations = formData.get('roommateRelations')
    ? parseInt(formData.get('roommateRelations') as string)
    : undefined
  const facilitySatisfaction = formData.get('facilitySatisfaction')
    ? parseInt(formData.get('facilitySatisfaction') as string)
    : undefined
  const safetyFeeling = formData.get('safetyFeeling')
    ? parseInt(formData.get('safetyFeeling') as string)
    : undefined
  const concerns = formData.get('concerns') as string
  const improvements = formData.get('improvements') as string
  const positives = formData.get('positives') as string
  const collectedBy = formData.get('collectedBy') as string
  const isAnonymous = formData.get('isAnonymous') === 'true'

  return createSatisfactionCheckIn({
    placementId,
    checkInType,
    overallSatisfaction,
    roommateRelations,
    facilitySatisfaction,
    safetyFeeling,
    concerns,
    improvements,
    positives,
    collectedBy,
    isAnonymous,
  })
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
