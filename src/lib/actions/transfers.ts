'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { requireStaffAuth } from '@/lib/auth'
import type { ReviewTransferRequestInput } from '@/lib/validation/transfer'

export async function getTransferRequests(status?: string) {
  const where = status ? { status: status as 'PENDING' | 'APPROVED' | 'DENIED' | 'COMPLETED' | 'CANCELLED' } : {}

  return prisma.transferRequest.findMany({
    where,
    include: {
      resident: { select: { id: true, code: true, supportLevel: true } },
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

export async function approveTransferRequest(
  input: ReviewTransferRequestInput
): Promise<{ success: boolean; error?: string }> {
  const user = await requireStaffAuth()

  try {
    const request = await prisma.transferRequest.findUnique({
      where: { id: input.requestId },
    })

    if (!request) {
      return { success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_NOT_FOUND }
    }

    if (request.status !== 'PENDING') {
      return { success: false, error: 'Anfrage wurde bereits bearbeitet' }
    }

    await prisma.transferRequest.update({
      where: { id: input.requestId },
      data: {
        status: 'APPROVED',
        staffNotes: input.staffNotes,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
    })

    await logAudit({
      action: 'UPDATE',
      entity: 'TRANSFER_REQUEST',
      entityId: input.requestId,
      userId: user.id,
      changes: { status: 'APPROVED', staffNotes: input.staffNotes },
    })

    revalidatePath('/transfer-requests')
    return { success: true }
  } catch (error) {
    logger.errorWithCause('Failed to approve transfer request', error, { requestId: input.requestId })
    return { success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_REVIEW_ERROR }
  }
}

export async function denyTransferRequest(
  input: ReviewTransferRequestInput
): Promise<{ success: boolean; error?: string }> {
  const user = await requireStaffAuth()

  try {
    const request = await prisma.transferRequest.findUnique({
      where: { id: input.requestId },
    })

    if (!request) {
      return { success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_NOT_FOUND }
    }

    if (request.status !== 'PENDING') {
      return { success: false, error: 'Anfrage wurde bereits bearbeitet' }
    }

    await prisma.transferRequest.update({
      where: { id: input.requestId },
      data: {
        status: 'DENIED',
        staffNotes: input.staffNotes,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
    })

    await logAudit({
      action: 'UPDATE',
      entity: 'TRANSFER_REQUEST',
      entityId: input.requestId,
      userId: user.id,
      changes: { status: 'DENIED', staffNotes: input.staffNotes },
    })

    revalidatePath('/transfer-requests')
    return { success: true }
  } catch (error) {
    logger.errorWithCause('Failed to deny transfer request', error, { requestId: input.requestId })
    return { success: false, error: ERROR_MESSAGES.TRANSFER_REQUEST_REVIEW_ERROR }
  }
}
