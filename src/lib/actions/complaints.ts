'use server'

import { revalidatePath } from 'next/cache'
import { db, complaint } from '@/lib/db'
import { eq } from 'drizzle-orm'
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
    const [updated] = await db
      .update(complaint)
      .set({
        response,
        respondedAt: new Date(),
        respondedByUserId: user.id,
        status: 'ANSWERED',
      })
      .where(eq(complaint.id, complaintId))
      .returning({ id: complaint.id })
    // Prisma's update threw on a missing row; keep that path so a bad id still
    // surfaces as SAVE_ERROR instead of a silent no-op.
    if (!updated) throw new Error('Complaint not found')
  } catch (error) {
    // The complaint body and the answer are both about a person's treatment.
    // Neither goes to the logger.
    logger.errorWithCause('Failed to record complaint response', error, { complaintId })
    throw new Error(ERROR_MESSAGES.SAVE_ERROR)
  }

  revalidatePath('/complaints')
  revalidatePath('/portal')
}
