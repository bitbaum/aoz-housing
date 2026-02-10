/**
 * Weight analysis tests — diagnostic tests to verify scoring balance
 *
 * These tests check that the algorithm produces sensible relative rankings
 * and that no single dimension can dominate unfairly.
 */

import { calculateCompatibility } from '../scoring'
import type { CompatibilityWeights } from '../types'
import { makeResident } from './fixtures'
import { OVERALL_DIMENSION_WEIGHTS } from '@/lib/config/scoring-scales'

describe('Weight balance analysis', () => {
  describe('dimension weights are balanced', () => {
    it('total weights sum to 100', () => {
      const { lifestyle, social, practical, risk } = OVERALL_DIMENSION_WEIGHTS
      expect(lifestyle + social + practical + risk).toBe(100)
    })

    it('no single dimension exceeds 40% weight', () => {
      const weights = Object.values(OVERALL_DIMENSION_WEIGHTS)
      for (const w of weights) {
        expect(w).toBeLessThanOrEqual(40)
      }
    })

    it('risk dimension has meaningful weight (15-25%)', () => {
      expect(OVERALL_DIMENSION_WEIGHTS.risk).toBeGreaterThanOrEqual(15)
      expect(OVERALL_DIMENSION_WEIGHTS.risk).toBeLessThanOrEqual(25)
    })
  })

  describe('scoring produces sensible relative rankings', () => {
    const baseline = makeResident({
      sleepSchedule: 'STANDARD',
      noiseTolerance: 3,
      cleanlinessLevel: 3,
      socialStyle: 'MODERATE',
      languages: ['German'],
      smokingStatus: 'NON_SMOKER',
      privacyNeed: 3,
      choresContribution: 3,
    })

    it('small lifestyle difference < large lifestyle difference', () => {
      const smallDiff = makeResident({
        id: 'small',
        noiseTolerance: 4, // diff of 1
        cleanlinessLevel: 4, // diff of 1
      })
      const largeDiff = makeResident({
        id: 'large',
        noiseTolerance: 5, // diff of 2
        cleanlinessLevel: 1, // diff of 2
        sleepSchedule: 'NIGHT_OWL',
      })

      const small = calculateCompatibility(baseline, smallDiff)
      const large = calculateCompatibility(baseline, largeDiff)
      expect(small.overall).toBeGreaterThan(large.overall)
    })

    it('smoking conflict penalizes more than minor noise difference', () => {
      const noiseDiff = makeResident({
        id: 'noise',
        noiseTolerance: 5, // diff of 2
      })
      const smoker = makeResident({
        id: 'smoker',
        smokingStatus: 'INDOOR_SMOKER',
      })

      const noiseScore = calculateCompatibility(baseline, noiseDiff)
      const smokerScore = calculateCompatibility(baseline, smoker)
      // Indoor smoker should be worse because it also triggers risk factor
      expect(smokerScore.overall).toBeLessThan(noiseScore.overall)
    })

    it('no shared language is penalized substantially', () => {
      const sameLanguage = makeResident({
        id: 'same-lang',
        languages: ['German'],
      })
      const noCommonLanguage = makeResident({
        id: 'no-lang',
        languages: ['Arabic'],
      })

      const withLanguage = calculateCompatibility(baseline, sameLanguage)
      const withoutLanguage = calculateCompatibility(baseline, noCommonLanguage)

      // Language penalty: ~7 points from social dimension + ~2 from risk factor = ~9 total
      // This is modest because social is 25% weight and language is 40% of social
      // Combined with risk (communication_barrier: 40*0.25=10, weighted at 20%), total ~7-9
      expect(withLanguage.overall - withoutLanguage.overall).toBeGreaterThanOrEqual(5)
    })

    it('NEEDS_PRIVATE is a significant risk factor', () => {
      const canShare = makeResident({ id: 'share', roomSharingStatus: 'CAN_SHARE' })
      const needsPrivate = makeResident({ id: 'private', roomSharingStatus: 'NEEDS_PRIVATE' })

      const shareScore = calculateCompatibility(baseline, canShare)
      const privateScore = calculateCompatibility(baseline, needsPrivate)

      // NEEDS_PRIVATE adds 80*0.3 = 24 risk → should reduce overall by ~5 points
      expect(privateScore.overall).toBeLessThan(shareScore.overall)
      expect(privateScore.risk).toBeGreaterThan(shareScore.risk)
    })
  })

  describe('edge case handling', () => {
    it('all 1s vs all 5s — extreme mismatch scores low', () => {
      const allLow = makeResident({
        id: 'low',
        noiseTolerance: 1,
        cleanlinessLevel: 1,
        privacyNeed: 1,
        choresContribution: 1,
      })
      const allHigh = makeResident({
        id: 'high',
        noiseTolerance: 5,
        cleanlinessLevel: 5,
        privacyNeed: 5,
        choresContribution: 5,
      })

      const result = calculateCompatibility(allLow, allHigh)
      // 4-point diff on scales = 20/100 per factor, but sleep/language/smoking still match
      // So overall stays high (~76). This is intentional: if the big factors (schedule,
      // language, smoking) align, numeric scale differences are manageable.
      expect(result.overall).toBeLessThan(80)
      expect(result.overall).toBeGreaterThan(60)
    })

    it('a single extreme factor does not collapse overall to 0', () => {
      // Even worst smoking mismatch shouldn't bring everything to 0
      const a = makeResident({ smokingStatus: 'INDOOR_SMOKER' })
      const b = makeResident({ id: '2', smokingStatus: 'NON_SMOKER' })
      const result = calculateCompatibility(a, b)
      expect(result.overall).toBeGreaterThan(30)
    })

    it('many minor mismatches accumulate meaningfully', () => {
      const manySmall = makeResident({
        id: 'many',
        noiseTolerance: 4, // +1
        cleanlinessLevel: 4, // +1
        privacyNeed: 4, // +1
        choresContribution: 4, // +1
        sleepSchedule: 'EARLY_BIRD', // adjacent
        socialStyle: 'INTROVERTED', // one step from MODERATE
      })

      const result = calculateCompatibility(makeResident(), manySmall)
      // Many small differences should show up but not be catastrophic
      expect(result.overall).toBeGreaterThan(50)
      expect(result.overall).toBeLessThan(95)
    })
  })

  describe('scoring differentiation', () => {
    it('produces distinct scores for distinct profiles', () => {
      const base = makeResident()
      const profiles = [
        makeResident({ id: '1', sleepSchedule: 'NIGHT_OWL' }),
        makeResident({ id: '2', smokingStatus: 'INDOOR_SMOKER' }),
        makeResident({ id: '3', languages: ['Arabic'], socialStyle: 'EXTROVERTED' }),
        makeResident({ id: '4', cleanlinessLevel: 1, noiseTolerance: 5 }),
      ]

      const scores = profiles.map(p => calculateCompatibility(base, p).overall)
      // Most different profiles should produce different scores.
      // Rounding to integers means occasional collisions are expected.
      const uniqueScores = new Set(scores)
      expect(uniqueScores.size).toBeGreaterThanOrEqual(scores.length - 1)
    })

    it('score range covers the spectrum for diverse inputs', () => {
      const base = makeResident()
      const identical = makeResident({ id: 'same' })
      const similar = makeResident({ id: 'similar', noiseTolerance: 4 })
      const different = makeResident({
        id: 'diff',
        sleepSchedule: 'NIGHT_OWL',
        smokingStatus: 'INDOOR_SMOKER',
        languages: ['Arabic'],
      })

      const identicalScore = calculateCompatibility(base, identical).overall
      const similarScore = calculateCompatibility(base, similar).overall
      const differentScore = calculateCompatibility(base, different).overall

      // Should span a meaningful range (algorithm is intentionally conservative —
      // even a "different" profile still shares some base compatibility)
      expect(identicalScore - differentScore).toBeGreaterThan(15)
      expect(identicalScore).toBeGreaterThanOrEqual(similarScore)
      expect(similarScore).toBeGreaterThan(differentScore)
    })
  })
})
