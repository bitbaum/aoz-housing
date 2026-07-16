'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { requireStaffAuth } from '@/lib/auth'
import { calculateCompatibility, saveBidirectionalAssessment } from '@/lib/compatibility'
import { toResidentProfile } from '@/lib/compatibility/convert'
import { calculateApartmentProfile, calculateApartmentFit } from '@/lib/compatibility/aggregate'
import { calculateAverageScores } from '@/lib/compatibility/placement-scores'
import type { ReviewTransferRequestInput } from '@/lib/validation/transfer'

export interface ReviewTransferResult {
  success: boolean
  /** true when the approval also executed the move into the target unit */
  executed?: boolean
  error?: string
}

export async function getTransferRequests(status?: string) {
  await requireStaffAuth()
  const where = status ? { status: status as 'PENDING' | 'APPROVED' | 'DENIED' | 'COMPLETED' | 'CANCELLED' } : {}

  return prisma.transferRequest.findMany({
    where,
    include: {
      resident: { select: { id: true, code: true, supportLevel: true } },
      currentPlacement: {
        select: {
          id: true,
          status: true,
          housingUnit: { select: { id: true, code: true, address: true } },
        },
      },
      targetUnit: { select: { id: true, code: true, address: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

async function reviewTransferRequest(
  input: ReviewTransferRequestInput,
  decision: 'APPROVED' | 'DENIED'
): Promise<ReviewTransferResult> {
  const user = await requireStaffAuth()

  try {
    // Atomic guard: only PENDING rows are eligible. Prevents two staff members
    // concurrently approving + denying (or both approving) the same request.
    const result = await prisma.transferRequest.updateMany({
      where: { id: input.requestId, status: 'PENDING' },
      data: {
        status: decision,
        staffNotes: input.staffNotes,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
    })

    if (result.count === 0) {
      const exists = await prisma.transferRequest.findUnique({
        where: { id: input.requestId },
        select: { id: true },
      })
      return {
        success: false,
        error: exists
          ? ERROR_MESSAGES.TRANSFER_ALREADY_PROCESSED
          : ERROR_MESSAGES.TRANSFER_REQUEST_NOT_FOUND,
      }
    }

    await logAudit({
      action: 'UPDATE',
      entity: 'TRANSFER_REQUEST',
      entityId: input.requestId,
      userId: user.id,
      changes: { status: decision, staffNotes: input.staffNotes },
    })

    revalidatePath('/transfer-requests')
    return { success: true, executed: false }
  } catch (error) {
    logger.errorWithCause(`Failed to ${decision.toLowerCase()} transfer request`, error, {
      requestId: input.requestId,
    })
    return { success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_REVIEW_ERROR }
  }
}

/**
 * Approve a transfer request. When the request names a target unit and the
 * resident still has an active placement, the approval also EXECUTES the move
 * (end old placement, create new one with server-computed scores, update spot
 * and unit statuses) and marks the request COMPLETED — all in one transaction.
 * Without a target unit the request is only marked APPROVED and staff complete
 * the move from the resident page.
 */
export async function approveTransferRequest(input: ReviewTransferRequestInput): Promise<ReviewTransferResult> {
  const user = await requireStaffAuth()

  let request
  try {
    request = await prisma.transferRequest.findUnique({
      where: { id: input.requestId },
      select: { id: true, status: true, residentId: true, targetUnitId: true, currentPlacementId: true },
    })
  } catch (error) {
    logger.errorWithCause('Failed to load transfer request', error, { requestId: input.requestId })
    return { success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_REVIEW_ERROR }
  }

  if (!request) {
    return { success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_NOT_FOUND }
  }
  if (request.status !== 'PENDING') {
    return { success: false, error: ERROR_MESSAGES.TRANSFER_ALREADY_PROCESSED }
  }

  // No target unit named, or no placement context → approve only.
  if (!request.targetUnitId) {
    return reviewTransferRequest(input, 'APPROVED')
  }

  const targetUnitId = request.targetUnitId
  let fromHousingUnitId: string | null = null
  let outcome: 'EXECUTED' | 'APPROVED_ONLY' = 'EXECUTED'
  try {
    outcome = await prisma.$transaction(async (tx) => {
      // Atomic claim: flip PENDING → APPROVED inside the transaction so a
      // concurrent reviewer can't process the same request. Rolls back to
      // PENDING automatically if any later step fails.
      const claimed = await tx.transferRequest.updateMany({
        where: { id: request.id, status: 'PENDING' },
        data: {
          status: 'APPROVED',
          staffNotes: input.staffNotes,
          reviewedBy: user.id,
          reviewedAt: new Date(),
        },
      })
      if (claimed.count === 0) {
        throw new Error(ERROR_MESSAGES.TRANSFER_ALREADY_PROCESSED)
      }

      // Current active placement: the one recorded on the request if it is
      // still active, otherwise whatever active placement the resident has now
      // (they may have been moved since filing).
      const currentPlacement =
        (request.currentPlacementId
          ? await tx.placement.findFirst({
              where: { id: request.currentPlacementId, status: 'ACTIVE' },
            })
          : null) ??
        (await tx.placement.findFirst({
          where: { residentId: request.residentId, status: 'ACTIVE' },
        }))
      if (!currentPlacement) {
        // Resident is no longer placed — nothing to move. Keep the APPROVED
        // claim (commit, don't roll back) so the request isn't stuck PENDING.
        return 'APPROVED_ONLY' as const
      }
      fromHousingUnitId = currentPlacement.housingUnitId

      if (currentPlacement.housingUnitId === targetUnitId) {
        throw new Error(ERROR_MESSAGES.TRANSFER_SAME_UNIT)
      }

      // Free spot in the target unit (ROOM spots are containers, not assignable).
      const targetSpot = await tx.placementSpot.findFirst({
        where: { housingUnitId: targetUnitId, status: 'AVAILABLE', type: { not: 'ROOM' } },
        orderBy: { code: 'asc' },
      })
      if (!targetSpot) {
        throw new Error(ERROR_MESSAGES.TRANSFER_TARGET_NO_SPOT)
      }

      // Server-side blocking-conflict check against the target unit's residents.
      const resident = await tx.resident.findUnique({ where: { id: request.residentId } })
      if (!resident) {
        throw new Error(ERROR_MESSAGES.RESIDENT_NOT_FOUND)
      }
      const targetPlacements = await tx.placement.findMany({
        where: { housingUnitId: targetUnitId, status: 'ACTIVE' },
        include: { resident: true },
      })
      const residentProfile = toResidentProfile(resident)
      const targetProfiles = targetPlacements.map((p) => toResidentProfile(p.resident))
      const apartmentFit = calculateApartmentFit(residentProfile, calculateApartmentProfile(targetProfiles))
      const blocking = apartmentFit.conflicts.filter((c) => c.severity === 'BLOCKING')
      if (blocking.length > 0) {
        throw new Error(`Verlegung blockiert: ${blocking.map((c) => c.message).join('; ')}`)
      }

      // End the old placement as a resident-requested transfer.
      await tx.placement.update({
        where: { id: currentPlacement.id },
        data: {
          status: 'TRANSFERRED',
          endDate: new Date(),
          endReason: 'REQUEST',
          outcomeNotes: input.staffNotes || undefined,
        },
      })
      if (currentPlacement.spotId) {
        await tx.placementSpot.update({
          where: { id: currentPlacement.spotId },
          data: { status: 'AVAILABLE' },
        })
      }

      // Scores + pairwise assessments for the new constellation.
      const { compatibilityScore, lifestyleScore, socialScore, practicalScore, riskScore } =
        calculateAverageScores(resident, targetPlacements)
      for (const existing of targetPlacements) {
        const score = calculateCompatibility(residentProfile, toResidentProfile(existing.resident))
        await saveBidirectionalAssessment(tx, request.residentId, existing.residentId, score)
      }

      await tx.placement.create({
        data: {
          residentId: request.residentId,
          housingUnitId: targetUnitId,
          spotId: targetSpot.id,
          startDate: new Date(),
          status: 'ACTIVE',
          compatibilityScore,
          lifestyleScore,
          socialScore,
          practicalScore,
          riskScore,
          placementNotes: `Verlegung auf Wunsch des Bewohners (Anfrage genehmigt). ${input.staffNotes || ''}`.trim(),
        },
      })
      await tx.placementSpot.update({
        where: { id: targetSpot.id },
        data: { status: 'OCCUPIED' },
      })

      // Unit statuses: old unit may reopen, new unit may fill up.
      const oldUnit = await tx.housingUnit.findUnique({ where: { id: currentPlacement.housingUnitId } })
      if (oldUnit?.status === 'FULL') {
        await tx.housingUnit.update({
          where: { id: currentPlacement.housingUnitId },
          data: { status: 'AVAILABLE' },
        })
      }
      const newUnit = await tx.housingUnit.findUnique({
        where: { id: targetUnitId },
        include: { spots: { where: { status: 'AVAILABLE', type: { not: 'ROOM' } } } },
      })
      if (newUnit && newUnit.spots.length === 0) {
        await tx.housingUnit.update({
          where: { id: targetUnitId },
          data: { status: 'FULL' },
        })
      }

      // The move happened — the request is done, not merely approved.
      await tx.transferRequest.update({
        where: { id: request.id },
        data: { status: 'COMPLETED' },
      })
      return 'EXECUTED' as const
    })
  } catch (error) {
    const knownMessages = [
      ERROR_MESSAGES.TRANSFER_ALREADY_PROCESSED,
      ERROR_MESSAGES.TRANSFER_SAME_UNIT,
      ERROR_MESSAGES.TRANSFER_TARGET_NO_SPOT,
      ERROR_MESSAGES.RESIDENT_NOT_FOUND,
      'Verlegung blockiert',
    ]
    if (error instanceof Error && knownMessages.some((m) => error.message.includes(m))) {
      return { success: false, error: error.message }
    }
    logger.errorWithCause('Failed to execute approved transfer', error, {
      requestId: input.requestId,
      targetUnitId,
    })
    return { success: false, error: ERROR_MESSAGES.TRANSFER_ERROR }
  }

  if (outcome === 'APPROVED_ONLY') {
    await logAudit({
      action: 'UPDATE',
      entity: 'TRANSFER_REQUEST',
      entityId: request.id,
      userId: user.id,
      changes: { status: 'APPROVED', staffNotes: input.staffNotes },
    })
    revalidatePath('/transfer-requests')
    return { success: true, executed: false }
  }

  await logAudit({
    action: 'TRANSFER',
    entity: 'TRANSFER_REQUEST',
    entityId: request.id,
    userId: user.id,
    changes: {
      status: 'COMPLETED',
      residentId: request.residentId,
      fromHousingUnitId,
      toHousingUnitId: targetUnitId,
      staffNotes: input.staffNotes,
    },
  })

  revalidatePath('/transfer-requests')
  revalidatePath(`/residents/${request.residentId}`)
  revalidatePath('/placements')
  if (fromHousingUnitId) revalidatePath(`/housing/${fromHousingUnitId}`)
  revalidatePath(`/housing/${targetUnitId}`)

  return { success: true, executed: true }
}

export async function denyTransferRequest(input: ReviewTransferRequestInput): Promise<ReviewTransferResult> {
  return reviewTransferRequest(input, 'DENIED')
}
