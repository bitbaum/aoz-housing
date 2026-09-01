'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

/**
 * Answering a complaint.
 *
 * `complaints:respond`, which no care role holds and `ALL_DOMAINS` does not
 * widen into — see role-policy.ts. A complaint about the Betreuung answered by
 * the Betreuung is not an answer.
 */
export async function respondToComplaint(formData: FormData): Promise<void> {
  const user = await requirePermission('complaints:respond')

  const complaintId = String(formData.get('complaintId') || '')
  const response = String(formData.get('response') || '').trim()

  if (!complaintId || response.length < 2) {
    throw new Error(ERROR_MESSAGES.INVALID_REQUEST)
  }

  try {
    await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        response,
        respondedAt: new Date(),
        respondedByUserId: user.id,
        status: 'ANSWERED',
      },
    })
  } catch (error) {
    // The complaint body and the answer are both about a person's treatment.
    // Neither goes to the logger.
    logger.errorWithCause('Failed to record complaint response', error, { complaintId })
    throw new Error(ERROR_MESSAGES.SAVE_ERROR)
  }

  revalidatePath('/complaints')
  revalidatePath('/portal')
}
