/**
 * Seed adapter over the PRODUCT'S compatibility algorithm.
 *
 * This file used to contain a second, self-contained implementation of
 * compatibility scoring — 270 lines of it — because "ts-node doesn't resolve
 * path aliases". The cost of that shortcut was not duplication, it was
 * FICTION: the two implementations had drifted, and the seed was writing
 * scores into `Placement.compatibilityScore` that the real algorithm would
 * never produce. Concretely, at the point this was removed:
 *
 *   - the copy weighted lifestyle 30 / social 25 / practical 25 / risk 20;
 *     the product weights 35 / 25 / 20 / 20 (`RESIDENT_DIMENSIONS`);
 *   - the copy knew ONE cleanliness number, while the product has modelled
 *     cleanliness as three directional fields (practice, expectation, chaos
 *     tolerance) for months — so no seeded score could reflect the very
 *     asymmetry the algorithm page explains to staff.
 *
 * Every demo, screenshot and "Algorithmus-Genauigkeit" panel built on that
 * data was therefore describing software that does not exist. The alias
 * problem is solved where it belongs — `ts-node -r tsconfig-paths/register`
 * in the prisma seed command — and the algorithm has exactly one home again.
 *
 * Guarded by `src/lib/__tests__/scoring-ssot.test.ts`.
 */

import type { Resident } from '@prisma/client'
import { calculateCompatibility } from '@/lib/compatibility/scoring'
import { toResidentProfile } from '@/lib/compatibility/convert'

export interface SeedScoreResult {
  compatibilityScore: number
  lifestyleScore: number
  socialScore: number
  practicalScore: number
  riskScore: number
  strengths: string[]
  concerns: string[]
  recommendations: string[]
}

/**
 * Score two seeded residents exactly as `/matching` scores them.
 *
 * Field names differ from `CompatibilityScore` only because the Placement
 * columns are named that way; the NUMBERS come from the product.
 */
export function calculateScore(resident1: Resident, resident2: Resident): SeedScoreResult {
  const score = calculateCompatibility(
    toResidentProfile(resident1),
    toResidentProfile(resident2)
  )

  return {
    compatibilityScore: score.overall,
    lifestyleScore: score.lifestyle,
    socialScore: score.social,
    practicalScore: score.practical,
    riskScore: score.risk,
    strengths: score.strengths,
    concerns: score.concerns,
    recommendations: score.recommendations,
  }
}
