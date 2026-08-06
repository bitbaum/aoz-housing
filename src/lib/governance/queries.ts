/**
 * Governance read helpers.
 *
 * Shared by the admin pages and the resident portal so both see exactly the
 * same rule book and the same electorate. "Who lives here" is defined once,
 * here — if staff and residents ever disagreed on that, every vote count would
 * be disputable.
 */

import { prisma } from '@/lib/db'
import type { ProposalStatus, VoteChoice, VoteThreshold } from '@prisma/client'
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
  return prisma.houseRule.findMany({
    where: { scope: 'ORG' },
    select: RULE_SELECT,
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  })
}

export async function getUnitRules(housingUnitId: string): Promise<RuleLike[]> {
  return prisma.houseRule.findMany({
    where: { scope: 'UNIT', housingUnitId },
    select: RULE_SELECT,
    orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
  })
}

/** The merged two-tier rule book for one housing unit. */
export async function getRuleBook(housingUnitId: string): Promise<RuleBook> {
  const [orgRules, unitRules] = await Promise.all([
    getOrgRules(),
    getUnitRules(housingUnitId),
  ])
  return buildRuleBook(orgRules, unitRules)
}

/**
 * Residents currently living in a unit — the electorate for its decisions and
 * the people its rules bind. An active placement is one that has started and
 * has not ended.
 */
export async function getUnitResidentIds(housingUnitId: string, now = new Date()): Promise<string[]> {
  const placements = await prisma.placement.findMany({
    where: {
      housingUnitId,
      status: 'ACTIVE',
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    select: { residentId: true },
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
  housingUnitId: string
): Promise<OutstandingRule[]> {
  const book = await getRuleBook(housingUnitId)
  const bindingRules = [
    ...book.sections.flatMap((s) => s.entries.flatMap((e) => [e.orgRule, ...e.unitRules])),
    ...book.orphanedUnitRules,
  ]

  const acknowledgements = await prisma.ruleAcknowledgement.findMany({
    where: { residentId, ruleId: { in: bindingRules.map((r) => r.id) } },
    select: { ruleId: true, residentId: true, ruleVersion: true },
  })

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

  const acknowledgements = await prisma.ruleAcknowledgement.findMany({
    where: { ruleId: { in: rules.map((r) => r.id) }, residentId: { in: residentIds } },
    select: { ruleId: true, residentId: true, ruleVersion: true },
  })

  return unitCoverage(rules, acknowledgements, residentIds)
}

// =============================================================================
// PROPOSALS
// =============================================================================

const PROPOSAL_INCLUDE = {
  votes: { select: { id: true, choice: true, reason: true, residentId: true, castAt: true } },
  proposedByResident: { select: { id: true, code: true } },
  parentOrgRule: { select: { id: true, title: true, delegation: true, category: true } },
  targetRule: { select: { id: true, title: true } },
  housingUnit: { select: { id: true, code: true, address: true } },
} as const

export async function getUnitProposals(housingUnitId: string, statuses?: ProposalStatus[]) {
  return prisma.proposal.findMany({
    where: { housingUnitId, ...(statuses ? { status: { in: statuses } } : {}) },
    include: PROPOSAL_INCLUDE,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProposal(proposalId: string) {
  return prisma.proposal.findUnique({ where: { id: proposalId }, include: PROPOSAL_INCLUDE })
}

/** Proposals waiting on a staff decision, across all units. */
export async function getProposalsAwaitingStaff() {
  return prisma.proposal.findMany({
    where: { status: 'NEEDS_STAFF_CONFIRMATION' },
    include: PROPOSAL_INCLUDE,
    orderBy: { decidedAt: 'asc' },
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
