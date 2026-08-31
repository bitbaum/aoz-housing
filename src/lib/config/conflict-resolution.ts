/**
 * Conflict Resolution Configuration — SSOT
 *
 * A ladder, not a queue. Most conflicts between people who live together are
 * solved best and fastest by the people themselves, early, with support
 * available. Each rung is tried before the next, and every rung ends in a
 * concrete agreement with a review date — so "resolved" means something
 * checkable rather than a note in a text field.
 *
 * Two hard limits on the ladder, both deliberate:
 *
 *  1. Safety never starts at the bottom. Nobody is asked to "go and talk it
 *     out" with someone who threatened or hurt them. Violence, threats and
 *     harassment enter at staff level, immediately.
 *  2. Escalation is not punishment. Moving up a rung means the previous step
 *     did not hold — it says nothing about who was at fault.
 */

import type {
  IncidentCategory,
  IncidentSeverity,
  ResolutionStage,
  AgreementStatus,
} from '@prisma/client'

// =============================================================================
// THE LADDER
// =============================================================================

export interface ResolutionStageDef {
  stage: ResolutionStage
  /** Position in the ladder; CLOSED sits outside it. */
  rung: number
  label: string
  /** What actually happens on this rung, in resident-facing language. */
  description: string
  /** Who is responsible for moving it forward. */
  owner: 'RESIDENTS' | 'PEERS' | 'STAFF'
  /** Days before this rung should be checked on, from when it was entered. */
  targetDays: number
}

export const RESOLUTION_LADDER: readonly ResolutionStageDef[] = [
  {
    stage: 'REPORTED',
    rung: 0,
    label: 'Gemeldet',
    description:
      'Der Konflikt ist erfasst. Die Betreuung schaut ihn an und entscheidet, wie es weitergeht.',
    owner: 'STAFF',
    targetDays: 2,
  },
  {
    stage: 'SELF_RESOLUTION',
    rung: 1,
    label: 'Direktes Gespräch',
    description:
      'Die Beteiligten sprechen zuerst selbst miteinander. Die Betreuung hilft auf Wunsch bei der Vorbereitung — zum Beispiel mit Dolmetschung oder einem ruhigen Raum.',
    owner: 'RESIDENTS',
    targetDays: 7,
  },
  {
    stage: 'PEER_MEDIATION',
    rung: 2,
    label: 'Vermittlung im Haus',
    description:
      'Eine dritte Person aus dem Haus vermittelt, oder das Thema kommt an die Hausversammlung. Hilfreich, wenn es alle betrifft.',
    owner: 'PEERS',
    targetDays: 10,
  },
  {
    stage: 'STAFF_MEDIATION',
    rung: 3,
    label: 'Vermittlung durch die Betreuung',
    description:
      'Die Betreuung führt ein moderiertes Gespräch mit allen Beteiligten und hält die Abmachung schriftlich fest.',
    owner: 'STAFF',
    targetDays: 14,
  },
  {
    stage: 'FORMAL_MEASURE',
    rung: 4,
    label: 'Formelle Massnahme',
    description:
      'Wenn nichts anderes trägt: schriftliche Verwarnung, Zimmerwechsel, Verlegung oder — bei Straftaten — Einbezug der Polizei.',
    owner: 'STAFF',
    targetDays: 7,
  },
  {
    stage: 'CLOSED',
    rung: 99,
    label: 'Abgeschlossen',
    description: 'Der Konflikt ist gelöst und die Abmachung hat gehalten.',
    owner: 'STAFF',
    targetDays: 0,
  },
] as const

export const RESOLUTION_STAGE_BY_KEY: Record<ResolutionStage, ResolutionStageDef> =
  RESOLUTION_LADDER.reduce(
    (acc, def) => ({ ...acc, [def.stage]: def }),
    {} as Record<ResolutionStage, ResolutionStageDef>,
  )

export const RESOLUTION_STAGE_LABELS: Record<ResolutionStage, string> = RESOLUTION_LADDER.reduce(
  (acc, def) => ({ ...acc, [def.stage]: def.label }),
  {} as Record<ResolutionStage, string>,
)

export const RESOLUTION_STAGE_COLORS: Record<ResolutionStage, string> = {
  REPORTED: 'bg-status-info/15 text-status-info-text',
  SELF_RESOLUTION: 'bg-brand-primary/10 text-brand-primary',
  PEER_MEDIATION: 'bg-brand-primary/10 text-brand-primary',
  STAFF_MEDIATION: 'bg-status-warning/15 text-status-warning-text',
  FORMAL_MEASURE: 'bg-status-error/15 text-status-error-text',
  CLOSED: 'bg-status-success/15 text-status-success-text',
}

export const RESOLUTION_OWNER_LABELS: Record<ResolutionStageDef['owner'], string> = {
  RESIDENTS: 'Die Beteiligten',
  PEERS: 'Das Haus',
  STAFF: 'Betreuung',
}

// =============================================================================
// WHERE A CONFLICT ENTERS THE LADDER
// =============================================================================

/**
 * Severities that must never be routed to a resident-to-resident conversation.
 * Asking someone to negotiate with a person who threatened them is not
 * mediation, it is exposure.
 */
export const SEVERITY_ENTRY_STAGE: Record<IncidentSeverity, ResolutionStage> = {
  LOW: 'SELF_RESOLUTION',
  MEDIUM: 'SELF_RESOLUTION',
  HIGH: 'STAFF_MEDIATION',
  CRITICAL: 'FORMAL_MEASURE',
}

/**
 * Categories that bypass the lower rungs regardless of recorded severity.
 * A safety report is a staff matter from the first minute.
 */
export const CATEGORIES_REQUIRING_STAFF_ENTRY: IncidentCategory[] = ['SAFETY']

/**
 * Incident types where self-resolution is never appropriate, even when someone
 * logged them as low severity. Severity is a judgement call made under time
 * pressure; these types are not.
 */
export const TYPES_REQUIRING_STAFF_ENTRY = ['SAFETY_CONCERN'] as const

// =============================================================================
// AGREEMENTS
// =============================================================================

export const AGREEMENT_STATUS_LABELS: Record<AgreementStatus, string> = {
  PROPOSED: 'Vorgeschlagen',
  ACCEPTED: 'Vereinbart',
  HELD: 'Hat gehalten',
  BROKEN: 'Nicht eingehalten',
  EXPIRED: 'Überfällig',
}

export const AGREEMENT_STATUS_COLORS: Record<AgreementStatus, string> = {
  PROPOSED: 'bg-status-info/15 text-status-info-text',
  ACCEPTED: 'bg-brand-primary/10 text-brand-primary',
  HELD: 'bg-status-success/15 text-status-success-text',
  BROKEN: 'bg-status-error/15 text-status-error-text',
  EXPIRED: 'bg-status-warning/15 text-status-warning-text',
}

export const AGREEMENT_CONFIG = {
  /** Default days until an agreement is reviewed. Short enough to still matter. */
  defaultReviewDays: 14,
  /** Days after the review date before an unreviewed agreement counts as expired. */
  expiryGraceDays: 7,
} as const

/**
 * Prompts for writing an agreement that can actually be checked later.
 * Vague agreements ("be more considerate") are the main reason mediation fails
 * twice on the same conflict.
 */
export const AGREEMENT_QUALITY_HINTS: readonly string[] = [
  'Was genau tut wer? (nicht «mehr Rücksicht», sondern «Kopfhörer nach 22 Uhr»)',
  'Ab wann gilt es?',
  'Woran merken wir in zwei Wochen, dass es funktioniert hat?',
]

// =============================================================================
// PREVENTION — the cheapest conflict is the one that never starts
// =============================================================================

export const PREVENTION_CONFIG = {
  /**
   * Days after a placement starts within which the new resident should have
   * seen and acknowledged the house rules. Most "new roommate" conflicts are
   * norm conflicts, and a norm nobody communicated is not a rule.
   */
  ruleAcknowledgementDays: 7,
  /**
   * A unit with this many unacknowledged rules is flagged: the house is
   * operating on rules some residents have never been shown.
   */
  unacknowledgedRuleAlertCount: 1,
} as const
