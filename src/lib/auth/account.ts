/**
 * Account flows: register with your code, log in with email + password,
 * recover a forgotten password.
 *
 * The code stays the root identity — staff codes and resident codes keep
 * working forever. An account is email + password ON TOP of that identity:
 * registering means claiming your code with credentials you choose. Nothing
 * here creates identities; provisioning (staff invites, resident intake)
 * stays where it is.
 *
 * One email namespace across BOTH identity tables: an email identifies at
 * most one identity, so email login never has to guess who you are.
 */

import { ALL_CODE_PREFIXES } from '@/lib/config/brand'
import { RESIDENT_CODE_PREFIX } from '@/lib/auth/code-prefixes'
import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword } from './passwords'
import { createAuthToken, consumeAuthToken } from './tokens'
import { sendEmail } from '@/lib/email/service'
import { verifyEmailEmail, passwordResetEmail } from '@/lib/email/templates'
import { EMAIL_CONFIG } from '@/lib/email/config'
import { getAppUrl } from '@/lib/config/app-url'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { logger } from '@/lib/logger'

export type AccountIdentity =
  | { type: 'staff'; id: string; code: string; name: string; email: string; role: 'ADMIN' }
  | { type: 'resident'; id: string; code: string }

export type AccountResult =
  | { success: true; identity: AccountIdentity }
  | { success: false; error: string }

/** Find whichever identity (staff first, then resident) owns this email. */
async function findByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, code: true, name: true, email: true, role: true, active: true, passwordHash: true },
  })
  if (user) return { kind: 'staff' as const, user }

  const resident = await prisma.resident.findUnique({
    where: { email },
    select: { id: true, code: true, passwordHash: true },
  })
  if (resident) return { kind: 'resident' as const, resident }

  return null
}

/** True when the email belongs to any identity other than the given one. */
async function emailTakenByOther(
  email: string,
  self: { kind: 'staff' | 'resident'; id: string }
): Promise<boolean> {
  const owner = await findByEmail(email)
  if (!owner) return false
  if (owner.kind === 'staff') return !(self.kind === 'staff' && owner.user.id === self.id)
  return !(self.kind === 'resident' && owner.resident.id === self.id)
}

/** Fire-and-forget verification email; registration must not fail on it. */
async function sendVerificationEmail(
  identity: { userId: string } | { residentId: string },
  email: string
): Promise<void> {
  try {
    const raw = await createAuthToken(identity, 'VERIFY_EMAIL')
    const { subject, html } = verifyEmailEmail({
      link: `${getAppUrl()}/api/auth/verify-email?token=${raw}`,
    })
    await sendEmail([email], subject, html)
  } catch (error) {
    logger.errorWithCause('Verification email failed', error)
  }
}

/**
 * Claim a code with email + password. The code must exist and must not
 * already carry credentials (that account should use password reset).
 */
export async function registerAccount(input: {
  code: string
  email: string
  password: string
}): Promise<AccountResult> {
  const { code, email, password } = input

  if (ALL_CODE_PREFIXES.some((prefix) => code.startsWith(prefix))) {
    const user = await prisma.user.findUnique({
      where: { code },
      select: { id: true, code: true, name: true, role: true, active: true, passwordHash: true },
    })
    if (!user || !user.active) return { success: false, error: ERROR_MESSAGES.AUTH_CODE_UNKNOWN }
    if (user.passwordHash) return { success: false, error: ERROR_MESSAGES.AUTH_ALREADY_REGISTERED }
    if (await emailTakenByOther(email, { kind: 'staff', id: user.id })) {
      return { success: false, error: ERROR_MESSAGES.AUTH_EMAIL_TAKEN }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { email, passwordHash: await hashPassword(password), lastLoginAt: new Date() },
    })
    await sendVerificationEmail({ userId: user.id }, email)

    return {
      success: true,
      identity: { type: 'staff', id: user.id, code: user.code, name: user.name, email, role: user.role },
    }
  }

  if (code.startsWith(RESIDENT_CODE_PREFIX)) {
    const resident = await prisma.resident.findUnique({
      where: { code },
      select: { id: true, code: true, passwordHash: true },
    })
    if (!resident) return { success: false, error: ERROR_MESSAGES.AUTH_CODE_UNKNOWN }
    if (resident.passwordHash) {
      return { success: false, error: ERROR_MESSAGES.AUTH_ALREADY_REGISTERED }
    }
    if (await emailTakenByOther(email, { kind: 'resident', id: resident.id })) {
      return { success: false, error: ERROR_MESSAGES.AUTH_EMAIL_TAKEN }
    }

    await prisma.resident.update({
      where: { id: resident.id },
      data: { email, passwordHash: await hashPassword(password) },
    })
    await sendVerificationEmail({ residentId: resident.id }, email)

    return { success: true, identity: { type: 'resident', id: resident.id, code: resident.code } }
  }

  return { success: false, error: ERROR_MESSAGES.AUTH_CODE_UNKNOWN }
}

/**
 * Email + password login. One generic failure message for every wrong path
 * (unknown email, no password set, wrong password, deactivated) — anything
 * more specific is an account-enumeration oracle.
 */
export async function loginWithEmail(input: {
  email: string
  password: string
}): Promise<AccountResult> {
  const failure = { success: false as const, error: ERROR_MESSAGES.INVALID_CREDENTIALS }

  const owner = await findByEmail(input.email)
  if (!owner) return failure

  if (owner.kind === 'staff') {
    const { user } = owner
    if (!user.active || !user.passwordHash) return failure
    if (!(await verifyPassword(input.password, user.passwordHash))) return failure

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    return {
      success: true,
      identity: {
        type: 'staff',
        id: user.id,
        code: user.code,
        name: user.name,
        email: user.email || '',
        role: user.role,
      },
    }
  }

  const { resident } = owner
  if (!resident.passwordHash) return failure
  if (!(await verifyPassword(input.password, resident.passwordHash))) return failure

  return { success: true, identity: { type: 'resident', id: resident.id, code: resident.code } }
}

/**
 * Password reset, step 1. Returns success for ANY email (no enumeration) —
 * except when this deployment cannot send email at all: pretending to send
 * a reset link that will never arrive is a silent lockout, so that case is
 * a loud, explicit error.
 */
export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string }> {
  if (!EMAIL_CONFIG.enabled) {
    return { success: false, error: ERROR_MESSAGES.AUTH_EMAIL_NOT_CONFIGURED }
  }

  const owner = await findByEmail(email)
  if (owner) {
    const identity =
      owner.kind === 'staff' ? { userId: owner.user.id } : { residentId: owner.resident.id }
    const raw = await createAuthToken(identity, 'RESET_PASSWORD')
    const { subject, html } = passwordResetEmail({
      link: `${getAppUrl()}/reset-password?token=${raw}`,
    })
    await sendEmail([email], subject, html)
  }

  return { success: true }
}

/**
 * Password reset, step 2. Consuming the token proves mailbox control, which
 * also verifies the email — and lets a code-only account with a known email
 * (like the seeded admin) BOOTSTRAP its first password through this flow.
 */
export async function resetPassword(
  rawToken: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const identity = await consumeAuthToken(rawToken, 'RESET_PASSWORD')
  if (!identity) return { success: false, error: ERROR_MESSAGES.AUTH_RESET_TOKEN_INVALID }

  const passwordHash = await hashPassword(newPassword)
  const verifiedNow = { emailVerifiedAt: new Date() }

  if ('userId' in identity) {
    await prisma.user.update({
      where: { id: identity.userId },
      data: { passwordHash, ...verifiedNow },
    })
  } else {
    await prisma.resident.update({
      where: { id: identity.residentId },
      data: { passwordHash, ...verifiedNow },
    })
  }

  return { success: true }
}

/** Email verification link handler. */
export async function verifyEmailToken(rawToken: string): Promise<boolean> {
  const identity = await consumeAuthToken(rawToken, 'VERIFY_EMAIL')
  if (!identity) return false

  if ('userId' in identity) {
    await prisma.user.update({
      where: { id: identity.userId },
      data: { emailVerifiedAt: new Date() },
    })
  } else {
    await prisma.resident.update({
      where: { id: identity.residentId },
      data: { emailVerifiedAt: new Date() },
    })
  }
  return true
}
