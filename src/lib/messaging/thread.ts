/**
 * Resident ↔ staff messaging — the pure part.
 *
 * WHY THIS EXISTS AT ALL. Every channel this product had was one-directional
 * and typed: a report goes to a desk, a transfer request gets approved or
 * denied, a proposal gets voted on. None of them answer "can I ask you
 * something?", and the absence showed up as reports filed under MAINTENANCE
 * that were really questions, because that was the only box available.
 *
 * WHY IT IS NOT A COPY OF THE CLINIC'S. vitareba has the same shape
 * (patient ↔ care team) and it is built on Drizzle with a different auth model,
 * so what transfers is the DESIGN — one thread per person, `readAt` per
 * message, unread counts driven off the thread's `updatedAt` — and not the
 * code. Rewriting the query layer was unavoidable either way.
 */

export const MESSAGE_BODY_MAX_LENGTH = 4000

/** Who is writing or reading. Mirrors the two identities the product has. */
export type MessageParty =
  | { kind: 'resident'; residentId: string }
  | { kind: 'staff'; userId: string }

export interface MessageRow {
  id: string
  authorResidentId: string | null
  authorUserId: string | null
  body: string
  createdAt: Date
  readAt: Date | null
}

/**
 * The author columns, from a party. Exactly one is set.
 *
 * The database enforces this too (`Message_one_author`), deliberately twice: a
 * message with neither author is unattributable, and one with both is a lie
 * about who said it. Neither is something to leave to whoever writes the next
 * caller.
 */
export function messageAuthor(party: MessageParty): {
  authorResidentId: string | null
  authorUserId: string | null
} {
  return party.kind === 'resident'
    ? { authorResidentId: party.residentId, authorUserId: null }
    : { authorResidentId: null, authorUserId: party.userId }
}

/** True when `party` wrote this message. */
export function isOwnMessage(message: MessageRow, party: MessageParty): boolean {
  return party.kind === 'resident'
    ? message.authorResidentId === party.residentId
    : message.authorUserId === party.userId
}

/**
 * Whether a message counts as unread FOR this party.
 *
 * Your own message is never unread to you, which sounds obvious and is exactly
 * the bug that produces a badge you can never clear: staff reply, the reply is
 * unread, staff see "1 unread" on their own words.
 */
export function isUnreadFor(message: MessageRow, party: MessageParty): boolean {
  if (isOwnMessage(message, party)) return false
  return message.readAt === null
}

export function unreadCountFor(messages: MessageRow[], party: MessageParty): number {
  return messages.filter((message) => isUnreadFor(message, party)).length
}

/**
 * The messages `party` should mark read on opening the thread — the other
 * side's unread ones, and nothing else.
 *
 * Returned as ids rather than executed here so this stays pure and the caller
 * does one `updateMany`.
 */
export function messagesToMarkRead(messages: MessageRow[], party: MessageParty): string[] {
  return messages.filter((message) => isUnreadFor(message, party)).map((message) => message.id)
}

/** A body that is only whitespace is not a message. */
export function isSendableBody(body: string): boolean {
  const trimmed = body.trim()
  return trimmed.length > 0 && trimmed.length <= MESSAGE_BODY_MAX_LENGTH
}
