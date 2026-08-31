'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { requireStaffAuth } from '@/lib/auth'
import type { ReviewTransferRequestInput } from '@/lib/validation/transfer'
import { RESIDENT_NAME_SELECT } from '@/lib/utils/resident-name'

export async function getTransferRequests(status?: string) {
  await requireStaffAuth()
  const where = status
    ? { status: status as 'PENDING' | 'APPROVED' | 'DENIED' | 'COMPLETED' | 'CANCELLED' }
    : {}

  return prisma.transferRequest.findMany({
    where,
    include: {
      resident: { select: { ...RESIDENT_NAME_SELECT, supportLevel: true } },
      currentPlacement: {
        select: {
          id: true,
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
  decision: 'APPROVED' | 'DENIED',
): Promise<{ success: boolean; error?: string }> {
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
          ? 'Anfrage wurde bereits bearbeitet'
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
    return { success: true }
  } catch (error) {
    logger.errorWithCause(`Failed to ${decision.toLowerCase()} transfer request`, error, {
      requestId: input.requestId,
    })
    return { success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_REVIEW_ERROR }
  }
}

export async function approveTransferRequest(input: ReviewTransferRequestInput) {
  return reviewTransferRequest(input, 'APPROVED')
}

export async function denyTransferRequest(input: ReviewTransferRequestInput) {
  return reviewTransferRequest(input, 'DENIED')
}
