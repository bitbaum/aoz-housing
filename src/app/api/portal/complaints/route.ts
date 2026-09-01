import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { getResidentCookie } from '@/lib/portal-auth'
import { COMPLAINT_SUBJECT_IDS } from '@/lib/constants/labels'

/**
 * A resident objects to the ORGANISATION.
 *
 * Deliberately NOT part of `/api/portal/report`, which routes to the
 * maintenance board or the incident ladder. Sharing that route would have
 * meant one more branch in a function whose whole job is choosing between two
 * destinations that are both wrong here — and the failure mode of getting the
 * branch wrong is a complaint about staff becoming a case against the
 * resident. Different obligation, different table, different route.
 *
 * Note what is NOT audited: `logAudit` records who did what to whom, and the
 * point of an anonymous complaint is that no such record exists. Writing an
 * audit row naming the resident would quietly undo the anonymity the form
 * promises.
 */

const complaintSchema = z.object({
  subject: z.enum(COMPLAINT_SUBJECT_IDS),
  body: z.string().trim().min(10).max(4000),
  anonymous: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  const residentCode = await getResidentCookie()
  if (!residentCode) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 },
    )
  }

  // Signing in is still required — an open endpoint would take complaints from
  // anyone on the internet, and a channel full of noise protects nobody. What
  // "anonymous" changes is whether the RECORD carries the identity, not
  // whether the sender had one.
  const resident = await prisma.resident.findUnique({
    where: { code: residentCode },
    select: { id: true },
  })
  if (!resident) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 },
    )
  }

  let parsed: z.infer<typeof complaintSchema>
  try {
    parsed = complaintSchema.parse(await request.json())
  } catch {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.INVALID_REQUEST },
      { status: 400 },
    )
  }

  try {
    await prisma.complaint.create({
      data: {
        residentId: parsed.anonymous ? null : resident.id,
        subject: parsed.subject,
        body: parsed.body,
      },
    })
  } catch (error) {
    // The body is a person's complaint. It never goes to the logger.
    logger.errorWithCause('Failed to record complaint', error)
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.SAVE_ERROR }, { status: 500 })
  }

  // No message: the confirmation is the CLIENT's to render, already
  // translated. Returning German prose from an API the portal calls is the
  // leak the portal gates exist to catch — the resident may not read it.
  return NextResponse.json({ success: true, anonymous: parsed.anonymous })
}
