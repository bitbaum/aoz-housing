import { describe, expect, it } from 'vitest'

import {
  rankingFactors,
  rankingScore,
  UNIT_RISK_PENALTY,
  type RankingInput,
} from '@/lib/matching/ranking'

/**
 * The extraction must not change a single placement.
 *
 * `rankingScore` replaces an expression that lived inline in the matching page.
 * Disclosing the reasoning is the point; re-weighting it is emphatically not —
 * a silent change here would reorder every match list in the product, and
 * nobody would be able to tell from the outside that anything had moved.
 *
 * So the original expression is copied here verbatim and both are run over a
 * few hundred generated inputs. This is the one place the duplication is
 * correct: it is a fixed historical record, not a second source of truth.
 */
function originalSortScore(input: RankingInput): number {
  const unitRiskPenalty = input.riskLevel
    ? input.riskLevel === 'CRITICAL'
      ? 200
      : input.riskLevel === 'HIGH'
        ? 100
        : input.riskLevel === 'MEDIUM'
          ? 50
          : 0
    : 0

  return (
    (input.hasBlockingIssue ? 1000 : 0) +
    input.blockingConflicts * 500 +
    (input.roomBlocking ? 400 : 0) +
    input.highConflicts * 100 +
    unitRiskPenalty +
    input.unitConcerns * 10 +
    input.roommateConcerns +
    (input.unscorableRoom ? 15 : 0) -
    input.fitScore -
    input.sharedLanguages * 5 -
    (input.isEmptyUnit ? 20 : 0)
  )
}

/** Deterministic, so a failure is reproducible rather than a Heisenbug. */
function makeRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

function generateInputs(count: number): RankingInput[] {
  const random = makeRandom(20260907)
  const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', null] as const
  const pick = (max: number) => Math.floor(random() * (max + 1))

  return Array.from({ length: count }, () => ({
    hasBlockingIssue: random() < 0.2,
    blockingConflicts: pick(3),
    roomBlocking: random() < 0.2,
    highConflicts: pick(4),
    riskLevel: levels[pick(levels.length - 1)],
    unitConcerns: pick(5),
    roommateConcerns: pick(12),
    unscorableRoom: random() < 0.3,
    fitScore: pick(100),
    fitIsRoom: random() < 0.5,
    sharedLanguages: pick(4),
    isEmptyUnit: random() < 0.3,
  }))
}

describe('the extraction preserves the ranking exactly', () => {
  it('agrees with the original expression on generated inputs', () => {
    const inputs = generateInputs(500)
    const disagreements = inputs.filter((input) => rankingScore(input) !== originalSortScore(input))
    expect(disagreements).toEqual([])
  })

  it('agrees on the all-zero case, where every term drops out', () => {
    const empty: RankingInput = {
      hasBlockingIssue: false,
      blockingConflicts: 0,
      roomBlocking: false,
      highConflicts: 0,
      riskLevel: 'LOW',
      unitConcerns: 0,
      roommateConcerns: 0,
      unscorableRoom: false,
      fitScore: 0,
      fitIsRoom: false,
      sharedLanguages: 0,
      isEmptyUnit: false,
    }
    expect(rankingScore(empty)).toBe(originalSortScore(empty))
    // And it explains nothing, rather than listing eleven zeroes.
    expect(rankingFactors(empty)).toEqual([])
  })

  it('keeps the risk penalties the sort was built on', () => {
    expect(UNIT_RISK_PENALTY).toEqual({ LOW: 0, MEDIUM: 50, HIGH: 100, CRITICAL: 200 })
  })
})

describe('the explanation', () => {
  const base: RankingInput = {
    hasBlockingIssue: false,
    blockingConflicts: 0,
    roomBlocking: false,
    highConflicts: 0,
    riskLevel: 'LOW',
    unitConcerns: 0,
    roommateConcerns: 0,
    unscorableRoom: false,
    fitScore: 80,
    fitIsRoom: false,
    sharedLanguages: 0,
    isEmptyUnit: false,
  }

  it('names the strongest reason first', () => {
    const factors = rankingFactors({ ...base, hasBlockingIssue: true, sharedLanguages: 2 })
    expect(factors[0]?.id).toBe('blockingIssue')
  })

  it('drops terms that did nothing', () => {
    const ids = rankingFactors(base).map((factor) => factor.id)
    expect(ids).toEqual(['fit'])
  })

  it('says whether the fit number is the room or the apartment', () => {
    // The card headlines the APARTMENT score while the ranking prefers the
    // ROOM score, so the two can point opposite ways. Naming which one ranked
    // the card is the whole reason this factor carries a flag.
    const room = rankingFactors({ ...base, fitIsRoom: true }).find((f) => f.id === 'fit')
    const apartment = rankingFactors({ ...base, fitIsRoom: false }).find((f) => f.id === 'fit')
    expect(room?.fitIsRoom).toBe(true)
    expect(apartment?.fitIsRoom).toBe(false)
  })

  it('carries the risk level, so the label need not re-derive it from the penalty', () => {
    const factor = rankingFactors({ ...base, riskLevel: 'HIGH' }).find((f) => f.id === 'unitRisk')
    expect(factor?.riskLevel).toBe('HIGH')
    expect(factor?.impact).toBe(100)
  })

  it('signs the factors so "helps" and "hurts" are readable off the impact', () => {
    const factors = rankingFactors({ ...base, sharedLanguages: 3, roommateConcerns: 4 })
    const byId = Object.fromEntries(factors.map((factor) => [factor.id, factor.impact]))
    expect(byId.sharedLanguages).toBeLessThan(0)
    expect(byId.fit).toBeLessThan(0)
    expect(byId.roommateConcerns).toBeGreaterThan(0)
  })

  it('sums to the sort key, so the explanation cannot omit a term', () => {
    // If a factor is ever added to the score but not to the list, the shown
    // reasons stop adding up to the order — the exact drift this module exists
    // to prevent.
    for (const input of generateInputs(50)) {
      const summed = rankingFactors(input).reduce((total, factor) => total + factor.impact, 0)
      expect(summed).toBe(rankingScore(input))
    }
  })
})
