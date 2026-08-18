/**
 * Discrimination Safeguard Validation
 *
 * Explicit code-level checks to prevent the compatibility algorithm
 * from producing scores that could enable proxy discrimination.
 *
 * Validates that low scores are not driven by a single factor
 * (language, age, etc.) which could serve as proxies for
 * ethnicity, nationality, or other protected characteristics.
 */

import type { CompatibilityScore, ResidentProfile } from './types'
import { DISCRIMINATION_SAFEGUARD_THRESHOLDS as THRESHOLDS } from '@/lib/config/thresholds'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SafeguardResult {
  safe: boolean
  warnings: SafeguardWarning[]
}

export interface SafeguardWarning {
  type: 'LANGUAGE_ONLY' | 'AGE_ONLY' | 'SINGLE_DIMENSION' | 'EXTREME_GAP'
  message: string // German — shown to staff
  detail: string // English — for logging
}

// ─────────────────────────────────────────────────────────────────────────────
// Age distance map
// ─────────────────────────────────────────────────────────────────────────────

const AGE_ORDER = ['YOUNG_ADULT', 'ADULT', 'MIDDLE_AGED', 'SENIOR'] as const

function ageDistance(a: string, b: string): number {
  const idxA = AGE_ORDER.indexOf(a as typeof AGE_ORDER[number])
  const idxB = AGE_ORDER.indexOf(b as typeof AGE_ORDER[number])
  if (idxA === -1 || idxB === -1) return 0
  return Math.abs(idxA - idxB)
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Safeguard Check
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a compatibility score for potential discrimination patterns.
 *
 * Should be called after `calculateCompatibility()` to flag results
 * that may need human review before acting on them.
 *
 * Returns { safe: true, warnings: [] } if no concerns,
 * or { safe: false, warnings: [...] } with specific concerns.
 */
export function validateScoreForDiscrimination(
  score: CompatibilityScore,
  resident1: ResidentProfile,
  resident2: ResidentProfile,
): SafeguardResult {
  const warnings: SafeguardWarning[] = []

  // Only check low scores — high scores don't pose discrimination risk
  if (score.overall >= THRESHOLDS.lowScoreReview) {
    return { safe: true, warnings: [] }
  }

  // ── Check 1: Language-only low score ───────────────────────────────
  // If social dimension is the only low one and residents share no languages,
  // the low score may be driven entirely by language barrier.
  const sharedLanguages = resident1.languages.filter(l =>
    resident2.languages.includes(l)
  )

  if (
    sharedLanguages.length <= THRESHOLDS.languageOverlapMax &&
    score.social < THRESHOLDS.languageOnlySocialMax &&
    score.lifestyle >= THRESHOLDS.languageOnlyOtherDimensionMin &&
    score.practical >= THRESHOLDS.languageOnlyOtherDimensionMin
  ) {
    warnings.push({
      type: 'LANGUAGE_ONLY',
      message: 'Tiefe Bewertung basiert hauptsächlich auf fehlender gemeinsamer Sprache. Andere Faktoren zeigen gute Kompatibilität.',
      detail: `Low score (${score.overall}) driven by language barrier only. Lifestyle=${score.lifestyle}, Practical=${score.practical}, Social=${score.social}. Shared languages: ${sharedLanguages.length}`,
    })
  }

  // ── Check 2: Age-only low score ────────────────────────────────────
  // Large age gap shouldn't be the sole reason for a low score.
  const ageDist = ageDistance(resident1.ageRange, resident2.ageRange)
  if (
    ageDist >= THRESHOLDS.ageGapSteps &&
    score.risk > THRESHOLDS.ageOnlyRiskMin &&
    score.lifestyle >= THRESHOLDS.ageOnlyOtherDimensionMin &&
    score.practical >= THRESHOLDS.ageOnlyOtherDimensionMin &&
    score.social >= THRESHOLDS.ageOnlyOtherDimensionMin
  ) {
    warnings.push({
      type: 'AGE_ONLY',
      message: 'Tiefe Bewertung basiert hauptsächlich auf Altersunterschied. Prüfen Sie, ob andere Kompatibilitätsfaktoren berücksichtigt wurden.',
      detail: `Low score (${score.overall}) may be driven by age gap (${resident1.ageRange} vs ${resident2.ageRange}, distance=${ageDist}). Other dimensions are acceptable.`,
    })
  }

  // ── Check 3: Single dimension pulling score down ───────────────────
  // If one dimension is dramatically lower than the rest, flag it.
  const dimensions = [
    { name: 'Lebensstil', score: score.lifestyle },
    { name: 'Sozial', score: score.social },
    { name: 'Praktisch', score: score.practical },
  ]
  const avgDimension = dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length

  for (const dim of dimensions) {
    const othersAvg = dimensions
      .filter(d => d.name !== dim.name)
      .reduce((s, d) => s + d.score, 0) / (dimensions.length - 1)

    if (dim.score < othersAvg - THRESHOLDS.dimensionGap && dim.score < THRESHOLDS.singleDimensionAbsoluteMax) {
      warnings.push({
        type: 'SINGLE_DIMENSION',
        message: `Dimension "${dim.name}" ist deutlich niedriger als andere (${dim.score} vs. Ø${Math.round(othersAvg)}). Prüfen Sie die Einzelfaktoren.`,
        detail: `Single dimension ${dim.name}=${dim.score} is ${Math.round(othersAvg - dim.score)} points below others avg (${Math.round(othersAvg)}). Overall=${score.overall}`,
      })
    }
  }

  // ── Check 4: Very low score needs human review ─────────────────────
  if (score.overall < 20 && warnings.length === 0) {
    warnings.push({
      type: 'EXTREME_GAP',
      message: 'Sehr tiefe Kompatibilitätsbewertung. Bitte prüfen Sie die Einzelfaktoren vor einer Entscheidung.',
      detail: `Extremely low score (${score.overall}) without specific pattern. Manual review recommended.`,
    })
  }

  return {
    safe: warnings.length === 0,
    warnings,
  }
}
