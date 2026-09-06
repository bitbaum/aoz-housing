/**
 * A ranking factor as a sentence a staff member can read.
 *
 * Kept out of `ranking.ts` so the arithmetic stays free of copy, and out of the
 * card so a second surface cannot describe the same factor differently.
 *
 * The switch is exhaustive over `RankingFactorId` with no `default`, on
 * purpose: adding a term to the ranking without giving it words is then a
 * compile error rather than a factor that silently renders as nothing. That is
 * the failure this whole change exists to prevent, one level up.
 */

import { RANKING_LABELS } from '@/lib/constants'

import type { RankingFactor } from './ranking'

export function describeRankingFactor(factor: RankingFactor): string {
  const labels = RANKING_LABELS.factors

  switch (factor.id) {
    case 'blockingIssue':
      return labels.blockingIssue()
    case 'blockingConflicts':
      return labels.blockingConflicts(factor.detail)
    case 'roomBlocking':
      return labels.roomBlocking()
    case 'highConflicts':
      return labels.highConflicts(factor.detail)
    case 'unitRisk':
      return RANKING_LABELS.riskLevels[factor.riskLevel ?? 'LOW']
    case 'unitConcerns':
      return labels.unitConcerns(factor.detail)
    case 'roommateConcerns':
      return labels.roommateConcerns(factor.detail)
    case 'unscorableRoom':
      return labels.unscorableRoom()
    case 'fit':
      return factor.fitIsRoom ? labels.roomFit(factor.detail) : labels.apartmentFit(factor.detail)
    case 'sharedLanguages':
      return labels.sharedLanguages(factor.detail)
    case 'emptyUnit':
      return labels.emptyUnit()
  }
}

/** Pulls the unit UP the list. */
export function isHelpingFactor(factor: RankingFactor): boolean {
  return factor.impact < 0
}
