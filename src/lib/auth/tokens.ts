/**
 * Single-use, expiring tokens for email flows (verification, password reset).
 *
 * The raw token exists exactly once — inside the email link. The database
 * stores only its SHA-256 hash, so a leaked database dump cannot be replayed
 * into a password takeover.
 */

import { createHash, randomBytes } from 'crypto'
import type { AuthTokenPurpose } from '@prisma/client'
import { prisma } from '@/lib/db'

/** Exactly one identity per token: staff account or resident. */
export type TokenIdentity = { userId: string } | { residentId: string }

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
 * Issue a fresh token for the identity+purpose, invalidating earlier ones —
 * only the most recent email link works, so a forgotten stale link cannot
 * be dug out of an old inbox later.
 */
export async function createAuthToken(
  identity: TokenIdentity,
  purpose: AuthTokenPurpose
): Promise<string> {
  const raw = randomBytes(32).toString('hex')

  await prisma.authToken.deleteMany({ where: { ...identity, purpose } })
  await prisma.authToken.create({
    data: {
      ...identity,
      purpose,
      tokenHash: hashAuthToken(raw),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS[purpose]),
    },
  })

  return raw
}

/**
 * Redeem a token: valid + unexpired + unused → mark used and return the
 * identity it belongs to. Anything else → null (one generic failure — the
 * caller must not leak WHY a token failed).
 */
export async function consumeAuthToken(
  raw: string,
  purpose: AuthTokenPurpose
): Promise<TokenIdentity | null> {
  const token = await prisma.authToken.findUnique({
    where: { tokenHash: hashAuthToken(raw) },
    select: { id: true, purpose: true, expiresAt: true, usedAt: true, userId: true, residentId: true },
  })

  if (!token || token.purpose !== purpose || token.usedAt || token.expiresAt < new Date()) {
    return null
  }

  await prisma.authToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  })

  if (token.userId) return { userId: token.userId }
  if (token.residentId) return { residentId: token.residentId }
  return null
}
