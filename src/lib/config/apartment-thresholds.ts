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
    return 'text-green-600'
  }
  if (score >= APARTMENT_THRESHOLDS.fitScore.GOOD) {
    return 'text-yellow-600'
  }
  if (score >= APARTMENT_THRESHOLDS.fitScore.ACCEPTABLE) {
    return 'text-orange-600'
  }
  return 'text-red-600'
}

/**
 * Get background color class for fit score display
 */
export function getFitScoreBgColor(score: number): string {
  if (score >= APARTMENT_THRESHOLDS.fitScore.EXCELLENT) {
    return 'bg-green-50 border-green-200'
  }
  if (score >= APARTMENT_THRESHOLDS.fitScore.GOOD) {
    return 'bg-yellow-50 border-yellow-200'
  }
  if (score >= APARTMENT_THRESHOLDS.fitScore.ACCEPTABLE) {
    return 'bg-orange-50 border-orange-200'
  }
  return 'bg-red-50 border-red-200'
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
