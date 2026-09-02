import { NextRequest, NextResponse } from 'next/server'
import { db, houseRule, proposal as proposalTable } from '@/lib/db'
import { and, eq } from 'drizzle-orm'
import { getPortalAuth } from '@/lib/portal-auth'
import { logger } from '@/lib/logger'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { createProposalSchema } from '@/lib/validation/governance'
import { getUnitProposals, getEligibleVoterCount } from '@/lib/governance/queries'
import { advanceDueProposals } from '@/lib/governance/lifecycle'
import { checkUnitLegislation } from '@/lib/governance/rules'
import {
  buildPolicySnapshot,
  canHoldVote,
  computeSchedule,
  tallyVotes,
} from '@/lib/governance/voting'
import { CATEGORY_DECISION_MODE, CATEGORY_THRESHOLD } from '@/lib/config/decisions'

/** Proposals for this resident's house, with a live tally for each. */
export async function GET() {
  const auth = await getPortalAuth()
  if (!auth) {
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED },
      { status: 401 },
    )
  }

  try {
    // Move any proposal whose window has elapsed before showing the list, so a
    // resident never sees "voting" on something that closed three days ago.
    await advanceDueProposals(new Date(), auth.placement.housingUnitId)

    const proposals = await getUnitProposals(auth.placement.housingUnitId)

    return NextResponse.json({
      success: true,
      data: proposals.map((proposal) => ({
        ...proposal,
        tally: tallyVotes({
          votes: proposal.votes,
          eligibleVoterCount: proposal.eligibleVoterCount,
          threshold: proposal.threshold,
          quorumPercent: proposal.quorumPercent,
          approvalPercent: proposal.approvalPercent,
        }),
        myVote: proposal.votes.find((v) => v.residentId === auth.resident.id)?.choice ?? null,
      })),
    })
  } catch (error) {
    logger.errorWithCause('Failed to load proposals', error, { residentId: auth.resident.id })
    return NextResponse.json({ success: false, error: ERROR_MESSAGES.SAVE_ERROR }, { status: 500 })
  }
}

/**
 * Put something to the house.
 *
 * Two gates before a proposal exists, both applied here rather than after a
 * week of voting: the topic must be one the house may decide, and the house
 * must be large enough for a vote to mean anything. Letting people debate and
 * vote on something that was never going to be adopted is the fastest way to
 * make them stop taking part.
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
    const parsed = createProposalSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? ERROR_MESSAGES.INVALID_INPUT },
        { status: 400 },
      )
    }

    const { housingUnitId } = auth.placement
    const decisionMode = CATEGORY_DECISION_MODE[parsed.data.category]

    let parentOrgRuleId: string | null = null
    if (parsed.data.type === 'ADD_RULE' && parsed.data.parentOrgRuleId) {
      const parent = await db.query.houseRule.findFirst({
        where: eq(houseRule.id, parsed.data.parentOrgRuleId),
      })
      if (!parent) {
        return NextResponse.json(
          { success: false, error: ERROR_MESSAGES.RULE_NOT_FOUND },
          { status: 404 },
        )
      }

      const check = checkUnitLegislation(parent)
      if (!check.allowed) {
        // Explain rather than reject silently — the reason is the useful part.
        return NextResponse.json({ success: false, error: check.reason }, { status: 422 })
      }
      parentOrgRuleId = parent.id
    }

    // A house rule that belongs to the house being changed, not another one.
    if (parsed.data.targetRuleId) {
      const target = await db.query.houseRule.findFirst({
        where: and(
          eq(houseRule.id, parsed.data.targetRuleId),
          eq(houseRule.scope, 'UNIT'),
          eq(houseRule.housingUnitId, housingUnitId),
        ),
        columns: { id: true },
      })
      if (!target) {
        return NextResponse.json(
          { success: false, error: ERROR_MESSAGES.RULE_NOT_FOUND },
          { status: 404 },
        )
      }
    }

    const eligibleVoterCount = await getEligibleVoterCount(housingUnitId)
    const threshold = CATEGORY_THRESHOLD[parsed.data.category]
    const snapshot = buildPolicySnapshot(threshold, eligibleVoterCount)
    const { discussionEndsAt, votingEndsAt } = computeSchedule(new Date())

    // Safety and respect are not put to a vote, and a household of two cannot
    // hold one. Both cases still produce a proposal — it goes to staff, who
    // must answer it. "Not votable" must not mean "not heard".
    const goesStraightToStaff = decisionMode === 'STAFF_ONLY' || !canHoldVote(eligibleVoterCount)

    const [proposal] = await db
      .insert(proposalTable)
      .values({
        housingUnitId,
        type: parsed.data.type,
        category: parsed.data.category,
        title: parsed.data.title,
        body: parsed.data.body,
        parentOrgRuleId,
        targetRuleId: parsed.data.targetRuleId ?? null,
        proposedByResidentId: auth.resident.id,
        status: goesStraightToStaff ? 'NEEDS_STAFF_CONFIRMATION' : 'DISCUSSION',
        decisionMode,
        ...snapshot,
        discussionEndsAt: goesStraightToStaff ? null : discussionEndsAt,
        votingEndsAt: goesStraightToStaff ? null : votingEndsAt,
        outcomeSummary: goesStraightToStaff
          ? decisionMode === 'STAFF_ONLY'
            ? ERROR_MESSAGES.PROPOSAL_STAFF_ONLY
            : ERROR_MESSAGES.UNIT_TOO_SMALL_FOR_VOTE
          : null,
      })
      .returning({ id: proposalTable.id, status: proposalTable.status })

    return NextResponse.json({ success: true, data: proposal })
  } catch (error) {
    logger.errorWithCause('Failed to create proposal', error, { residentId: auth.resident.id })
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.PROPOSAL_CREATE_ERROR },
      { status: 500 },
    )
  }
}
