/**
 * Password hashing — bcrypt via bcryptjs (pure JS, no native build).
 *
 * SSOT for the cost factor and the password policy. The zod schema lives in
 * lib/validation/auth.ts and imports PASSWORD_MIN_LENGTH from here.
 */

import bcrypt from 'bcryptjs'

export const PASSWORD_MIN_LENGTH = 8

// 12 rounds ≈ 250ms on the box — slow enough to blunt offline cracking,
// fast enough that login stays interactive.
const BCRYPT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
