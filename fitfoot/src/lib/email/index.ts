/**
 * Email — the evig-style seam: templates are functions returning
 * { subject, html, text }, sendEmail NEVER throws (callers log and continue;
 * an order must succeed even if the confirmation mail does not).
 *
 * No transport is configured yet: without EMAIL_ENABLED=true this logs and
 * no-ops, so the whole app works locally with zero email credentials.
 * Plug in nodemailer/Resend here when the deployment gets credentials.
 */
import { logger } from '@/lib/logger'
import { SITE } from '@/config/site'
import { formatRappen } from '@/lib/money'

export interface EmailContent {
  subject: string
  html: string
  text: string
}

export const emailTemplates = {
  orderConfirmation(orderNumber: string, totalRappen: number): EmailContent {
    const total = formatRappen(totalRappen)
    return {
      subject: `Your ${SITE.name} order ${orderNumber}`,
      text: `Thank you for your order ${orderNumber}!\n\nTotal: ${total}\n\nWe'll email you again as soon as it ships.\n\n${SITE.name} · ${SITE.contactEmail}`,
      html: `<h1>Thank you for your order!</h1><p>Order <strong>${orderNumber}</strong> — total <strong>${total}</strong>.</p><p>We'll email you again as soon as it ships.</p><p>${SITE.name} · ${SITE.contactEmail}</p>`,
    }
  },
  orderShipped(orderNumber: string): EmailContent {
    return {
      subject: `Your ${SITE.name} order ${orderNumber} is on its way`,
      text: `Good news — order ${orderNumber} has shipped!\n\n${SITE.name} · ${SITE.contactEmail}`,
      html: `<h1>On its way!</h1><p>Order <strong>${orderNumber}</strong> has shipped.</p><p>${SITE.name} · ${SITE.contactEmail}</p>`,
    }
  },
  passwordReset(resetUrl: string): EmailContent {
    return {
      subject: `Reset your ${SITE.name} password`,
      text: `Click the link below to choose a new password. This link works once and expires in 1 hour.\n\n${resetUrl}\n\nIf you didn't ask for this, you can ignore this email — your password won't change.\n\n${SITE.name} · ${SITE.contactEmail}`,
      html: `<h1>Reset your password</h1><p><a href="${resetUrl}">Click here to choose a new password</a>. This link works once and expires in 1 hour.</p><p>If you didn't ask for this, you can ignore this email — your password won't change.</p><p>${SITE.name} · ${SITE.contactEmail}</p>`,
    }
  },
} as const

export interface SendEmailResult {
  success: boolean
  error?: string
}

export async function sendEmail<K extends keyof typeof emailTemplates>(
  to: string,
  template: K,
  ...args: Parameters<(typeof emailTemplates)[K]>
): Promise<SendEmailResult> {
  try {
    const templateFn = emailTemplates[template] as (...a: unknown[]) => EmailContent
    const content = templateFn(...args)
    if (process.env.EMAIL_ENABLED !== 'true') {
      logger.info('Email suppressed (EMAIL_ENABLED not set)', { to, template, subject: content.subject })
      return { success: true }
    }
    // Transport goes here (nodemailer / Resend) once credentials exist.
    logger.warn('EMAIL_ENABLED=true but no transport is configured', { to, template })
    return { success: false, error: 'No email transport configured' }
  } catch (error) {
    logger.error('sendEmail failed', { to, template, error: String(error) })
    return { success: false, error: String(error) }
  }
}
