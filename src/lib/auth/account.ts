/**
 * Accounts: one human, one login, one or two roles.
 *
 * The CODE is the identity — a staff `User` or a `Resident`, each provisioned
 * by the organisation and valid forever. The ACCOUNT is the credentials laid
 * on top: one email, one password.
 *
 * Crucially, an account may carry BOTH identities. The person running a real
 * shared flat is its admin AND one of its flatmates; a caseworker may live in
 * one of the houses. Storing email+password on each identity row forced them
 * to choose, and guaranteed two password hashes for one human that would
 * silently drift apart.
 *
 * Claiming works the same way every time: register with a code. If the email
 * is new, that creates the account. If the email already has an account, the
 * code is LINKED to it — proved by that account's password. So "add my second
 * role" needs no separate flow, no invite, and no admin.
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
import type { StaffRole } from './role-policy'

export interface StaffIdentity {
  id: string
  code: string
  name: string
  email: string
  role: StaffRole
}

export interface ResidentIdentity {
  id: string
  code: string
}

/** Everything this login carries. At least one side is always present. */
export interface AccountIdentities {
  staff?: StaffIdentity
  resident?: ResidentIdentity
}

export type AccountResult =
  | { success: true; identities: AccountIdentities }
  | { success: false; error: string }

const ACCOUNT_WITH_IDENTITIES = {
  id: true,
  email: true,
  passwordHash: true,
  user: { select: { id: true, code: true, name: true, role: true, active: true } },
  resident: { select: { id: true, code: true } },
} as const

type AccountRow = {
  id: string
  email: string
  passwordHash: string | null
  user: { id: string; code: string; name: string; role: StaffRole; active: boolean } | null
  resident: { id: string; code: string } | null
}

/** Shape an account row into the identities a session should carry. */
function toIdentities(account: AccountRow): AccountIdentities {
  const identities: AccountIdentities = {}
  // A deactivated staff identity grants nothing — but must not cost the
  // person their resident access, which is a different role entirely.
  if (account.user?.active) {
    identities.staff = {
      id: account.user.id,
      code: account.user.code,
      name: account.user.name,
      email: account.email,
      role: account.user.role,
    }
  }
  if (account.resident) {
    identities.resident = { id: account.resident.id, code: account.resident.code }
  }
  return identities
}

type CodeIdentity =
  | { kind: 'staff'; id: string; active: boolean }
  | { kind: 'resident'; id: string }

/** Resolve a login code to the identity it names. */
async function findIdentityByCode(code: string): Promise<CodeIdentity | null> {
  if (ALL_CODE_PREFIXES.some((prefix) => code.startsWith(prefix))) {
    const user = await prisma.user.findUnique({
      where: { code },
      select: { id: true, active: true },
    })
    return user ? { kind: 'staff', id: user.id, active: user.active } : null
  }

  if (code.startsWith(RESIDENT_CODE_PREFIX)) {
    const resident = await prisma.resident.findUnique({ where: { code }, select: { id: true } })
    return resident ? { kind: 'resident', id: resident.id } : null
  }

  return null
}

/** Fire-and-forget verification email; claiming must not fail on it. */
async function sendVerificationEmail(accountId: string, email: string): Promise<void> {
  try {
    const raw = await createAuthToken(accountId, 'VERIFY_EMAIL')
    const { subject, html } = verifyEmailEmail({
      link: `${getAppUrl()}/api/auth/verify-email?token=${raw}`,
    })
    await sendEmail([email], subject, html)
  } catch (error) {
    logger.errorWithCause('Verification email failed', error)
  }
}

async function loadAccount(where: { id: string }): Promise<AccountRow> {
  return prisma.account.findUniqueOrThrow({ where, select: ACCOUNT_WITH_IDENTITIES })
}

/**
 * Claim a code with email + password.
 *
 * New email → new account. Known email → the code is LINKED to that account,
 * which is how one login ends up carrying both a staff and a resident role.
 * Linking is authorised by the account's own password, so holding a stray code
 * is not enough to attach yourself to someone else's login.
 */
export async function registerAccount(input: {
  code: string
  email: string
  password: string
}): Promise<AccountResult> {
  const { code, email, password } = input

  const identity = await findIdentityByCode(code)
  if (!identity) return { success: false, error: ERROR_MESSAGES.AUTH_CODE_UNKNOWN }
  if (identity.kind === 'staff' && !identity.active) {
    return { success: false, error: ERROR_MESSAGES.AUTH_CODE_UNKNOWN }
  }

  const identityLink =
    identity.kind === 'staff' ? { userId: identity.id } : { residentId: identity.id }

  const [accountForIdentity, accountForEmail] = await Promise.all([
    prisma.account.findFirst({ where: identityLink, select: ACCOUNT_WITH_IDENTITIES }),
    prisma.account.findUnique({ where: { email }, select: ACCOUNT_WITH_IDENTITIES }),
  ])

  // This code already belongs to a finished account — recover it, don't re-claim.
  if (accountForIdentity?.passwordHash) {
    return { success: false, error: ERROR_MESSAGES.AUTH_ALREADY_REGISTERED }
  }

  if (accountForEmail && accountForIdentity && accountForEmail.id !== accountForIdentity.id) {
    return { success: false, error: ERROR_MESSAGES.AUTH_EMAIL_TAKEN }
  }

  // --- Link this code to the existing account for that email ---
  if (accountForEmail && accountForEmail.id !== accountForIdentity?.id) {
    const occupied = identity.kind === 'staff' ? accountForEmail.user : accountForEmail.resident
    if (occupied) return { success: false, error: ERROR_MESSAGES.AUTH_ROLE_ALREADY_LINKED }

    // A finished account must prove itself before absorbing another identity.
    if (accountForEmail.passwordHash) {
      if (!(await verifyPassword(password, accountForEmail.passwordHash))) {
        return { success: false, error: ERROR_MESSAGES.AUTH_LINK_PASSWORD_MISMATCH }
      }
      await prisma.account.update({ where: { id: accountForEmail.id }, data: identityLink })
    } else {
      // Known email, no password yet (invited, or migrated from a legacy row).
      await prisma.account.update({
        where: { id: accountForEmail.id },
        data: { ...identityLink, passwordHash: await hashPassword(password) },
      })
      await sendVerificationEmail(accountForEmail.id, email)
    }

    return { success: true, identities: toIdentities(await loadAccount({ id: accountForEmail.id })) }
  }

  // --- Finish this identity's own unclaimed account, or create one ---
  const accountId = accountForIdentity
    ? (
        await prisma.account.update({
          where: { id: accountForIdentity.id },
          data: { email, passwordHash: await hashPassword(password) },
          select: { id: true },
        })
      ).id
    : (
        await prisma.account.create({
          data: { email, passwordHash: await hashPassword(password), ...identityLink },
          select: { id: true },
        })
      ).id

  await sendVerificationEmail(accountId, email)

  return { success: true, identities: toIdentities(await loadAccount({ id: accountId })) }
}

/**
 * Email + password login. Returns EVERY identity the account carries, so a
 * person who is both staff and resident gets both sessions in one sign-in.
 *
 * One generic failure for every wrong path (unknown email, no password set,
 * wrong password, all identities deactivated) — anything more specific is an
 * account-enumeration oracle.
 */
export async function loginWithEmail(input: {
  email: string
  password: string
}): Promise<AccountResult> {
  const failure = { success: false as const, error: ERROR_MESSAGES.INVALID_CREDENTIALS }

  const account = await prisma.account.findUnique({
    where: { email: input.email },
    select: ACCOUNT_WITH_IDENTITIES,
  })
  if (!account?.passwordHash) return failure
  if (!(await verifyPassword(input.password, account.passwordHash))) return failure

  const identities = toIdentities(account)
  if (!identities.staff && !identities.resident) return failure

  if (identities.staff) {
    await prisma.user.update({
      where: { id: identities.staff.id },
      data: { lastLoginAt: new Date() },
    })
  }

  return { success: true, identities }
}

/**
 * Password reset, step 1. Generic success for ANY email (no enumeration) —
 * except when this deployment cannot send email at all: pretending to send a
 * link that will never arrive is a silent lockout, so that is a loud error.
 */
export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string }> {
  if (!EMAIL_CONFIG.enabled) {
    return { success: false, error: ERROR_MESSAGES.AUTH_EMAIL_NOT_CONFIGURED }
  }

  const account = await prisma.account.findUnique({ where: { email }, select: { id: true } })
  if (account) {
    const raw = await createAuthToken(account.id, 'RESET_PASSWORD')
    const { subject, html } = passwordResetEmail({
      link: `${getAppUrl()}/reset-password?token=${raw}`,
    })
    await sendEmail([email], subject, html)
  }

  return { success: true }
}

/**
 * Password reset, step 2. Consuming the token proves mailbox control, which
 * also verifies the email — and lets an account that has an email but no
 * password yet (invited staff, a migrated legacy row) set its first one.
 */
export async function resetPassword(
  rawToken: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const accountId = await consumeAuthToken(rawToken, 'RESET_PASSWORD')
  if (!accountId) return { success: false, error: ERROR_MESSAGES.AUTH_RESET_TOKEN_INVALID }

  await prisma.account.update({
    where: { id: accountId },
    data: { passwordHash: await hashPassword(newPassword), emailVerifiedAt: new Date() },
  })

  return { success: true }
}

/** Email verification link handler. */
export async function verifyEmailToken(rawToken: string): Promise<boolean> {
  const accountId = await consumeAuthToken(rawToken, 'VERIFY_EMAIL')
  if (!accountId) return false

  await prisma.account.update({
    where: { id: accountId },
    data: { emailVerifiedAt: new Date() },
  })
  return true
}
