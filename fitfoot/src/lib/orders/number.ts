import { randomInt } from 'crypto'

/**
 * Order numbers: FF-<year>-<6 random digits>. Random, not sequential —
 * sequential numbers leak order volume to anyone holding two receipts.
 * Uniqueness is enforced by the DB index; callers retry on collision.
 */
export function generateOrderNumber(now: Date = new Date()): string {
  const year = now.getFullYear()
  const digits = randomInt(0, 1_000_000).toString().padStart(6, '0')
  return `FF-${year}-${digits}`
}

export const ORDER_NUMBER_PATTERN = /^FF-\d{4}-\d{6}$/
