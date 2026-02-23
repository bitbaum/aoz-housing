/**
 * Email configuration — reads from environment variables.
 * Gracefully disabled when RESEND_API_KEY is not set.
 */

export const EMAIL_CONFIG = {
  apiKey: process.env.RESEND_API_KEY || '',
  from: process.env.EMAIL_FROM || 'AOZ Housing <noreply@aoz-housing.ch>',
  staffRecipients: (process.env.STAFF_EMAIL_RECIPIENTS || '').split(',').filter(Boolean),
  enabled: !!process.env.RESEND_API_KEY,
}
