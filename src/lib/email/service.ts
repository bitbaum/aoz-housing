/**
 * Email sending service — uses Brevo (formerly Sendinblue) transactional API.
 * Gracefully no-ops when BREVO_API_KEY is not configured.
 */

import { EMAIL_CONFIG } from './config'
import { logger } from '@/lib/logger'

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

// Retry transient Brevo failures (5xx, 429) with linear backoff. 4xx other
// than 429 are not retried — those are programming errors.
const RETRY_DELAYS_MS = [0, 1000, 4000]

async function sleep(ms: number): Promise<void> {
  if (ms === 0) return
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function sendEmail(to: string[], subject: string, html: string): Promise<boolean> {
  if (!EMAIL_CONFIG.enabled) {
    logger.info('Email skipped (no BREVO_API_KEY configured)', { subject })
    return false
  }

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    await sleep(RETRY_DELAYS_MS[attempt])

    try {
      const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'api-key': EMAIL_CONFIG.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: EMAIL_CONFIG.fromName, email: EMAIL_CONFIG.fromAddress },
          to: to.map((email) => ({ email })),
          subject,
          htmlContent: html,
        }),
      })

      if (response.ok) return true

      // Retry on 5xx + 429; bail on other 4xx (client/auth error — no recovery).
      const retryable = response.status >= 500 || response.status === 429
      if (!retryable || attempt === RETRY_DELAYS_MS.length - 1) {
        const body = await response.text()
        logger.error('Brevo email failed', { status: response.status, body, subject, attempt })
        return false
      }
    } catch (error) {
      // Network errors are retryable until the last attempt.
      if (attempt === RETRY_DELAYS_MS.length - 1) {
        logger.errorWithCause('Failed to send email', error, { subject, to, attempt })
        return false
      }
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
