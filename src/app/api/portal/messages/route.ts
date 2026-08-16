import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getPortalResident } from '@/lib/portal-auth'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import {
  appendMessage,
  getOrCreateThread,
  loadThreadMessages,
  markThreadRead,
} from '@/lib/messaging/queries'
import { isSendableBody, MESSAGE_BODY_MAX_LENGTH } from '@/lib/messaging/thread'

/**
 * A resident's conversation with the staff team.
 *
 * The thread is always the caller's own — there is no id in the URL, so there
 * is no id to tamper with. A resident cannot address anyone else's thread
 * because the route never accepts a way to name one.
 */

const sendSchema = z.object({
  body: z.string().trim().min(1).max(MESSAGE_BODY_MAX_LENGTH),
})

export async function GET() {
  const resident = await getPortalResident()
  if (!resident) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }, { status: 401 })
  }

  try {
    const thread = await getOrCreateThread(resident.id)
    // Opening the conversation IS reading it. Leaving the badge lit after the
    // resident has plainly read the messages trains people to ignore it.
    await markThreadRead(thread.id, { kind: 'resident', residentId: resident.id })
    const messages = await loadThreadMessages(thread.id)

    return NextResponse.json({ success: true, data: { messages } })
  } catch (error) {
    logger.errorWithCause('Failed to load resident message thread', error)
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.SESSION_ERROR }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const resident = await getPortalResident()
  if (!resident) {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED }, { status: 401 })
  }

  let body: string
  try {
    const parsed = sendSchema.safeParse(await request.json())
    if (!parsed.success || !isSendableBody(parsed.data.body)) {
      return NextResponse.json({ success: false, error: ERROR_MESSAGES.INVALID_INPUT }, { status: 400 })
    }
    body = parsed.data.body
  } catch {
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.INVALID_INPUT }, { status: 400 })
  }

  try {
    const thread = await getOrCreateThread(resident.id)
    const message = await appendMessage({
      threadId: thread.id,
      party: { kind: 'resident', residentId: resident.id },
      body,
    })

    return NextResponse.json({ success: true, data: { message } })
  } catch (error) {
    logger.errorWithCause('Failed to send resident message', error)
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.SESSION_ERROR }, { status: 500 })
  }
}
