/**
 * Single-use, expiring tokens for email flows (verification, password reset).
 *
 * Tokens belong to the ACCOUNT, not to a staff or resident identity: what a
 * reset link proves is control of the mailbox, and that is exactly what an
 * account is. The raw token exists once — inside the email. The database
 * stores only its SHA-256 hash, so a leaked dump cannot be replayed into a
 * password takeover.
 */

import { createHash, randomBytes } from 'crypto'
import type { AuthTokenPurpose } from '@prisma/client'
import { prisma } from '@/lib/db'

export const TOKEN_TTL_MS: Record<AuthTokenPurpose, number> = {
  // A reset link is a credential — keep its window short.
  RESET_PASSWORD: 60 * 60 * 1000,
  // Verification is a nicety; a day avoids "link expired" frustration.
  VERIFY_EMAIL: 24 * 60 * 60 * 1000,
}

export function hashAuthToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

/**
 * Issue a fresh token for the account+purpose, invalidating earlier ones —
 * only the most recent email link works, so a stale link dug out of an old
 * inbox is dead.
 */
export async function createAuthToken(
  accountId: string,
  purpose: AuthTokenPurpose,
): Promise<string> {
  const raw = randomBytes(32).toString('hex')

  await prisma.authToken.deleteMany({ where: { accountId, purpose } })
  await prisma.authToken.create({
    data: {
      accountId,
      purpose,
      tokenHash: hashAuthToken(raw),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS[purpose]),
    },
  })

  return raw
}

/**
 * Redeem a token: valid + unexpired + unused → mark used and return the
 * account id. Anything else → null (one generic failure — the caller must not
 * leak WHY a token failed).
 */
export async function consumeAuthToken(
  raw: string,
  purpose: AuthTokenPurpose,
): Promise<string | null> {
  const token = await prisma.authToken.findUnique({
    where: { tokenHash: hashAuthToken(raw) },
    select: { id: true, purpose: true, expiresAt: true, usedAt: true, accountId: true },
  })

  if (!token || token.purpose !== purpose || token.usedAt || token.expiresAt < new Date()) {
    return null
  }

  await prisma.authToken.update({ where: { id: token.id }, data: { usedAt: new Date() } })
  return token.accountId
}
