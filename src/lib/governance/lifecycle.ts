/**
 * Proposal lifecycle: discussion → voting → outcome → adopted rule.
 *
 * One implementation, called from both the portal (lazily, when someone opens
 * the decisions page) and the nightly cron. A proposal must reach its outcome
 * whether or not anyone happens to look at it — but it must not sit unresolved
 * just because a scheduler did not run.
 */

import { db, proposal as proposalTable, houseRule, placement, conflictAgreement } from '@/lib/db'
import { and, eq, gt, inArray, isNull, lt, lte, or } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { checkUnitLegislation, resolveProposalStatus } from './rules'
import { tallyVotes } from './voting'

/**
 * Adopt an accepted proposal — the point where a decision becomes a rule.
 * Idempotent per proposal: adoption is driven by proposal status, and callers
 * only invoke it on the transition into ACCEPTED.
 */
export async function adoptProposal(proposalId: string): Promise<void> {
  const proposal = await db.query.proposal.findFirst({
    where: eq(proposalTable.id, proposalId),
    with: { parentOrgRule: true, targetRule: true },
  })
  if (!proposal) return

  // A one-off house decision is recorded, but never becomes a standing rule.
  if (proposal.type === 'HOUSE_DECISION') return

  if (proposal.type === 'REPEAL_RULE' && proposal.targetRuleId) {
    await db
      .update(houseRule)
      .set({ status: 'ARCHIVED', effectiveUntil: new Date() })
      .where(eq(houseRule.id, proposal.targetRuleId))
    return
  }

  if (proposal.type === 'AMEND_RULE' && proposal.targetRule) {
    await db
      .update(houseRule)
      .set({
        title: proposal.title,
        body: proposal.body,
        // New wording must be re-acknowledged by everyone the rule binds.
        version: proposal.targetRule.version + 1,
        adoptedByProposalId: proposal.id,
      })
      .where(eq(houseRule.id, proposal.targetRule.id))
    return
  }

  if (proposal.type === 'ADD_RULE' && proposal.parentOrgRule) {
    await db.insert(houseRule).values({
      scope: 'UNIT',
      housingUnitId: proposal.housingUnitId,
      parentRuleId: proposal.parentOrgRule.id,
      category: proposal.parentOrgRule.category,
      title: proposal.title,
      body: proposal.body,
      delegation: proposal.parentOrgRule.delegation,
      status: 'ACTIVE',
      version: 1,
      adoptedByProposalId: proposal.id,
    })
  }
}

/**
 * Tally a proposal and move it to its outcome.
 * Uses the policy snapshot stored on the proposal, never today's config.
 */
export async function closeProposal(proposalId: string): Promise<string | null> {
  const proposal = await db.query.proposal.findFirst({
    where: eq(proposalTable.id, proposalId),
    with: { votes: { columns: { choice: true, reason: true } }, parentOrgRule: true },
  })
  if (!proposal || proposal.status !== 'VOTING') return null

  const tally = tallyVotes({
    votes: proposal.votes,
    eligibleVoterCount: proposal.eligibleVoterCount,
    threshold: proposal.threshold,
    quorumPercent: proposal.quorumPercent,
    approvalPercent: proposal.approvalPercent,
  })

  const requiresConfirmation = proposal.parentOrgRule
    ? checkUnitLegislation(proposal.parentOrgRule).requiresStaffConfirmation
    : false

  const status = resolveProposalStatus(tally.outcome, proposal.decisionMode, requiresConfirmation)

  // Guarded update: if another caller closed this proposal first, do nothing.
  const updated = await db
    .update(proposalTable)
    .set({ status, decidedAt: new Date(), outcomeSummary: tally.explanation })
    .where(and(eq(proposalTable.id, proposalId), eq(proposalTable.status, 'VOTING')))
    .returning({ id: proposalTable.id })
  if (updated.length === 0) return null

  if (status === 'ACCEPTED') {
    await adoptProposal(proposalId)
  }

  return status
}

export interface LifecycleResult {
  opened: number
  closed: number
}

/**
 * Move every proposal whose window has elapsed to its next state.
 *
 * The electorate is snapshotted at the moment voting opens, not when the
 * proposal was written: people move in and out, and a quorum computed against
 * a roster from a week ago is not a quorum.
 */
export async function advanceDueProposals(
  now = new Date(),
  housingUnitId?: string,
): Promise<LifecycleResult> {
  const result: LifecycleResult = { opened: 0, closed: 0 }
  const unitFilter = housingUnitId ? [eq(proposalTable.housingUnitId, housingUnitId)] : []

  try {
    const dueToOpen = await db.query.proposal.findMany({
      where: and(
        ...unitFilter,
        eq(proposalTable.status, 'DISCUSSION'),
        lte(proposalTable.discussionEndsAt, now),
      ),
      columns: { id: true, housingUnitId: true },
    })

    for (const proposal of dueToOpen) {
      const eligibleVoterCount = await countEligibleVoters(proposal.housingUnitId, now)
      const opened = await db
        .update(proposalTable)
        .set({ status: 'VOTING', votingOpenedAt: now, eligibleVoterCount })
        .where(and(eq(proposalTable.id, proposal.id), eq(proposalTable.status, 'DISCUSSION')))
        .returning({ id: proposalTable.id })
      result.opened += opened.length
    }

    const dueToClose = await db.query.proposal.findMany({
      where: and(
        ...unitFilter,
        eq(proposalTable.status, 'VOTING'),
        lte(proposalTable.votingEndsAt, now),
      ),
      columns: { id: true },
    })

    for (const proposal of dueToClose) {
      const status = await closeProposal(proposal.id)
      if (status) result.closed++
    }
  } catch (error) {
    // A lazy advance runs inside page loads — it must never break the page.
    logger.errorWithCause('Failed to advance proposal lifecycle', error, { housingUnitId })
  }

  return result
}

/** Residents with an active placement — the electorate. Mirrors queries.ts. */
async function countEligibleVoters(housingUnitId: string, now: Date): Promise<number> {
  const placements = await db.query.placement.findMany({
    where: and(
      eq(placement.housingUnitId, housingUnitId),
      eq(placement.status, 'ACTIVE'),
      lte(placement.startDate, now),
      or(isNull(placement.endDate), gt(placement.endDate, now)),
    ),
    columns: { residentId: true },
  })
  return new Set(placements.map((p) => p.residentId)).size
}

/**
 * Agreements whose review date has passed without anyone checking. Marking
 * them expired keeps "we agreed something" from silently counting as "it
 * worked" — the difference the whole conflict-resolution loop depends on.
 */
export async function expireStaleAgreements(now = new Date(), graceDays = 7): Promise<number> {
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - graceDays)

  const expired = await db
    .update(conflictAgreement)
    .set({ status: 'EXPIRED' })
    .where(
      and(
        inArray(conflictAgreement.status, ['PROPOSED', 'ACCEPTED']),
        lt(conflictAgreement.reviewDate, cutoff),
      ),
    )
    .returning({ id: conflictAgreement.id })

  return expired.length
}
