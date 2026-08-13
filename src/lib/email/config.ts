/**
 * Email configuration — reads from environment variables.
 * Uses Resend (the fleet's transactional email provider).
 * Gracefully disabled when RESEND_API_KEY is not set — but flows that
 * DEPEND on delivery (password reset) must check `enabled` and refuse
 * loudly instead of pretending to send.
 */
import { BRAND } from '@/lib/config/brand'

export const EMAIL_CONFIG = {
  apiKey: process.env.RESEND_API_KEY || '',
  fromName: process.env.EMAIL_FROM_NAME || BRAND.productName,
  // Default sender is on the fleet's verified Resend domain.
  fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@fleetcrown.orangecat.ch',
  staffRecipients: (process.env.STAFF_EMAIL_RECIPIENTS || '').split(',').filter(Boolean),
  enabled: !!process.env.RESEND_API_KEY,
}
