/**
 * Cleanliness compatibility — directional, not symmetric.
 *
 * A single "cleanliness level" cannot express the situation that actually
 * produces conflict in shared housing. Three separate things matter:
 *
 *   practice     — how much cleanliness a person keeps themselves
 *   expectation  — how much they expect from the people they live with
 *   chaosTolerance — how much mess and disorder they can actually live with
 *
 * These come apart constantly:
 *   - Tidy but relaxed (practice 5, expectation 2, tolerance 5) lives happily
 *     with almost anyone. A symmetric model wrongly scores them as a bad match
 *     for a messy roommate.
 *   - Messy but demanding (practice 2, expectation 5, tolerance 1) is a
 *     conflict source for everyone around them, and a symmetric model scores
 *     them as a *good* match for another messy person.
 *
 * So friction is computed per direction: what A expects of B, measured against
 * what B actually does, softened by how much A can live with. The pair is only
 * as comfortable as its least comfortable member.
 */

import { CLEANLINESS_MODEL } from '@/lib/config/scoring-scales'

export interface CleanlinessProfile {
  cleanlinessPractice: number // 1-5
  cleanlinessExpectation: number // 1-5
  chaosTolerance: number // 1-5
}

export interface DirectionalFriction {
  /** Raw unmet expectation, 0-4: how far the other falls short of what I want. */
  gap: number
  /** Gap after accounting for how much disorder I can live with, 0-4. */
  feltFriction: number
  /** 0-100, where 100 means nothing about the other person bothers me. */
  score: number
}

/**
 * How much the `observer` is likely to be bothered by the `subject`.
 * Deliberately asymmetric: this is the whole point.
 */
export function frictionBetween(
  observer: CleanlinessProfile,
  subject: CleanlinessProfile,
): DirectionalFriction {
  // Only unmet expectation creates friction. Someone cleaner than I require
  // does not bother me — a symmetric absolute difference gets this wrong.
  const gap = Math.max(0, observer.cleanlinessExpectation - subject.cleanlinessPractice)

  // High tolerance for chaos dampens the same gap; low tolerance amplifies it.
  const toleranceFactor =
    (CLEANLINESS_MODEL.toleranceScaleMax + 1 - observer.chaosTolerance) /
    CLEANLINESS_MODEL.toleranceScaleMax

  const feltFriction = gap * toleranceFactor

  return {
    gap,
    feltFriction,
    score: clamp(100 - feltFriction * CLEANLINESS_MODEL.frictionPenaltyPerPoint, 0, 100),
  }
}

export interface CleanlinessPairResult {
  score: number
  aTowardB: DirectionalFriction
  bTowardA: DirectionalFriction
  /** Which side is expected to be unhappy — what staff actually need to know. */
  direction: 'NONE' | 'A_BOTHERED_BY_B' | 'B_BOTHERED_BY_A' | 'MUTUAL'
  note?: string
}

/**
 * Cleanliness compatibility for a pair. The score is the *worse* direction: a
 * household in which one person is miserable is not a compatible household,
 * however content the other one is.
 */
export function scoreCleanlinessPair(
  a: CleanlinessProfile,
  b: CleanlinessProfile,
): CleanlinessPairResult {
  const aTowardB = frictionBetween(a, b)
  const bTowardA = frictionBetween(b, a)

  const aBothered = aTowardB.feltFriction >= CLEANLINESS_MODEL.notableFrictionThreshold
  const bBothered = bTowardA.feltFriction >= CLEANLINESS_MODEL.notableFrictionThreshold

  let direction: CleanlinessPairResult['direction'] = 'NONE'
  if (aBothered && bBothered) direction = 'MUTUAL'
  else if (aBothered) direction = 'A_BOTHERED_BY_B'
  else if (bBothered) direction = 'B_BOTHERED_BY_A'

  const note =
    direction === 'NONE'
      ? undefined
      : direction === 'MUTUAL'
        ? 'Beide erwarten mehr Sauberkeit, als die andere Person hält'
        : 'Unterschiedliche Sauberkeitsansprüche — eine Person wird sich stören'

  return {
    score: Math.min(aTowardB.score, bTowardA.score),
    aTowardB,
    bTowardA,
    direction,
    note,
  }
}

/**
 * Someone who expects noticeably more from others than they contribute
 * themselves. Worth surfacing because it predicts a specific, recurring
 * pattern: repeated complaints about others plus low participation in the
 * cleaning rota. Naming it early lets staff address it as a fairness question
 * rather than as a series of separate incidents.
 */
export function hasDoubleStandard(profile: CleanlinessProfile): boolean {
  return (
    profile.cleanlinessExpectation - profile.cleanlinessPractice >=
    CLEANLINESS_MODEL.doubleStandardThreshold
  )
}

/**
 * How demanding a person is overall — high expectation combined with low
 * tolerance. These residents are the most sensitive to placement, and the most
 * likely to benefit from a house with an explicit cleaning rota.
 */
export function isHighMaintenance(profile: CleanlinessProfile): boolean {
  return (
    profile.cleanlinessExpectation >= CLEANLINESS_MODEL.highExpectationThreshold &&
    profile.chaosTolerance <= CLEANLINESS_MODEL.lowToleranceThreshold
  )
}

export interface CleanlinessGroupResult {
  /** Worst pairwise score between the candidate and any existing resident. */
  score: number
  /** Existing residents likely to be bothered by the candidate. */
  botheredByCandidate: number
  /** Whether the candidate is likely to be bothered by the existing household. */
  candidateBothered: boolean
  note?: string
}

/**
 * Fit between a candidate and an existing household.
 *
 * Uses the worst pair rather than the group average: one incompatible pairing
 * produces conflict regardless of how well the candidate matches everyone else,
 * and averaging hides exactly the pairing that will generate the incidents.
 */
export function scoreCleanlinessAgainstGroup(
  candidate: CleanlinessProfile,
  existing: CleanlinessProfile[],
): CleanlinessGroupResult {
  if (existing.length === 0) {
    return { score: 100, botheredByCandidate: 0, candidateBothered: false }
  }

  const pairs = existing.map((resident) => scoreCleanlinessPair(candidate, resident))

  const score = Math.min(...pairs.map((p) => p.score))
  const botheredByCandidate = pairs.filter(
    (p) => p.direction === 'B_BOTHERED_BY_A' || p.direction === 'MUTUAL',
  ).length
  const candidateBothered = pairs.some(
    (p) => p.direction === 'A_BOTHERED_BY_B' || p.direction === 'MUTUAL',
  )

  let note: string | undefined
  if (botheredByCandidate > 0 && candidateBothered) {
    note = `Sauberkeit: gegenseitige Reibung mit ${botheredByCandidate} von ${existing.length} Personen zu erwarten`
  } else if (botheredByCandidate > 0) {
    note = `Sauberkeit: ${botheredByCandidate} von ${existing.length} Personen werden sich voraussichtlich stören`
  } else if (candidateBothered) {
    note =
      'Sauberkeit: die neue Person wird die Wohnung voraussichtlich als zu unordentlich empfinden'
  }

  return { score, botheredByCandidate, candidateBothered, note }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
