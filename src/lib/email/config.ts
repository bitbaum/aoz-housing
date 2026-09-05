/**
 * Email configuration — sender display + staff recipients.
 * Transport config (RESEND_API_KEY / RESEND_FROM) is owned by
 * @bitbaum/mail-kit; `enabled` delegates to its isMailConfigured().
 * Gracefully disabled when mail is not configured — but flows that
 * DEPEND on delivery (password reset) must check `enabled` and refuse
 * loudly instead of pretending to send.
 */
import { conventionalFrom, fromAddress, isMailConfigured } from '@bitbaum/mail-kit'

import { BRAND } from '@/lib/config/brand'

// Sender SSOT is RESEND_FROM (set on the box); fall back to the
// fleet-conventional sender on the verified Resend domain. The brand name
// (not a literal) keeps the org name out of code per the design-system guard.
const from = fromAddress() ?? conventionalFrom(BRAND.productName)
const parsed = from.match(/^(.*?)\s*<([^>]+)>$/)

export const EMAIL_CONFIG = {
  /** Full sender in `Name <addr>` form or a bare address. */
  from,
  // Display-only split for the settings page.
  fromName: parsed?.[1] || BRAND.productName,
  fromAddress: parsed?.[2] ?? from,
  staffRecipients: (process.env.STAFF_EMAIL_RECIPIENTS || '').split(',').filter(Boolean),
  enabled: isMailConfigured(),
}
