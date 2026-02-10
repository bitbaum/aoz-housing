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
  /** Guest tolerance difference multiplier (0-5 scale) */
  guestTolerance: 20,
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
 * These determine how much each factor contributes to its dimension score.
 * Must match the hardcoded weights in scoring.ts factor arrays.
 *
 * Research justification for v2.0 changes documented in algorithm-docs.ts
 */
export const DIMENSION_WEIGHTS = {
  lifestyle: {
    sleepSchedule: 35,   // #1 conflict trigger (PMC cortisol study)
    cleanliness: 30,     // #1-2 conflict trigger (Kansas State/ASU)
    noiseTolerance: 25,  // Top-5 trigger (Brunnenhof, GdW)
    guestTolerance: 10,  // Top-5 trigger (national survey, 31k students)
  },
  social: {
    language: 35,        // "Central factor" (BFH)
    privacyNeed: 30,     // "Critical" (BFH-HSLU 2024)
    socialStyle: 25,     // Big Five support (IJIP)
    conflictStyle: 10,   // Agreeableness effect (IJIP, PMC 2024)
  },
  practical: {
    smoking: 45,         // Non-negotiable (Wuppertal Institut)
    sharedSpaces: 25,    // Functional requirement
    chores: 15,          // Moderate evidence (Kansas State)
    pets: 10,            // Lower conflict evidence
    dietary: 5,          // Minimal conflict evidence
  },
} as const

/**
 * Overall dimension weights for final score
 *
 * v2.0 changes:
 * - Lifestyle: 30 → 35 (sleep + cleanliness are #1-2 conflict triggers)
 * - Practical: 25 → 20 (secondary factors have less conflict evidence)
 */
export const OVERALL_DIMENSION_WEIGHTS = {
  lifestyle: 35,
  social: 25,
  practical: 20,
  risk: 20,
} as const
