/**
 * Splitting an expense between participants.
 *
 * Invariant: the shares ALWAYS sum to exactly the total. Rappen remainders
 * are distributed deterministically (+1 to the first participants in sorted
 * id order), so the same input always produces the same shares.
 */

export interface Share {
  residentId: string
  amountRappen: number
}

export function splitEqually(totalRappen: number, participantIds: string[]): Share[] {
  if (!Number.isInteger(totalRappen) || totalRappen <= 0) {
    throw new Error('totalRappen must be a positive integer')
  }
  const ids = Array.from(new Set(participantIds)).sort()
  if (ids.length === 0) {
    throw new Error('at least one participant is required')
  }

  const base = Math.floor(totalRappen / ids.length)
  let remainder = totalRappen - base * ids.length

  return ids.map((residentId) => ({
    residentId,
    amountRappen: base + (remainder-- > 0 ? 1 : 0),
  }))
}
