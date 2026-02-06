/**
 * Password Hashing
 *
 * Uses bcryptjs (pure JS) for compatibility with Edge Runtime.
 * No native dependencies required.
 */

import bcrypt from 'bcryptjs'

/** Number of salt rounds for bcrypt (10 is a good balance of security/speed) */
const SALT_ROUNDS = 10

/**
 * Hash a password for storage
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
