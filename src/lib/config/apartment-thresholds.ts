/**
 * Configuration for apartment aggregate compatibility thresholds
 *
 * SSOT for conflict severity levels and fit score interpretation
 */

export const APARTMENT_THRESHOLDS = {
  /**
   * Cleanliness level difference thresholds (1-5 scale)
   */
  cleanliness: {
    BLOCKING: 3, // 3+ levels difference (e.g., 1 vs 4.5)
    HIGH: 2, // 2+ levels difference
    MEDIUM: 1.5, // 1.5+ levels difference
  },

  /**
   * Cleanliness fit is scored 0-100 by the directional model rather than by an
   * absolute difference, so it needs its own bands. Lower score = more friction.
   * @see lib/compatibility/cleanliness.ts
   */
  cleanlinessFit: {
    BLOCKING: 40, // Someone will be persistently unhappy
    HIGH: 60,
    MEDIUM: 75,
    HARMONIOUS: 95, // Nobody's expectation goes unmet
  },

  /**
   * Noise tolerance difference thresholds (1-5 scale)
   */
  noiseTolerance: {
    HIGH: 3, // 3+ levels difference
    MEDIUM: 2, // 2+ levels difference
  },

  /**
   * Chores contribution difference thresholds (1-5 scale)
   */
  choresContribution: {
    MEDIUM: 3, // 3+ levels difference
    LOW: 2, // 2+ levels difference
  },

  /**
   * Night disturbances percentage thresholds
   */
  nightDisturbances: {
    HIGH: 30, // 30%+ of residents have night disturbances
  },

  /**
   * Sleep schedule dominance threshold
   */
  sleepScheduleDominance: {
    STRONG: 70, // 70%+ have the same schedule
  },

  /**
   * Fit score interpretation (0-100)
   */
  fitScore: {
    EXCELLENT: 80, // 80+ = Excellent fit
    GOOD: 60, // 60-79 = Good fit
    ACCEPTABLE: 40, // 40-59 = Acceptable with mitigations
    // Below 40 = Poor fit
  },
} as const

/**
 * Get color class for fit score display
 */
export function getFitScoreColor(score: number): string {
  if (score >= APARTMENT_THRESHOLDS.fitScore.EXCELLENT) {
    return 'text-score-excellent-text'
  }
  if (score >= APARTMENT_THRESHOLDS.fitScore.GOOD) {
    return 'text-score-medium-text'
  }
  if (score >= APARTMENT_THRESHOLDS.fitScore.ACCEPTABLE) {
    return 'text-score-low-text'
  }
  return 'text-score-critical-text'
}

export function getFitScoreBgColor(score: number): string {
  if (score >= APARTMENT_THRESHOLDS.fitScore.EXCELLENT) {
    return 'bg-status-success/10 border-status-success/25'
  }
  if (score >= APARTMENT_THRESHOLDS.fitScore.GOOD) {
    return 'bg-status-warning/10 border-status-warning/25'
  }
  if (score >= APARTMENT_THRESHOLDS.fitScore.ACCEPTABLE) {
    return 'bg-status-warning/10 border-status-warning/40'
  }
  return 'bg-status-error/8 border-status-error/25'
}

/**
 * Get label for fit score
 */
export function getFitScoreLabel(score: number): string {
  if (score >= APARTMENT_THRESHOLDS.fitScore.EXCELLENT) {
    return 'Sehr gut'
  }
  if (score >= APARTMENT_THRESHOLDS.fitScore.GOOD) {
    return 'Gut'
  }
  if (score >= APARTMENT_THRESHOLDS.fitScore.ACCEPTABLE) {
    return 'Akzeptabel'
  }
  return 'Kritisch'
}
