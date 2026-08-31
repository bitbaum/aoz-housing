/**
 * Proposal lifecycle: discussion → voting → outcome → adopted rule.
 *
 * One implementation, called from both the portal (lazily, when someone opens
 * the decisions page) and the nightly cron. A proposal must reach its outcome
 * whether or not anyone happens to look at it — but it must not sit unresolved
 * just because a scheduler did not run.
 */

import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { checkUnitLegislation, resolveProposalStatus } from './rules'
import { tallyVotes } from './voting'

/**
 * Adopt an accepted proposal — the point where a decision becomes a rule.
 * Idempotent per proposal: adoption is driven by proposal status, and callers
 * only invoke it on the transition into ACCEPTED.
 */
export async function adoptProposal(proposalId: string): Promise<void> {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { parentOrgRule: true, targetRule: true },
  })
  if (!proposal) return

  // A one-off house decision is recorded, but never becomes a standing rule.
  if (proposal.type === 'HOUSE_DECISION') return

  if (proposal.type === 'REPEAL_RULE' && proposal.targetRuleId) {
    await prisma.houseRule.update({
      where: { id: proposal.targetRuleId },
      data: { status: 'ARCHIVED', effectiveUntil: new Date() },
    })
    return
  }

  if (proposal.type === 'AMEND_RULE' && proposal.targetRule) {
    await prisma.houseRule.update({
      where: { id: proposal.targetRule.id },
      data: {
        title: proposal.title,
        body: proposal.body,
        // New wording must be re-acknowledged by everyone the rule binds.
        version: proposal.targetRule.version + 1,
        adoptedByProposalId: proposal.id,
      },
    })
    return
  }

  if (proposal.type === 'ADD_RULE' && proposal.parentOrgRule) {
    await prisma.houseRule.create({
      data: {
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
      },
    })
  }
}

/**
 * Tally a proposal and move it to its outcome.
 * Uses the policy snapshot stored on the proposal, never today's config.
 */
export async function closeProposal(proposalId: string): Promise<string | null> {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { votes: { select: { choice: true, reason: true } }, parentOrgRule: true },
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
  const updated = await prisma.proposal.updateMany({
    where: { id: proposalId, status: 'VOTING' },
    data: { status, decidedAt: new Date(), outcomeSummary: tally.explanation },
  })
  if (updated.count === 0) return null

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
  const unitFilter = housingUnitId ? { housingUnitId } : {}

  try {
    const dueToOpen = await prisma.proposal.findMany({
      where: { ...unitFilter, status: 'DISCUSSION', discussionEndsAt: { lte: now } },
      select: { id: true, housingUnitId: true },
    })

    for (const proposal of dueToOpen) {
      const eligibleVoterCount = await countEligibleVoters(proposal.housingUnitId, now)
      const opened = await prisma.proposal.updateMany({
        where: { id: proposal.id, status: 'DISCUSSION' },
        data: { status: 'VOTING', votingOpenedAt: now, eligibleVoterCount },
      })
      result.opened += opened.count
    }

    const dueToClose = await prisma.proposal.findMany({
      where: { ...unitFilter, status: 'VOTING', votingEndsAt: { lte: now } },
      select: { id: true },
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
  const placements = await prisma.placement.findMany({
    where: {
      housingUnitId,
      status: 'ACTIVE',
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    select: { residentId: true },
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

  const result = await prisma.conflictAgreement.updateMany({
    where: { status: { in: ['PROPOSED', 'ACCEPTED'] }, reviewDate: { lt: cutoff } },
    data: { status: 'EXPIRED' },
  })

  return result.count
}
