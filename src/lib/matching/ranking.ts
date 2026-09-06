/**
 * Why a unit sits where it sits in the match list.
 *
 * The compatibility score and the ranking are two different numbers, and the
 * product only ever explained the first. `/algorithm` documents the dimensions
 * and their weights; nothing documented the ORDER of the list, which is what a
 * staff member actually acts on — the top card is the one that gets placed.
 *
 * The sharpest consequence is that the ranking's stand-in for "fit" is the
 * ROOM score where a room can be scored (`roomFit?.score ?? apartmentFit`),
 * while the card headlines the APARTMENT score. A unit with a strong apartment
 * fit and a weak room can therefore rank below a unit whose displayed numbers
 * look worse, and the page gave no way to tell. `fitIsRoom` exists so the
 * explanation names which number is doing the work.
 *
 * This module is a pure extraction: `rankingScore` reproduces the arithmetic
 * that lived inline in the matching page, term for term, pinned against a
 * literal copy of the original expression in `__tests__/ranking.test.ts`.
 * Disclosing the reasoning must not change a single placement.
 *
 * Lower scores rank higher — the list sorts ascending. So a POSITIVE impact
 * pushes a unit down, and a NEGATIVE impact pulls it up.
 */

import type { UnitMetrics } from '@/lib/analytics/unit-metrics'

type RiskLevel = UnitMetrics['riskLevel']

export const RANKING_FACTOR_IDS = [
  'blockingIssue',
  'blockingConflicts',
  'roomBlocking',
  'highConflicts',
  'unitRisk',
  'unitConcerns',
  'roommateConcerns',
  'unscorableRoom',
  'fit',
  'sharedLanguages',
  'emptyUnit',
] as const

export type RankingFactorId = (typeof RANKING_FACTOR_IDS)[number]

/**
 * Historical conflict risk of the unit, as a ranking penalty.
 *
 * CRITICAL is 200 — deliberately larger than a full 100-point swing in fit,
 * because a house that keeps producing conflict is a worse bet than a good
 * paper match.
 */
export const UNIT_RISK_PENALTY: Record<RiskLevel, number> = {
  LOW: 0,
  MEDIUM: 50,
  HIGH: 100,
  CRITICAL: 200,
}

export interface RankingInput {
  /** A hard unit-level exclusion (wheelchair access, ground floor, smoking). */
  hasBlockingIssue: boolean
  blockingConflicts: number
  /** No assignable room, or the only one is blocked. */
  roomBlocking: boolean
  highConflicts: number
  riskLevel: RiskLevel | null
  unitConcerns: number
  roommateConcerns: number
  /** A room exists but cannot be scored yet — an unknown, not a good sign. */
  unscorableRoom: boolean
  /** The fit percentage the ranking actually uses. */
  fitScore: number
  /** True when `fitScore` came from a Zimmer rather than the whole apartment. */
  fitIsRoom: boolean
  sharedLanguages: number
  isEmptyUnit: boolean
}

export interface RankingFactor {
  id: RankingFactorId
  /** Positive pushes this unit DOWN the list; negative pulls it UP. */
  impact: number
  /** The count or percentage the impact was computed from. */
  detail: number
  /** Only on `unitRisk` — which level produced the penalty. */
  riskLevel?: RiskLevel
  /** Only on `fit` — whether the number is a room score or an apartment score. */
  fitIsRoom?: boolean
}

/**
 * Every term that moved this unit, strongest first. Terms worth zero are
 * dropped: "0 blockierende Konflikte" is noise, not an explanation.
 */
export function rankingFactors(input: RankingInput): RankingFactor[] {
  const riskPenalty = input.riskLevel ? UNIT_RISK_PENALTY[input.riskLevel] : 0

  const factors: RankingFactor[] = [
    { id: 'blockingIssue', impact: input.hasBlockingIssue ? 1000 : 0, detail: 1 },
    {
      id: 'blockingConflicts',
      impact: input.blockingConflicts * 500,
      detail: input.blockingConflicts,
    },
    { id: 'roomBlocking', impact: input.roomBlocking ? 400 : 0, detail: 1 },
    { id: 'highConflicts', impact: input.highConflicts * 100, detail: input.highConflicts },
    {
      id: 'unitRisk',
      impact: riskPenalty,
      detail: riskPenalty,
      ...(input.riskLevel ? { riskLevel: input.riskLevel } : {}),
    },
    { id: 'unitConcerns', impact: input.unitConcerns * 10, detail: input.unitConcerns },
    { id: 'roommateConcerns', impact: input.roommateConcerns, detail: input.roommateConcerns },
    { id: 'unscorableRoom', impact: input.unscorableRoom ? 15 : 0, detail: 1 },
    {
      id: 'fit',
      impact: -input.fitScore,
      detail: input.fitScore,
      fitIsRoom: input.fitIsRoom,
    },
    {
      id: 'sharedLanguages',
      impact: -input.sharedLanguages * 5,
      detail: input.sharedLanguages,
    },
    { id: 'emptyUnit', impact: input.isEmptyUnit ? -20 : 0, detail: 1 },
  ]

  return factors
    .filter((factor) => factor.impact !== 0)
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
}

/** The sort key. Lower ranks higher. */
export function rankingScore(input: RankingInput): number {
  return rankingFactors(input).reduce((sum, factor) => sum + factor.impact, 0)
}
