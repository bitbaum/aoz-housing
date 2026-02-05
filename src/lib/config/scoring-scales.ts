/**
 * Scoring Scale Configuration - Single Source of Truth
 *
 * Defines multipliers for converting 1-5 differences into 0-100 scores.
 * Used in compatibility scoring algorithm.
 *
 * Formula: score = 100 - (difference × multiplier)
 * Example: noiseTolerance diff of 2 → 100 - (2 × 20) = 60
 *
 * @see CLAUDE.md - Config over code principle
 * @see lib/compatibility/scoring.ts
 */

/**
 * Scale factors for lifestyle dimension
 * Higher multiplier = more impact per level of difference
 */
export const LIFESTYLE_SCALES = {
  /** Noise tolerance difference multiplier (0-5 scale) */
  noiseTolerance: 20,
  /** Cleanliness level difference multiplier (0-5 scale) */
  cleanlinessLevel: 20,
} as const

/**
 * Scale factors for social dimension
 */
export const SOCIAL_SCALES = {
  /** Privacy need difference multiplier (0-5 scale) */
  privacyNeed: 15,
} as const

/**
 * Scale factors for practical dimension
 */
export const PRACTICAL_SCALES = {
  /** Chores contribution difference multiplier (0-5 scale) */
  choresContribution: 20,
} as const

/**
 * Weight percentages within each dimension
 * These determine how much each factor contributes to its dimension score
 */
export const DIMENSION_WEIGHTS = {
  lifestyle: {
    sleepSchedule: 40,
    noiseTolerance: 30,
    cleanliness: 30,
  },
  social: {
    language: 40,
    socialStyle: 35,
    privacyNeed: 25,
  },
  practical: {
    smoking: 40,
    sharedSpaces: 30,
    chores: 20,
    pets: 5,
    dietary: 5,
  },
} as const

/**
 * Overall dimension weights for final score
 */
export const OVERALL_DIMENSION_WEIGHTS = {
  lifestyle: 30,
  social: 25,
  practical: 25,
  risk: 20,
} as const
