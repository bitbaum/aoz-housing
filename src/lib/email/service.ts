/**
 * Email sending service — wraps Resend client.
 * Gracefully no-ops when API key or recipients are not configured.
 */

import { Resend } from 'resend'
import { EMAIL_CONFIG } from './config'
import { logger } from '@/lib/logger'

let resendClient: Resend | null = null

function getClient(): Resend | null {
  if (!EMAIL_CONFIG.enabled) return null
  if (!resendClient) {
    resendClient = new Resend(EMAIL_CONFIG.apiKey)
  }
  return resendClient
}

export async function sendEmail(to: string[], subject: string, html: string): Promise<boolean> {
  const client = getClient()
  if (!client) {
    logger.info('Email skipped (no API key configured)', { subject })
    return false
  }

  try {
    await client.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject,
      html,
    })
    return true
  } catch (error) {
    logger.errorWithCause('Failed to send email', error, { subject, to })
    return false
  }
}

export async function notifyStaff(subject: string, html: string): Promise<boolean> {
  if (EMAIL_CONFIG.staffRecipients.length === 0) {
    logger.info('Staff notification skipped (no recipients configured)', { subject })
    return false
  }
  return sendEmail(EMAIL_CONFIG.staffRecipients, subject, html)
}
