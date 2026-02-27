/**
 * Email sending service — uses Brevo (formerly Sendinblue) transactional API.
 * Gracefully no-ops when BREVO_API_KEY is not configured.
 */

import { EMAIL_CONFIG } from './config'
import { logger } from '@/lib/logger'

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

export async function sendEmail(to: string[], subject: string, html: string): Promise<boolean> {
  if (!EMAIL_CONFIG.enabled) {
    logger.info('Email skipped (no BREVO_API_KEY configured)', { subject })
    return false
  }

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

    if (!response.ok) {
      const body = await response.text()
      logger.error('Brevo email failed', { status: response.status, body, subject })
      return false
    }

    return true
  } catch (error) {
    logger.errorWithCause('Failed to send email', error, { subject, to })
    return false
  }
}

export async function notifyStaff(subject: string, html: string): Promise<boolean> {
  if (EMAIL_CONFIG.staffRecipients.length === 0) {
    logger.info('Staff notification skipped (no STAFF_EMAIL_RECIPIENTS configured)', { subject })
    return false
  }
  return sendEmail(EMAIL_CONFIG.staffRecipients, subject, html)
}
