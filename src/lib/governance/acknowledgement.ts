/**
 * Rule acknowledgement — pure functions, no I/O.
 *
 * The cheapest conflict prevention there is. A large share of "roommate
 * conflicts" are not disagreements at all — they are one person following a
 * norm another person was never told about. Tracking who has seen which version
 * of which rule turns that from a guess into a fact.
 *
 * Acknowledgement is per rule *version*: amending a rule makes everyone see it
 * again. Nobody is held to wording they never saw.
 */

import { PREVENTION_CONFIG } from '@/lib/config/conflict-resolution'
import type { RuleLike } from './rules'

export interface AcknowledgementLike {
  ruleId: string
  residentId: string
  ruleVersion: number
}

export interface OutstandingRule {
  rule: RuleLike
  /** True when the resident acknowledged an older version of this rule. */
  isAmendment: boolean
  acknowledgedVersion?: number
}

/** Rules this resident has not acknowledged at their current version. */
export function outstandingForResident(
  rules: RuleLike[],
  acknowledgements: AcknowledgementLike[],
  residentId: string
): OutstandingRule[] {
  const mine = acknowledgements.filter((a) => a.residentId === residentId)
  const highestByRule = new Map<string, number>()

  for (const ack of mine) {
    const current = highestByRule.get(ack.ruleId) ?? 0
    if (ack.ruleVersion > current) highestByRule.set(ack.ruleId, ack.ruleVersion)
  }

  return rules
    .filter((rule) => (highestByRule.get(rule.id) ?? 0) < rule.version)
    .map((rule) => {
      const acknowledgedVersion = highestByRule.get(rule.id)
      return {
        rule,
        isAmendment: acknowledgedVersion !== undefined,
        acknowledgedVersion,
      }
    })
}

export interface UnitAcknowledgementCoverage {
  totalRules: number
  totalResidents: number
  /** Acknowledgements needed for full coverage. */
  requiredAcknowledgements: number
  completedAcknowledgements: number
  coveragePercent: number
  /** Residents with at least one rule they have never seen at its current version. */
  residentsWithGaps: { residentId: string; outstandingCount: number }[]
  /** True when the house is running on rules some residents were never shown. */
  needsAttention: boolean
}

/**
 * How well a unit's residents actually know the rules they live under.
 * This is the leading indicator; incidents are the lagging one.
 */
export function unitCoverage(
  rules: RuleLike[],
  acknowledgements: AcknowledgementLike[],
  residentIds: string[]
): UnitAcknowledgementCoverage {
  const residentsWithGaps = residentIds
    .map((residentId) => ({
      residentId,
      outstandingCount: outstandingForResident(rules, acknowledgements, residentId).length,
    }))
    .filter((r) => r.outstandingCount > 0)

  const requiredAcknowledgements = rules.length * residentIds.length
  const outstandingTotal = residentsWithGaps.reduce((sum, r) => sum + r.outstandingCount, 0)
  const completedAcknowledgements = requiredAcknowledgements - outstandingTotal

  return {
    totalRules: rules.length,
    totalResidents: residentIds.length,
    requiredAcknowledgements,
    completedAcknowledgements,
    coveragePercent:
      requiredAcknowledgements === 0
        ? 100
        : Math.round((completedAcknowledgements / requiredAcknowledgements) * 100),
    residentsWithGaps,
    needsAttention: outstandingTotal >= PREVENTION_CONFIG.unacknowledgedRuleAlertCount,
  }
}

/**
 * Whether a newly placed resident is still inside the grace period for seeing
 * the house rules. Used to distinguish "just arrived" from "has been living
 * under rules they never read for two months".
 */
export function isWithinAcknowledgementGracePeriod(placementStart: Date, now: Date): boolean {
  const deadline = new Date(placementStart)
  deadline.setDate(deadline.getDate() + PREVENTION_CONFIG.ruleAcknowledgementDays)
  return now <= deadline
}
