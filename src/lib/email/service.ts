/**
 * Email sending service — transport is @bitbaum/mail-kit (Resend).
 * Gracefully no-ops when mail is not configured.
 */

import { sendMail } from '@bitbaum/mail-kit'

import { EMAIL_CONFIG } from './config'
import { logger } from '@/lib/logger'

// Retry transient failures (5xx, 429, network) with linear backoff — mail-kit's
// `retryable` flag says whether a retry can help; scheduling one is our job.
const RETRY_DELAYS_MS = [0, 1000, 4000]

async function sleep(ms: number): Promise<void> {
  if (ms === 0) return
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function sendEmail(to: string[], subject: string, html: string): Promise<boolean> {
  if (!EMAIL_CONFIG.enabled) {
    logger.info('Email skipped (mail not configured)', { subject })
    return false
  }

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    await sleep(RETRY_DELAYS_MS[attempt])

    // sendMail never throws — inspect result.sent.
    const result = await sendMail({ to, subject, html, from: EMAIL_CONFIG.from })
    if (result.sent) return true

    if (!result.retryable || attempt === RETRY_DELAYS_MS.length - 1) {
      logger.error('Resend email failed', {
        error: result.error,
        status: result.status,
        subject,
        attempt,
      })
      return false
    }
  }
  return false
}

export async function notifyStaff(subject: string, html: string): Promise<boolean> {
  if (EMAIL_CONFIG.staffRecipients.length === 0) {
    logger.info('Staff notification skipped (no STAFF_EMAIL_RECIPIENTS configured)', { subject })
    return false
  }
  return sendEmail(EMAIL_CONFIG.staffRecipients, subject, html)
}
