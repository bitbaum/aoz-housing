/**
 * Governance read helpers.
 *
 * Shared by the admin pages and the resident portal so both see exactly the
 * same rule book and the same electorate. "Who lives here" is defined once,
 * here — if staff and residents ever disagreed on that, every vote count would
 * be disputable.
 */

import { db, houseRule, placement, proposal, ruleAcknowledgement } from '@/lib/db'
import type { ProposalStatus, VoteChoice, VoteThreshold } from '@/lib/db'
import { and, asc, desc, eq, gt, inArray, isNull, lte, or, sql } from 'drizzle-orm'
import { buildRuleBook, type RuleBook, type RuleLike } from './rules'
import { outstandingForResident, unitCoverage, type OutstandingRule } from './acknowledgement'
import { tallyVotes, type TallyResult } from './voting'

/** Fields every governance consumer needs — keeps selects consistent. */
const RULE_SELECT = {
  id: true,
  scope: true,
  key: true,
  category: true,
  title: true,
  body: true,
  delegation: true,
  parentRuleId: true,
  status: true,
  version: true,
  housingUnitId: true,
  updatedAt: true,
} as const

export async function getOrgRules(): Promise<RuleLike[]> {
  return db.query.houseRule.findMany({
    where: eq(houseRule.scope, 'ORG'),
    columns: RULE_SELECT,
    orderBy: [asc(houseRule.category), asc(houseRule.title)],
  })
}

export async function getUnitRules(housingUnitId: string): Promise<RuleLike[]> {
  return db.query.houseRule.findMany({
    where: and(eq(houseRule.scope, 'UNIT'), eq(houseRule.housingUnitId, housingUnitId)),
    columns: RULE_SELECT,
    orderBy: [asc(houseRule.category), asc(houseRule.createdAt)],
  })
}

/** The merged two-tier rule book for one housing unit. */
export async function getRuleBook(housingUnitId: string): Promise<RuleBook> {
  const [orgRules, unitRules] = await Promise.all([getOrgRules(), getUnitRules(housingUnitId)])
  return buildRuleBook(orgRules, unitRules)
}

/**
 * Residents currently living in a unit — the electorate for its decisions and
 * the people its rules bind. An active placement is one that has started and
 * has not ended.
 */
export async function getUnitResidentIds(
  housingUnitId: string,
  now = new Date(),
): Promise<string[]> {
  const placements = await db.query.placement.findMany({
    where: and(
      eq(placement.housingUnitId, housingUnitId),
      eq(placement.status, 'ACTIVE'),
      lte(placement.startDate, now),
      or(isNull(placement.endDate), gt(placement.endDate, now)),
    ),
    columns: { residentId: true },
  })
  return Array.from(new Set(placements.map((p) => p.residentId)))
}

export async function getEligibleVoterCount(housingUnitId: string): Promise<number> {
  return (await getUnitResidentIds(housingUnitId)).length
}

// =============================================================================
// ACKNOWLEDGEMENT
// =============================================================================

/** Rules this resident has not yet seen at their current version. */
export async function getOutstandingRules(
  residentId: string,
  housingUnitId: string,
): Promise<OutstandingRule[]> {
  const book = await getRuleBook(housingUnitId)
  const bindingRules = [
    ...book.sections.flatMap((s) => s.entries.flatMap((e) => [e.orgRule, ...e.unitRules])),
    ...book.orphanedUnitRules,
  ]

  // An empty rule id list means no acknowledgements can match — skip the query
  // (an empty `inArray` is an error, not an empty result).
  const ruleIds = bindingRules.map((r) => r.id)
  const acknowledgements = ruleIds.length
    ? await db.query.ruleAcknowledgement.findMany({
        where: and(
          eq(ruleAcknowledgement.residentId, residentId),
          inArray(ruleAcknowledgement.ruleId, ruleIds),
        ),
        columns: { ruleId: true, residentId: true, ruleVersion: true },
      })
    : []

  return outstandingForResident(bindingRules, acknowledgements, residentId)
}

/** How much of its own rule book a house has actually read. */
export async function getUnitAcknowledgementCoverage(housingUnitId: string) {
  const [book, residentIds] = await Promise.all([
    getRuleBook(housingUnitId),
    getUnitResidentIds(housingUnitId),
  ])

  const rules = [
    ...book.sections.flatMap((s) => s.entries.flatMap((e) => [e.orgRule, ...e.unitRules])),
    ...book.orphanedUnitRules,
  ]

  // Either list being empty means no acknowledgement can match — skip the
  // query (an empty `inArray` is an error, not an empty result).
  const ruleIds = rules.map((r) => r.id)
  const acknowledgements =
    ruleIds.length && residentIds.length
      ? await db.query.ruleAcknowledgement.findMany({
          where: and(
            inArray(ruleAcknowledgement.ruleId, ruleIds),
            inArray(ruleAcknowledgement.residentId, residentIds),
          ),
          columns: { ruleId: true, residentId: true, ruleVersion: true },
        })
      : []

  return unitCoverage(rules, acknowledgements, residentIds)
}

// =============================================================================
// PROPOSALS
// =============================================================================

const PROPOSAL_INCLUDE = {
  votes: { columns: { id: true, choice: true, reason: true, residentId: true, castAt: true } },
  proposedByResident: { columns: { id: true, code: true } },
  parentOrgRule: { columns: { id: true, title: true, delegation: true, category: true } },
  targetRule: { columns: { id: true, title: true } },
  housingUnit: { columns: { id: true, code: true, address: true } },
} as const

export async function getUnitProposals(housingUnitId: string, statuses?: ProposalStatus[]) {
  return db.query.proposal.findMany({
    where: and(
      eq(proposal.housingUnitId, housingUnitId),
      statuses
        ? // An empty status list means "match nothing", which `inArray` cannot express.
          statuses.length
          ? inArray(proposal.status, statuses)
          : sql`false`
        : undefined,
    ),
    with: PROPOSAL_INCLUDE,
    orderBy: [desc(proposal.createdAt)],
  })
}

export async function getProposal(proposalId: string) {
  const row = await db.query.proposal.findFirst({
    where: eq(proposal.id, proposalId),
    with: PROPOSAL_INCLUDE,
  })
  return row ?? null
}

/** Proposals waiting on a staff decision, across all units. */
export async function getProposalsAwaitingStaff() {
  return db.query.proposal.findMany({
    where: eq(proposal.status, 'NEEDS_STAFF_CONFIRMATION'),
    with: PROPOSAL_INCLUDE,
    orderBy: [asc(proposal.decidedAt)],
  })
}

/**
 * Live tally for a proposal, using the policy snapshot taken when voting
 * opened rather than today's config — a past decision must stay explainable
 * after the policy changes.
 */
export interface TallyableProposal {
  votes: { choice: VoteChoice; reason?: string | null }[]
  threshold: VoteThreshold
  quorumPercent: number
  approvalPercent: number
  eligibleVoterCount: number
}

export function tallyProposal(proposal: TallyableProposal): TallyResult {
  return tallyVotes({
    votes: proposal.votes,
    eligibleVoterCount: proposal.eligibleVoterCount,
    threshold: proposal.threshold,
    quorumPercent: proposal.quorumPercent,
    approvalPercent: proposal.approvalPercent,
  })
}
