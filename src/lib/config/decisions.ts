/**
 * Decision Configuration — SSOT
 *
 * How a house reaches a decision: who decides, how many must agree, how long
 * the process runs.
 *
 * Design note — residents live here, but AOZ carries legal responsibility for
 * the building and for everyone in it. So "who decides" is not one answer, it
 * is a property of the topic:
 *
 *   RESIDENT_BINDING  — everyday life together (kitchen, cleaning, quiet times).
 *                       The residents' decision stands on its own.
 *   RESIDENT_ADVISORY — topics with consequences beyond the house (guests,
 *                       costs). Residents decide, staff confirm.
 *   STAFF_ONLY        — safety and non-discrimination. Residents may propose and
 *                       be heard, but these are not put to a vote: a majority
 *                       must not be able to vote away a minority's safety.
 *
 * That last line is the reason this table exists at all.
 */

import type { DecisionMode, ProposalStatus, RuleCategory, VoteChoice, VoteThreshold } from '@prisma/client'

// =============================================================================
// WHO DECIDES — per rule category
// =============================================================================

export const CATEGORY_DECISION_MODE: Record<RuleCategory, DecisionMode> = {
  SAFETY: 'STAFF_ONLY',
  RESPECT: 'STAFF_ONLY',
  NOISE: 'RESIDENT_BINDING',
  CLEANLINESS: 'RESIDENT_BINDING',
  KITCHEN: 'RESIDENT_BINDING',
  BATHROOM: 'RESIDENT_BINDING',
  GUESTS: 'RESIDENT_ADVISORY',
  SHARED_SPACES: 'RESIDENT_BINDING',
  COSTS: 'RESIDENT_ADVISORY',
  COMMUNICATION: 'RESIDENT_BINDING',
  OTHER: 'RESIDENT_ADVISORY',
}

export const DECISION_MODE_LABELS: Record<DecisionMode, string> = {
  RESIDENT_BINDING: 'Das Haus entscheidet',
  RESIDENT_ADVISORY: 'Haus entscheidet, Betreuung bestätigt',
  STAFF_ONLY: 'Die Betreuung entscheidet',
}

export const DECISION_MODE_DESCRIPTIONS: Record<DecisionMode, string> = {
  RESIDENT_BINDING:
    'Die Bewohnenden stimmen ab. Das Ergebnis gilt direkt als Hausregel.',
  RESIDENT_ADVISORY:
    'Die Bewohnenden stimmen ab. Die Betreuung prüft danach nur, ob das Ergebnis mit den AOZ-Regeln und dem Mietrecht vereinbar ist.',
  STAFF_ONLY:
    'Bei Sicherheit und Respekt wird nicht abgestimmt — diese Regeln schützen Einzelne und dürfen nicht überstimmt werden. Vorschläge sind trotzdem willkommen und werden beantwortet.',
}

// =============================================================================
// HOW MANY MUST AGREE — per rule category
// =============================================================================

/**
 * Rules that restrict what others may do need a broader agreement than rules
 * that only organise shared work. A cleaning rota is a simple majority; a rule
 * that limits when your visitors may come is not.
 */
export const CATEGORY_THRESHOLD: Record<RuleCategory, VoteThreshold> = {
  SAFETY: 'SIMPLE_MAJORITY', // staff-decided; threshold is advisory only
  RESPECT: 'SIMPLE_MAJORITY', // staff-decided; threshold is advisory only
  NOISE: 'SUPERMAJORITY',
  CLEANLINESS: 'SIMPLE_MAJORITY',
  KITCHEN: 'SIMPLE_MAJORITY',
  BATHROOM: 'SIMPLE_MAJORITY',
  GUESTS: 'SUPERMAJORITY',
  SHARED_SPACES: 'SIMPLE_MAJORITY',
  COSTS: 'SUPERMAJORITY',
  COMMUNICATION: 'SIMPLE_MAJORITY',
  OTHER: 'SIMPLE_MAJORITY',
}

/** Share of *cast* votes (excluding abstentions) needed to pass. */
export const THRESHOLD_APPROVAL_PERCENT: Record<VoteThreshold, number> = {
  CONSENSUS: 100,
  SUPERMAJORITY: 67,
  SIMPLE_MAJORITY: 51,
}

export const THRESHOLD_LABELS: Record<VoteThreshold, string> = {
  CONSENSUS: 'Einstimmig',
  SUPERMAJORITY: 'Zwei Drittel',
  SIMPLE_MAJORITY: 'Mehrheit',
}

export const THRESHOLD_DESCRIPTIONS: Record<VoteThreshold, string> = {
  CONSENSUS: 'Alle, die abstimmen, müssen einverstanden sein.',
  SUPERMAJORITY: 'Mindestens zwei Drittel der abgegebenen Stimmen (ohne Enthaltungen).',
  SIMPLE_MAJORITY: 'Mehr als die Hälfte der abgegebenen Stimmen (ohne Enthaltungen).',
}

// =============================================================================
// PROCESS TIMING
// =============================================================================

export const DECISION_TIMING = {
  /** Days a proposal stays open for discussion before voting starts. */
  discussionDays: 3,
  /** Days the vote stays open. Long enough for shift workers and appointments. */
  votingDays: 7,
  /** Share of eligible residents who must cast a vote for the result to count. */
  quorumPercent: 50,
  /**
   * Below this many eligible voters a vote is meaningless (one person's absence
   * flips everything). Such units get staff-set house rules instead.
   */
  minimumEligibleVoters: 3,
} as const

// =============================================================================
// VOTE CHOICES
// =============================================================================

export const VOTE_CHOICE_LABELS: Record<VoteChoice, string> = {
  YES: 'Dafür',
  NO: 'Dagegen',
  ABSTAIN: 'Enthaltung',
  BLOCK: 'Veto',
}

export const VOTE_CHOICE_DESCRIPTIONS: Record<VoteChoice, string> = {
  YES: 'Ich bin einverstanden.',
  NO: 'Ich bin nicht einverstanden, akzeptiere aber das Ergebnis.',
  ABSTAIN: 'Ich möchte nicht mitentscheiden. Zählt nicht zum Ergebnis.',
  BLOCK:
    'Damit kann ich nicht leben — bitte sag warum. Ein Veto stoppt den Vorschlag und führt zu einem Gespräch, nicht zu einer Niederlage.',
}

export const VOTE_CHOICE_COLORS: Record<VoteChoice, string> = {
  YES: 'bg-status-success/15 text-status-success-text',
  NO: 'bg-status-error/15 text-status-error-text',
  ABSTAIN: 'bg-ui-subtle text-ui-muted',
  BLOCK: 'bg-status-warning/15 text-status-warning-text',
}

/** A veto must be explained — otherwise it cannot be mediated. */
export const VOTE_CHOICE_REQUIRES_REASON: Record<VoteChoice, boolean> = {
  YES: false,
  NO: false,
  ABSTAIN: false,
  BLOCK: true,
}

// =============================================================================
// PROPOSAL STATUS
// =============================================================================

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  DISCUSSION: 'In Diskussion',
  VOTING: 'Abstimmung läuft',
  NEEDS_STAFF_CONFIRMATION: 'Wartet auf Betreuung',
  ACCEPTED: 'Angenommen',
  REJECTED: 'Abgelehnt',
  WITHDRAWN: 'Zurückgezogen',
  VETOED: 'Von der Betreuung abgelehnt',
  EXPIRED: 'Abgelaufen (zu wenige Stimmen)',
}

export const PROPOSAL_STATUS_COLORS: Record<ProposalStatus, string> = {
  DISCUSSION: 'bg-status-info/15 text-status-info-text',
  VOTING: 'bg-aoz-primary/10 text-aoz-primary',
  NEEDS_STAFF_CONFIRMATION: 'bg-status-warning/15 text-status-warning-text',
  ACCEPTED: 'bg-status-success/15 text-status-success-text',
  REJECTED: 'bg-ui-subtle text-ui-muted',
  WITHDRAWN: 'bg-ui-subtle text-ui-muted',
  VETOED: 'bg-status-error/15 text-status-error-text',
  EXPIRED: 'bg-ui-subtle text-ui-muted',
}

/** Statuses where residents can still act (comment, vote, withdraw). */
export const OPEN_PROPOSAL_STATUSES: ProposalStatus[] = [
  'DISCUSSION',
  'VOTING',
  'NEEDS_STAFF_CONFIRMATION',
]

export const PROPOSAL_TYPE_LABELS = {
  ADD_RULE: 'Neue Hausregel',
  AMEND_RULE: 'Hausregel ändern',
  REPEAL_RULE: 'Hausregel aufheben',
  HOUSE_DECISION: 'Einmaliger Beschluss',
} as const
