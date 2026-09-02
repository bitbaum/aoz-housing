import { tallyVotes, canHoldVote, computeSchedule, buildPolicySnapshot } from '../voting'
import type { VoteChoice } from '@/lib/db'
import { DECISION_TIMING, THRESHOLD_APPROVAL_PERCENT } from '@/lib/config/decisions'

function votes(spec: Partial<Record<VoteChoice, number>>) {
  const out: { choice: VoteChoice }[] = []
  for (const [choice, count] of Object.entries(spec)) {
    for (let i = 0; i < (count ?? 0); i++) out.push({ choice: choice as VoteChoice })
  }
  return out
}

const majority = {
  threshold: 'SIMPLE_MAJORITY' as const,
  quorumPercent: 50,
  approvalPercent: THRESHOLD_APPROVAL_PERCENT.SIMPLE_MAJORITY,
}

describe('tallyVotes', () => {
  it('accepts a proposal that clears quorum and threshold', () => {
    const result = tallyVotes({
      votes: votes({ YES: 6, NO: 2 }),
      eligibleVoterCount: 10,
      ...majority,
    })

    expect(result.outcome).toBe('ACCEPTED')
    expect(result.approvalAchievedPercent).toBe(75)
    expect(result.quorumMet).toBe(true)
    expect(result.explanation).toContain('Angenommen')
    // The numbers that decided it must be in the explanation residents read.
    expect(result.explanation).toContain('6 dafür')
    expect(result.explanation).toContain('8 von 10')
  })

  it('rejects when turnout is below quorum, even if everyone voted yes', () => {
    const result = tallyVotes({ votes: votes({ YES: 3 }), eligibleVoterCount: 10, ...majority })

    expect(result.outcome).toBe('NO_QUORUM')
    expect(result.quorumMet).toBe(false)
    expect(result.explanation).toContain('Zu wenige Stimmen')
  })

  it('excludes abstentions from the threshold but counts them for quorum', () => {
    // 5 of 8 participated (62% > 50% quorum); of the 3 effective votes, 2 are yes (67%).
    const result = tallyVotes({
      votes: votes({ YES: 2, NO: 1, ABSTAIN: 2 }),
      eligibleVoterCount: 8,
      ...majority,
    })

    expect(result.quorumMet).toBe(true)
    expect(result.effectiveVotes).toBe(3)
    expect(result.approvalAchievedPercent).toBe(67)
    expect(result.outcome).toBe('ACCEPTED')
  })

  it('treats an all-abstention vote as no decision rather than acceptance', () => {
    const result = tallyVotes({ votes: votes({ ABSTAIN: 6 }), eligibleVoterCount: 6, ...majority })

    expect(result.outcome).toBe('NO_QUORUM')
    expect(result.explanation).toContain('Enthaltungen')
  })

  it('requires a supermajority to reach two thirds', () => {
    const supermajority = {
      threshold: 'SUPERMAJORITY' as const,
      quorumPercent: 50,
      approvalPercent: THRESHOLD_APPROVAL_PERCENT.SUPERMAJORITY,
    }
    // 60% yes clears a simple majority but not two thirds.
    const result = tallyVotes({
      votes: votes({ YES: 6, NO: 4 }),
      eligibleVoterCount: 10,
      ...supermajority,
    })

    expect(result.approvalAchievedPercent).toBe(60)
    expect(result.outcome).toBe('REJECTED')
  })

  it('lets a single veto stop a consensus proposal', () => {
    const result = tallyVotes({
      votes: votes({ YES: 9, BLOCK: 1 }),
      eligibleVoterCount: 10,
      threshold: 'CONSENSUS',
      quorumPercent: 50,
      approvalPercent: THRESHOLD_APPROVAL_PERCENT.CONSENSUS,
    })

    expect(result.outcome).toBe('BLOCKED')
    expect(result.mediationRecommended).toBe(true)
    // A veto must route to a conversation, not read as a defeat.
    expect(result.explanation).toContain('Gespräch')
  })

  it('does not let a veto override a majority threshold, but still flags mediation', () => {
    // Otherwise any single resident could veto every house decision.
    const result = tallyVotes({
      votes: votes({ YES: 8, BLOCK: 1 }),
      eligibleVoterCount: 10,
      ...majority,
    })

    expect(result.outcome).toBe('ACCEPTED')
    expect(result.mediationRecommended).toBe(true)
  })

  it('counts a veto against the proposal in the tally', () => {
    // 5 yes, 5 block => 50%, below the 51% simple majority.
    const result = tallyVotes({
      votes: votes({ YES: 5, BLOCK: 5 }),
      eligibleVoterCount: 10,
      ...majority,
    })

    expect(result.effectiveVotes).toBe(10)
    expect(result.approvalAchievedPercent).toBe(50)
    expect(result.outcome).toBe('REJECTED')
  })

  it('handles a unit with no eligible voters without dividing by zero', () => {
    const result = tallyVotes({ votes: [], eligibleVoterCount: 0, ...majority })

    expect(result.outcome).toBe('NO_QUORUM')
    expect(result.turnoutPercent).toBe(0)
    expect(result.approvalAchievedPercent).toBe(0)
  })
})

describe('canHoldVote', () => {
  it('refuses a vote in a household too small for a majority to mean anything', () => {
    expect(canHoldVote(2)).toBe(false)
    expect(canHoldVote(DECISION_TIMING.minimumEligibleVoters)).toBe(true)
  })
})

describe('buildPolicySnapshot', () => {
  it('snapshots the approval bar so a past decision stays explainable', () => {
    const snapshot = buildPolicySnapshot('SUPERMAJORITY', 12)

    expect(snapshot.approvalPercent).toBe(THRESHOLD_APPROVAL_PERCENT.SUPERMAJORITY)
    expect(snapshot.quorumPercent).toBe(DECISION_TIMING.quorumPercent)
    expect(snapshot.eligibleVoterCount).toBe(12)
  })
})

describe('computeSchedule', () => {
  it('runs discussion before voting and derives both from one clock reading', () => {
    const start = new Date('2026-03-01T09:00:00Z')
    const { discussionEndsAt, votingEndsAt } = computeSchedule(start)

    expect(discussionEndsAt.getTime()).toBeGreaterThan(start.getTime())
    expect(votingEndsAt.getTime()).toBeGreaterThan(discussionEndsAt.getTime())

    const votingDays = Math.round(
      (votingEndsAt.getTime() - discussionEndsAt.getTime()) / (24 * 60 * 60 * 1000),
    )
    expect(votingDays).toBe(DECISION_TIMING.votingDays)
  })
})
