import { NextRequest, NextResponse } from 'next/server'
import { db, proposal as proposalTable, vote } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { getPortalAuth } from '@/lib/portal-auth'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { castVoteSchema } from '@/lib/validation/governance'
import { advanceDueProposals } from '@/lib/governance/lifecycle'

/**
 * Cast or change a vote.
 *
 * Changing your mind while the vote is open is allowed on purpose: the point of
 * the discussion period is that people update their view, and a system that
 * locks the first click punishes exactly the residents who engage early.
 */
export async function POST(request: NextRequest) {
  const auth = await getPortalAuth()
  if (!auth) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 },
    )
  }

  try {
    const parsed = castVoteSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? ERROR_MESSAGES.INVALID_INPUT },
        { status: 400 },
      )
    }

    // Close anything overdue first, so a vote cannot land after the deadline.
    await advanceDueProposals(new Date(), auth.placement.housingUnitId)

    const proposal = await db.query.proposal.findFirst({
      where: eq(proposalTable.id, parsed.data.proposalId),
      columns: { id: true, status: true, housingUnitId: true, votingEndsAt: true },
    })

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.PROPOSAL_NOT_FOUND },
        { status: 404 },
      )
    }

    // Only residents of the house that the decision affects may vote in it.
    if (proposal.housingUnitId !== auth.placement.housingUnitId) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.VOTE_NOT_ELIGIBLE },
        { status: 403 },
      )
    }

    if (proposal.status === 'DISCUSSION') {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.PROPOSAL_NOT_VOTING },
        { status: 409 },
      )
    }

    if (proposal.status !== 'VOTING') {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.PROPOSAL_NOT_OPEN },
        { status: 409 },
      )
    }

    await db
      .insert(vote)
      .values({
        proposalId: proposal.id,
        residentId: auth.resident.id,
        choice: parsed.data.choice,
        reason: parsed.data.reason,
      })
      .onConflictDoUpdate({
        target: [vote.proposalId, vote.residentId],
        set: {
          choice: parsed.data.choice,
          reason: parsed.data.reason,
          castAt: new Date(),
        },
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.errorWithCause('Failed to cast vote', error, { residentId: auth.resident.id })
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.VOTE_SAVE_ERROR },
      { status: 500 },
    )
  }
}
