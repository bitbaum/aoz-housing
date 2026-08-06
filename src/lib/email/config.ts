/**
 * Email configuration — reads from environment variables.
 * Uses Brevo (formerly Sendinblue) for transactional email.
 * Gracefully disabled when BREVO_API_KEY is not set.
 */
import { BRAND } from '@/lib/config/brand'

export const EMAIL_CONFIG = {
  apiKey: process.env.BREVO_API_KEY || '',
  fromName: process.env.EMAIL_FROM_NAME || `${BRAND.shortName} Housing`,
  fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@aoz-housing.ch',
  staffRecipients: (process.env.STAFF_EMAIL_RECIPIENTS || '').split(',').filter(Boolean),
  enabled: !!process.env.BREVO_API_KEY,
}
