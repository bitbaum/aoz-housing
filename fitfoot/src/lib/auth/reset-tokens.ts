/**
 * Password reset tokens — single-use, SHA-256-at-rest (the raw token is
 * never stored; only its hash, so a DB leak doesn't hand out live tokens).
 */
import { randomBytes, createHash } from 'crypto'
import { eq, and, isNull, gt } from 'drizzle-orm'
import { db } from '@/db'
import { passwordResetTokens } from '@/db/schema'

const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function createResetToken(customerId: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  await db.insert(passwordResetTokens).values({
    customerId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  })
  return token
}

export async function consumeResetToken(token: string): Promise<string | null> {
  const tokenHash = hashToken(token)
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1)
  if (!row) return null

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, row.id))

  return row.customerId
}
