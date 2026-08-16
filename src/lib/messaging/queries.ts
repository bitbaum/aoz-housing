import { prisma } from '@/lib/db'
import { RESIDENT_NAME_SELECT } from '@/lib/utils/resident-name'
import {
  messageAuthor,
  messagesToMarkRead,
  unreadCountFor,
  type MessageParty,
  type MessageRow,
} from './thread'

/**
 * The I/O half of resident ↔ staff messaging. Everything that decides anything
 * lives in `thread.ts`; this file only reads and writes.
 */

const MESSAGE_SELECT = {
  id: true,
  authorResidentId: true,
  authorUserId: true,
  body: true,
  createdAt: true,
  readAt: true,
} as const

/**
 * The resident's thread, created on first use.
 *
 * Upsert rather than "find, then create if missing": two requests arriving
 * together — a resident sending while staff open the thread — would otherwise
 * both find nothing and both insert, and the unique index would turn the loser
 * into a 500 on an ordinary action.
 */
export async function getOrCreateThread(residentId: string) {
  return prisma.messageThread.upsert({
    where: { residentId },
    create: { residentId },
    update: {},
    select: { id: true, residentId: true },
  })
}

export async function loadThreadMessages(threadId: string): Promise<MessageRow[]> {
  return prisma.message.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
    select: MESSAGE_SELECT,
  })
}

/**
 * Append a message and bump the thread, in one transaction.
 *
 * The bump is what a staff inbox sorts on. If the write succeeded and the bump
 * did not, the message would exist and the thread would look untouched — the
 * conversation would be invisible in the only list that surfaces it.
 */
export async function appendMessage({
  threadId,
  party,
  body,
}: {
  threadId: string
  party: MessageParty
  body: string
}) {
  return prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: { threadId, body: body.trim(), ...messageAuthor(party) },
      select: MESSAGE_SELECT,
    })

    await tx.messageThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    })

    return message
  })
}

/** Mark the other side's messages read. Returns how many changed. */
export async function markThreadRead(threadId: string, party: MessageParty): Promise<number> {
  const messages = await loadThreadMessages(threadId)
  const ids = messagesToMarkRead(messages, party)
  if (ids.length === 0) return 0

  const result = await prisma.message.updateMany({
    where: { id: { in: ids } },
    data: { readAt: new Date() },
  })
  return result.count
}

/** How many messages are waiting for this resident. Drives the portal badge. */
export async function residentUnreadCount(residentId: string): Promise<number> {
  const thread = await prisma.messageThread.findUnique({
    where: { residentId },
    select: { id: true },
  })
  if (!thread) return 0

  const messages = await loadThreadMessages(thread.id)
  return unreadCountFor(messages, { kind: 'resident', residentId })
}

/**
 * Every thread with something waiting for staff, oldest wait first.
 *
 * Ordered by the OLDEST unanswered message rather than the newest activity: a
 * question from four days ago matters more than one from an hour ago, and
 * sorting by recency buries exactly the person who has been waiting longest.
 */
export async function staffInbox() {
  const threads = await prisma.messageThread.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      updatedAt: true,
      resident: { select: RESIDENT_NAME_SELECT },
      messages: { orderBy: { createdAt: 'asc' }, select: MESSAGE_SELECT },
    },
  })

  return threads
    .map((thread) => {
      const waiting = thread.messages.filter(
        (message) => message.authorResidentId !== null && message.readAt === null
      )
      const lastMessage = thread.messages[thread.messages.length - 1]

      return {
        id: thread.id,
        resident: thread.resident,
        unreadCount: waiting.length,
        // The moment the person started waiting, not the moment anything last
        // happened in the thread.
        waitingSince: waiting[0]?.createdAt ?? null,
        lastMessageAt: lastMessage?.createdAt ?? thread.updatedAt,
        lastMessagePreview: lastMessage?.body ?? '',
      }
    })
    .sort((a, b) => {
      if (a.waitingSince && b.waitingSince) {
        return a.waitingSince.getTime() - b.waitingSince.getTime()
      }
      // Threads with somebody waiting always come before threads without.
      if (a.waitingSince) return -1
      if (b.waitingSince) return 1
      return b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    })
}
