/**
 * Vote tallying — pure functions, no I/O.
 *
 * Every result carries the numbers that produced it and a plain-language
 * explanation. Residents are told why a decision went the way it did, in the
 * same words the staff see. No black-box outcomes (First Principle #3).
 */

import type { VoteChoice, VoteThreshold } from '@prisma/client'
// Relative rather than the usual '@/' alias: the demo seed reaches this module
// through ts-node, which does not resolve tsconfig path aliases.
import {
  DECISION_TIMING,
  THRESHOLD_APPROVAL_PERCENT,
  THRESHOLD_LABELS,
} from '../config/decisions'

export type VoteOutcome =
  | 'ACCEPTED'
  | 'REJECTED'
  | 'NO_QUORUM'
  | 'BLOCKED' // Consensus required and someone vetoed

export interface TallyInput {
  votes: { choice: VoteChoice; reason?: string | null }[]
  /** Residents entitled to vote, snapshotted when voting opened. */
  eligibleVoterCount: number
  threshold: VoteThreshold
  /** Share of eligible residents who must participate. */
  quorumPercent: number
  /** Share of effective votes needed to pass. */
  approvalPercent: number
}

export interface TallyResult {
  outcome: VoteOutcome
  yes: number
  no: number
  abstain: number
  blocks: number
  /** Votes that count toward the threshold — abstentions excluded. */
  effectiveVotes: number
  castVotes: number
  eligibleVoterCount: number
  turnoutPercent: number
  approvalAchievedPercent: number
  quorumMet: boolean
  /**
   * Someone said "I cannot live with this". Under consensus that stops the
   * proposal; under a majority threshold it does not — but it always surfaces,
   * because a resident in distress about a house decision is exactly the
   * situation this system exists to catch early.
   */
  mediationRecommended: boolean
  /** German, resident-facing, states the numbers that decided it. */
  explanation: string
}

function percent(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.round((part / whole) * 100)
}

export function tallyVotes(input: TallyInput): TallyResult {
  const { votes, eligibleVoterCount, threshold, quorumPercent, approvalPercent } = input

  const yes = votes.filter((v) => v.choice === 'YES').length
  const no = votes.filter((v) => v.choice === 'NO').length
  const abstain = votes.filter((v) => v.choice === 'ABSTAIN').length
  const blocks = votes.filter((v) => v.choice === 'BLOCK').length

  const castVotes = votes.length
  // A veto is also a rejection of the proposal, so it counts against it.
  const effectiveVotes = yes + no + blocks

  const turnoutPercent = percent(castVotes, eligibleVoterCount)
  const approvalAchievedPercent = percent(yes, effectiveVotes)
  const quorumMet = eligibleVoterCount > 0 && turnoutPercent >= quorumPercent
  const mediationRecommended = blocks > 0

  const base = {
    yes,
    no,
    abstain,
    blocks,
    effectiveVotes,
    castVotes,
    eligibleVoterCount,
    turnoutPercent,
    approvalAchievedPercent,
    quorumMet,
    mediationRecommended,
  }

  if (!quorumMet) {
    return {
      ...base,
      outcome: 'NO_QUORUM',
      explanation:
        `Zu wenige Stimmen: ${castVotes} von ${eligibleVoterCount} Bewohnenden haben abgestimmt ` +
        `(${turnoutPercent}%). Nötig wären ${quorumPercent}%. Der Vorschlag kann neu gestartet werden.`,
    }
  }

  if (effectiveVotes === 0) {
    return {
      ...base,
      outcome: 'NO_QUORUM',
      explanation:
        `Alle ${castVotes} abgegebenen Stimmen waren Enthaltungen — es wurde keine Entscheidung getroffen.`,
    }
  }

  if (threshold === 'CONSENSUS' && blocks > 0) {
    return {
      ...base,
      outcome: 'BLOCKED',
      explanation:
        `${blocks === 1 ? 'Eine Person hat' : `${blocks} Personen haben`} ein Veto eingelegt. ` +
        `Für diesen Vorschlag braucht es Einstimmigkeit. Statt einer Abstimmung folgt nun ein Gespräch, ` +
        `damit die Bedenken gehört werden.`,
    }
  }

  const accepted = approvalAchievedPercent >= approvalPercent

  const numbers =
    `${yes} dafür, ${no} dagegen` +
    (blocks > 0 ? `, ${blocks} Veto` : '') +
    (abstain > 0 ? `, ${abstain} Enthaltung${abstain === 1 ? '' : 'en'}` : '') +
    ` (${castVotes} von ${eligibleVoterCount} haben abgestimmt).`

  const rule = `Nötig: ${THRESHOLD_LABELS[threshold]} — ${approvalPercent}% der zählenden Stimmen. Erreicht: ${approvalAchievedPercent}%.`

  return {
    ...base,
    outcome: accepted ? 'ACCEPTED' : 'REJECTED',
    explanation: accepted
      ? `Angenommen. ${numbers} ${rule}`
      : `Abgelehnt. ${numbers} ${rule}`,
  }
}

/**
 * Decides whether a unit is large enough for a vote to mean anything.
 * In a two-person household a "majority" is one person, so house rules there
 * are set with staff support instead of by ballot.
 */
export function canHoldVote(eligibleVoterCount: number): boolean {
  return eligibleVoterCount >= DECISION_TIMING.minimumEligibleVoters
}

/** Default policy snapshot for a new proposal, taken at the moment it opens. */
export function buildPolicySnapshot(threshold: VoteThreshold, eligibleVoterCount: number) {
  return {
    threshold,
    quorumPercent: DECISION_TIMING.quorumPercent,
    approvalPercent: THRESHOLD_APPROVAL_PERCENT[threshold],
    eligibleVoterCount,
  }
}

/**
 * Voting and discussion windows, computed from one clock reading so every
 * timestamp on a proposal is consistent.
 */
export function computeSchedule(from: Date) {
  const discussionEndsAt = new Date(from)
  discussionEndsAt.setDate(discussionEndsAt.getDate() + DECISION_TIMING.discussionDays)

  const votingEndsAt = new Date(discussionEndsAt)
  votingEndsAt.setDate(votingEndsAt.getDate() + DECISION_TIMING.votingDays)

  return { discussionEndsAt, votingEndsAt }
}
