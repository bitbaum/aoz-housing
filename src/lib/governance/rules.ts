/**
 * Rule hierarchy resolution — pure functions, no I/O.
 *
 * The rule book a resident sees is not "AOZ rules" and "house rules" side by
 * side. It is one book: each AOZ topic, and underneath it whatever this house
 * decided on that topic. That structure is what makes the two tiers legible —
 * you can always see which AOZ rule a house rule lives under, and which topics
 * are still open for the house to decide.
 */

import type {
  DecisionMode,
  ProposalStatus,
  RuleCategory,
  RuleDelegation,
  RuleScope,
  RuleStatus,
} from '@prisma/client'
import {
  DELEGATION_ALLOWS_UNIT_RULE,
  DELEGATION_REQUIRES_STAFF_CONFIRMATION,
  RULE_CATEGORY_ORDER,
} from '@/lib/config/house-rules'
import { BRAND } from '@/lib/config/brand'
import type { VoteOutcome } from './voting'

/** The minimum shape these functions need — keeps them testable without a DB. */
export interface RuleLike {
  id: string
  scope: RuleScope
  key?: string | null
  category: RuleCategory
  title: string
  body: string
  delegation: RuleDelegation
  parentRuleId?: string | null
  status: RuleStatus
  version: number
  housingUnitId?: string | null
}

// =============================================================================
// WHAT A HOUSE MAY DECIDE
// =============================================================================

export interface LegislationCheck {
  allowed: boolean
  requiresStaffConfirmation: boolean
  /** Resident-facing reason — shown when the answer is no. */
  reason: string
}

/**
 * May this house make its own rule under this AOZ topic?
 *
 * Checked when a proposal is created, not after the vote. Letting a house
 * debate and vote for a week on something that was never permitted, and only
 * then vetoing it, is the fastest way to make residents stop participating.
 */
export function checkUnitLegislation(orgRule: RuleLike): LegislationCheck {
  if (orgRule.scope !== 'ORG') {
    return {
      allowed: false,
      requiresStaffConfirmation: false,
      reason: `Eine Hausregel kann nur zu einer ${BRAND.orgName}-Regel gehören.`,
    }
  }

  if (orgRule.status !== 'ACTIVE') {
    return {
      allowed: false,
      requiresStaffConfirmation: false,
      reason: `Diese ${BRAND.orgName}-Regel ist nicht mehr gültig.`,
    }
  }

  if (!DELEGATION_ALLOWS_UNIT_RULE[orgRule.delegation]) {
    return {
      allowed: false,
      requiresStaffConfirmation: false,
      reason:
        `«${orgRule.title}» ist eine nicht verhandelbare ${BRAND.orgName}-Regel. ` +
        `Sie schützt alle im Haus und kann nicht durch einen Hausbeschluss geändert werden. ` +
        `Anliegen dazu nimmt die Betreuung entgegen.`,
    }
  }

  return {
    allowed: true,
    requiresStaffConfirmation: DELEGATION_REQUIRES_STAFF_CONFIRMATION[orgRule.delegation],
    reason: '',
  }
}

// =============================================================================
// FROM VOTE RESULT TO PROPOSAL STATUS
// =============================================================================

/**
 * A vote result is not automatically a decision. Advisory topics and anything
 * claiming to strengthen an AOZ rule go to staff for confirmation first —
 * "stricter, never looser" cannot be checked mechanically on free text, so the
 * system routes it to a human instead of pretending to validate it.
 */
export function resolveProposalStatus(
  outcome: VoteOutcome,
  decisionMode: DecisionMode,
  requiresStaffConfirmation: boolean,
): ProposalStatus {
  if (outcome === 'NO_QUORUM') return 'EXPIRED'
  if (outcome === 'BLOCKED') return 'REJECTED'
  if (outcome === 'REJECTED') return 'REJECTED'

  // Accepted by the house — does anyone else have to sign off?
  if (decisionMode === 'RESIDENT_ADVISORY' || requiresStaffConfirmation) {
    return 'NEEDS_STAFF_CONFIRMATION'
  }
  return 'ACCEPTED'
}

// =============================================================================
// THE RULE BOOK
// =============================================================================

export interface RuleBookEntry {
  orgRule: RuleLike
  /** House rules adopted under this AOZ topic. */
  unitRules: RuleLike[]
  /** Whether this house can still decide something here. */
  houseMayDecide: boolean
  requiresStaffConfirmation: boolean
}

export interface RuleBookSection {
  category: RuleCategory
  entries: RuleBookEntry[]
}

export interface RuleBook {
  sections: RuleBookSection[]
  /**
   * House rules whose parent AOZ rule is missing or archived. Surfaced rather
   * than dropped — a rule that silently disappears from the book is a rule
   * people are still being held to without seeing it.
   */
  orphanedUnitRules: RuleLike[]
  totalOrgRules: number
  totalUnitRules: number
}

/**
 * Build the merged rule book for one housing unit.
 * `unitRules` should already be filtered to that unit.
 */
export function buildRuleBook(orgRules: RuleLike[], unitRules: RuleLike[]): RuleBook {
  const activeOrg = orgRules.filter((r) => r.scope === 'ORG' && r.status === 'ACTIVE')
  const activeUnit = unitRules.filter((r) => r.scope === 'UNIT' && r.status === 'ACTIVE')

  const orgById = new Map(activeOrg.map((r) => [r.id, r]))
  const childrenByParent = new Map<string, RuleLike[]>()
  const orphanedUnitRules: RuleLike[] = []

  for (const unitRule of activeUnit) {
    const parentId = unitRule.parentRuleId
    if (!parentId || !orgById.has(parentId)) {
      orphanedUnitRules.push(unitRule)
      continue
    }
    const siblings = childrenByParent.get(parentId) ?? []
    siblings.push(unitRule)
    childrenByParent.set(parentId, siblings)
  }

  const sections: RuleBookSection[] = []

  for (const category of RULE_CATEGORY_ORDER) {
    const entries = activeOrg
      .filter((r) => r.category === category)
      .map((orgRule) => {
        const check = checkUnitLegislation(orgRule)
        return {
          orgRule,
          unitRules: childrenByParent.get(orgRule.id) ?? [],
          houseMayDecide: check.allowed,
          requiresStaffConfirmation: check.requiresStaffConfirmation,
        }
      })

    if (entries.length > 0) {
      sections.push({ category, entries })
    }
  }

  return {
    sections,
    orphanedUnitRules,
    totalOrgRules: activeOrg.length,
    totalUnitRules: activeUnit.length,
  }
}

/**
 * Topics this house has not yet legislated on but could — the honest answer to
 * "what can we actually decide here?", which is the first question residents
 * ask and the hardest one to answer from a flat list of rules.
 */
export function openTopics(ruleBook: RuleBook): RuleBookEntry[] {
  return ruleBook.sections
    .flatMap((s) => s.entries)
    .filter((e) => e.houseMayDecide && e.unitRules.length === 0)
}

/** Every rule that binds a resident of this unit, flattened, in book order. */
export function flattenRuleBook(ruleBook: RuleBook): RuleLike[] {
  const flat: RuleLike[] = []
  for (const section of ruleBook.sections) {
    for (const entry of section.entries) {
      flat.push(entry.orgRule)
      flat.push(...entry.unitRules)
    }
  }
  flat.push(...ruleBook.orphanedUnitRules)
  return flat
}
