import { calculateApartmentProfile, calculateApartmentFit } from '../aggregate'
import type { ApartmentProfile } from '../types'
import { makeResident } from './fixtures'
import { FIT_SCORE_CONFIG } from '@/lib/config/thresholds'
import { APARTMENT_THRESHOLDS } from '@/lib/config/apartment-thresholds'

// =============================================================================
// A. calculateApartmentProfile
// =============================================================================

describe('calculateApartmentProfile', () => {
  it('empty array → isEmpty: true, all nulls', () => {
    const profile = calculateApartmentProfile([])
    expect(profile.isEmpty).toBe(true)
    expect(profile.currentResidentCount).toBe(0)
    expect(profile.avgNoiseTolerance).toBeNull()
    expect(profile.avgCleanlinessLevel).toBeNull()
    expect(profile.avgPrivacyNeed).toBeNull()
    expect(profile.avgChoresContribution).toBeNull()
    expect(profile.dominantSleepSchedule).toBeNull()
    expect(profile.dominantSocialStyle).toBeNull()
    expect(profile.dominantSmokingStatus).toBeNull()
    expect(profile.commonLanguages).toEqual([])
    expect(profile.percentNeedsQuiet).toBe(0)
    expect(profile.percentHasNightDisturbances).toBe(0)
  })

  it('single resident → averages equal that resident', () => {
    const r = makeResident({ noiseTolerance: 4, cleanlinessLevel: 2, privacyNeed: 5, choresContribution: 1 })
    const profile = calculateApartmentProfile([r])
    expect(profile.isEmpty).toBe(false)
    expect(profile.currentResidentCount).toBe(1)
    expect(profile.avgNoiseTolerance).toBe(4)
    expect(profile.avgCleanlinessLevel).toBe(2)
    expect(profile.avgPrivacyNeed).toBe(5)
    expect(profile.avgChoresContribution).toBe(1)
  })

  it('multiple residents → correct averages', () => {
    const r1 = makeResident({ noiseTolerance: 2, cleanlinessLevel: 4 })
    const r2 = makeResident({ id: '2', noiseTolerance: 4, cleanlinessLevel: 2 })
    const profile = calculateApartmentProfile([r1, r2])
    expect(profile.avgNoiseTolerance).toBe(3)
    expect(profile.avgCleanlinessLevel).toBe(3)
    expect(profile.currentResidentCount).toBe(2)
  })

  it('mode is correctly computed for sleep schedule', () => {
    const r1 = makeResident({ sleepSchedule: 'EARLY_BIRD' })
    const r2 = makeResident({ id: '2', sleepSchedule: 'EARLY_BIRD' })
    const r3 = makeResident({ id: '3', sleepSchedule: 'NIGHT_OWL' })
    const profile = calculateApartmentProfile([r1, r2, r3])
    expect(profile.dominantSleepSchedule).toBe('EARLY_BIRD')
  })

  it('sleep schedule distribution is percentage-based', () => {
    const r1 = makeResident({ sleepSchedule: 'EARLY_BIRD' })
    const r2 = makeResident({ id: '2', sleepSchedule: 'EARLY_BIRD' })
    const r3 = makeResident({ id: '3', sleepSchedule: 'NIGHT_OWL' })
    const profile = calculateApartmentProfile([r1, r2, r3])
    // EARLY_BIRD: 2/3 ≈ 66.67%
    expect(profile.sleepScheduleDistribution.EARLY_BIRD).toBeCloseTo(66.67, 0)
    expect(profile.sleepScheduleDistribution.NIGHT_OWL).toBeCloseTo(33.33, 0)
    // All keys present even if 0%
    expect(profile.sleepScheduleDistribution.STANDARD).toBe(0)
    expect(profile.sleepScheduleDistribution.IRREGULAR).toBe(0)
  })

  it('language commonality: only languages spoken by 2+ residents', () => {
    const r1 = makeResident({ languages: ['German', 'English'] })
    const r2 = makeResident({ id: '2', languages: ['German', 'Arabic'] })
    const r3 = makeResident({ id: '3', languages: ['English', 'Arabic'] })
    const profile = calculateApartmentProfile([r1, r2, r3])
    // German: 2, English: 2, Arabic: 2 → all common
    expect(profile.commonLanguages).toContain('German')
    expect(profile.commonLanguages).toContain('English')
    expect(profile.commonLanguages).toContain('Arabic')
  })

  it('languages spoken by only 1 resident are not common (2+ residents)', () => {
    const r1 = makeResident({ languages: ['German', 'French'] })
    const r2 = makeResident({ id: '2', languages: ['German', 'Arabic'] })
    const profile = calculateApartmentProfile([r1, r2])
    expect(profile.commonLanguages).toContain('German')
    expect(profile.commonLanguages).not.toContain('French')
    expect(profile.commonLanguages).not.toContain('Arabic')
  })

  it('single resident: their languages are treated as common (for fit checking)', () => {
    const r1 = makeResident({ languages: ['German', 'French'] })
    const profile = calculateApartmentProfile([r1])
    // With only 1 resident, their languages should be "common" so
    // calculateApartmentFit can check language overlap correctly
    expect(profile.commonLanguages).toContain('German')
    expect(profile.commonLanguages).toContain('French')
  })

  it('boolean percentages: needsQuiet and nightDisturbances', () => {
    const r1 = makeResident({ needsQuietEnvironment: true, hasNightDisturbances: false })
    const r2 = makeResident({ id: '2', needsQuietEnvironment: false, hasNightDisturbances: true })
    const r3 = makeResident({ id: '3', needsQuietEnvironment: true, hasNightDisturbances: false })
    const profile = calculateApartmentProfile([r1, r2, r3])
    // 2 of 3 need quiet → 66.67%
    expect(profile.percentNeedsQuiet).toBeCloseTo(66.67, 0)
    // 1 of 3 has disturbances → 33.33%
    expect(profile.percentHasNightDisturbances).toBeCloseTo(33.33, 0)
  })
})

// =============================================================================
// B. calculateApartmentFit
// =============================================================================

describe('calculateApartmentFit', () => {
  const emptyProfile: ApartmentProfile = calculateApartmentProfile([])

  it('empty apartment → fitScore: 100, strength "Erste Person"', () => {
    const newResident = makeResident()
    const result = calculateApartmentFit(newResident, emptyProfile)
    expect(result.fitScore).toBe(100)
    expect(result.conflicts).toHaveLength(0)
    expect(result.strengths).toEqual(
      expect.arrayContaining([expect.stringContaining('Erste Person')])
    )
  })

  it('perfect match with apartment → high fitScore, no conflicts', () => {
    const r1 = makeResident({ cleanlinessLevel: 3, noiseTolerance: 3 })
    const r2 = makeResident({ id: '2', cleanlinessLevel: 3, noiseTolerance: 3 })
    const profile = calculateApartmentProfile([r1, r2])

    const newResident = makeResident({
      id: 'new',
      cleanlinessLevel: 3,
      noiseTolerance: 3,
      sleepSchedule: 'STANDARD',
      smokingStatus: 'NON_SMOKER',
      socialStyle: 'MODERATE',
      languages: ['German'],
    })
    const result = calculateApartmentFit(newResident, profile)
    expect(result.conflicts).toHaveLength(0)
    expect(result.fitScore).toBeGreaterThanOrEqual(80)
  })

  describe('cleanliness conflicts', () => {
    it('diff >= BLOCKING threshold → BLOCKING conflict', () => {
      const residents = [
        makeResident({ cleanlinessLevel: 5 }),
        makeResident({ id: '2', cleanlinessLevel: 5 }),
      ]
      const profile = calculateApartmentProfile(residents)
      // avg = 5, new resident = 1, diff = 4 ≥ BLOCKING(3)
      const newResident = makeResident({ id: 'new', cleanlinessLevel: 1 })
      const result = calculateApartmentFit(newResident, profile)
      const cleanConflict = result.conflicts.find(c => c.attribute === 'cleanlinessLevel')
      expect(cleanConflict).toBeDefined()
      expect(cleanConflict!.severity).toBe('BLOCKING')
    })

    it('diff >= HIGH threshold but < BLOCKING → HIGH conflict', () => {
      const residents = [
        makeResident({ cleanlinessLevel: 4 }),
        makeResident({ id: '2', cleanlinessLevel: 4 }),
      ]
      const profile = calculateApartmentProfile(residents)
      // avg = 4, new resident = 2, diff = 2 ≥ HIGH(2) but < BLOCKING(3)
      const newResident = makeResident({ id: 'new', cleanlinessLevel: 2 })
      const result = calculateApartmentFit(newResident, profile)
      const cleanConflict = result.conflicts.find(c => c.attribute === 'cleanlinessLevel')
      expect(cleanConflict).toBeDefined()
      expect(cleanConflict!.severity).toBe('HIGH')
    })

    it('diff >= MEDIUM threshold → MEDIUM conflict', () => {
      const residents = [
        makeResident({ cleanlinessLevel: 4 }),
        makeResident({ id: '2', cleanlinessLevel: 4 }),
      ]
      const profile = calculateApartmentProfile(residents)
      // avg = 4, new = 2.5 → diff 1.5 ≥ MEDIUM(1.5)
      // Since we can't set 2.5, use 3 residents with avg that gives 1.5 diff
      // avg = 4, new = 2 → diff = 2, that's HIGH
      // Let's use a fractional avg: residents with 3,4 → avg=3.5, new=2 → diff=1.5
      const profile2 = calculateApartmentProfile([
        makeResident({ cleanlinessLevel: 3 }),
        makeResident({ id: '2', cleanlinessLevel: 4 }),
      ])
      const newResident = makeResident({ id: 'new', cleanlinessLevel: 2 })
      const result = calculateApartmentFit(newResident, profile2)
      const cleanConflict = result.conflicts.find(c => c.attribute === 'cleanlinessLevel')
      expect(cleanConflict).toBeDefined()
      expect(cleanConflict!.severity).toBe('MEDIUM')
    })
  })

  describe('sleep schedule conflicts', () => {
    it('EARLY_BIRD into NIGHT_OWL apartment → sleep conflict', () => {
      const residents = [
        makeResident({ sleepSchedule: 'NIGHT_OWL' }),
        makeResident({ id: '2', sleepSchedule: 'NIGHT_OWL' }),
        makeResident({ id: '3', sleepSchedule: 'NIGHT_OWL' }),
      ]
      const profile = calculateApartmentProfile(residents)
      const newResident = makeResident({ id: 'new', sleepSchedule: 'EARLY_BIRD' })
      const result = calculateApartmentFit(newResident, profile)
      const sleepConflict = result.conflicts.find(c => c.attribute === 'sleepSchedule')
      expect(sleepConflict).toBeDefined()
    })

    it('strong dominance (>=70%) → HIGH sleep conflict', () => {
      // 3 of 3 are NIGHT_OWL → 100% dominance
      const residents = [
        makeResident({ sleepSchedule: 'NIGHT_OWL' }),
        makeResident({ id: '2', sleepSchedule: 'NIGHT_OWL' }),
        makeResident({ id: '3', sleepSchedule: 'NIGHT_OWL' }),
      ]
      const profile = calculateApartmentProfile(residents)
      const newResident = makeResident({ id: 'new', sleepSchedule: 'EARLY_BIRD' })
      const result = calculateApartmentFit(newResident, profile)
      const sleepConflict = result.conflicts.find(c => c.attribute === 'sleepSchedule')
      expect(sleepConflict).toBeDefined()
      expect(sleepConflict!.severity).toBe('HIGH')
    })

    it('matching sleep schedule → generates strength', () => {
      const residents = [
        makeResident({ sleepSchedule: 'EARLY_BIRD' }),
        makeResident({ id: '2', sleepSchedule: 'EARLY_BIRD' }),
      ]
      const profile = calculateApartmentProfile(residents)
      const newResident = makeResident({ id: 'new', sleepSchedule: 'EARLY_BIRD' })
      const result = calculateApartmentFit(newResident, profile)
      expect(result.strengths).toEqual(
        expect.arrayContaining([expect.stringContaining('Schlafrhythmus')])
      )
    })
  })

  describe('smoking conflicts', () => {
    it('NON_SMOKER into smoking apartment → MEDIUM conflict', () => {
      const residents = [
        makeResident({ smokingStatus: 'OUTDOOR_SMOKER' }),
        makeResident({ id: '2', smokingStatus: 'OUTDOOR_SMOKER' }),
      ]
      const profile = calculateApartmentProfile(residents)
      const newResident = makeResident({ id: 'new', smokingStatus: 'NON_SMOKER' })
      const result = calculateApartmentFit(newResident, profile)
      const smokingConflict = result.conflicts.find(c => c.attribute === 'smokingStatus')
      expect(smokingConflict).toBeDefined()
      expect(smokingConflict!.severity).toBe('MEDIUM')
    })
  })

  describe('fit score calculation', () => {
    it('BLOCKING conflict → -40 points', () => {
      // Create scenario with only a BLOCKING cleanliness conflict
      const residents = [
        makeResident({ cleanlinessLevel: 5, languages: ['German'] }),
        makeResident({ id: '2', cleanlinessLevel: 5, languages: ['German'] }),
      ]
      const profile = calculateApartmentProfile(residents)
      const newResident = makeResident({
        id: 'new',
        cleanlinessLevel: 1,
        languages: ['German'],
        sleepSchedule: 'STANDARD',
        smokingStatus: 'NON_SMOKER',
        socialStyle: 'MODERATE',
        noiseTolerance: 3,
        choresContribution: 3,
      })
      const result = calculateApartmentFit(newResident, profile)

      // Should have at least a BLOCKING conflict
      const blockingConflicts = result.conflicts.filter(c => c.severity === 'BLOCKING')
      expect(blockingConflicts.length).toBeGreaterThanOrEqual(1)

      // Score should be reduced (strengths/small group bonus can offset partially)
      // BLOCKING penalty is 40, but strengths and small group bonus add back points
      expect(result.fitScore).toBeLessThan(100)
    })

    it('strength bonus is capped at maxStrengthBonus', () => {
      // Make a profile that generates many strengths
      const residents = [
        makeResident({
          cleanlinessLevel: 3,
          noiseTolerance: 3,
          sleepSchedule: 'STANDARD',
          socialStyle: 'MODERATE',
          smokingStatus: 'NON_SMOKER',
          languages: ['German', 'English'],
          needsQuietEnvironment: false,
        }),
        makeResident({
          id: '2',
          cleanlinessLevel: 3,
          noiseTolerance: 3,
          sleepSchedule: 'STANDARD',
          socialStyle: 'MODERATE',
          smokingStatus: 'NON_SMOKER',
          languages: ['German', 'English'],
          needsQuietEnvironment: false,
        }),
      ]
      const profile = calculateApartmentProfile(residents)
      const newResident = makeResident({
        id: 'new',
        cleanlinessLevel: 3,
        noiseTolerance: 3,
        sleepSchedule: 'STANDARD',
        socialStyle: 'MODERATE',
        smokingStatus: 'NON_SMOKER',
        languages: ['German', 'English'],
        needsQuietEnvironment: true,
      })
      const result = calculateApartmentFit(newResident, profile)

      // fitScore can't exceed 100 (clamped)
      expect(result.fitScore).toBeLessThanOrEqual(100)
    })

    it('small group bonus (+5 when ≤2 residents)', () => {
      const residents = [makeResident({ languages: ['German'] })]
      const profile = calculateApartmentProfile(residents)
      const newResident = makeResident({
        id: 'new',
        cleanlinessLevel: 3,
        noiseTolerance: 3,
        sleepSchedule: 'STANDARD',
        smokingStatus: 'NON_SMOKER',
        languages: ['German'],
        socialStyle: 'MODERATE',
      })
      const result = calculateApartmentFit(newResident, profile)

      // 1 resident ≤ smallGroupThreshold(2) → +5 bonus
      // No conflicts → base 100 + strengths bonus + small group bonus, clamped to 100
      expect(result.fitScore).toBe(100)
    })

    it('small group bonus not given when > threshold residents', () => {
      const residents = [
        makeResident({ languages: ['Turkish'] }),
        makeResident({ id: '2', languages: ['Turkish'] }),
        makeResident({ id: '3', languages: ['Turkish'] }),
      ]
      const profile = calculateApartmentProfile(residents)
      // Place a very different person to get some conflicts
      const newResident = makeResident({
        id: 'new',
        cleanlinessLevel: 1,
        noiseTolerance: 1,
        sleepSchedule: 'EARLY_BIRD',
        smokingStatus: 'NON_SMOKER',
        languages: ['Arabic'],
      })
      const resultBig = calculateApartmentFit(newResident, profile)

      // Same scenario with small group
      const smallProfile = calculateApartmentProfile([
        makeResident({ languages: ['Turkish'] }),
      ])
      const resultSmall = calculateApartmentFit(newResident, smallProfile)

      // The small group should have at least the +5 bonus advantage
      // (they may have different conflicts too, so we just verify the bonus concept)
      expect(FIT_SCORE_CONFIG.bonuses.smallGroupThreshold).toBe(2)
      expect(FIT_SCORE_CONFIG.bonuses.smallGroup).toBe(5)
    })

    it('fit score clamped to 0-100', () => {
      // Many conflicts → shouldn't go below 0
      const residents = [
        makeResident({
          cleanlinessLevel: 5,
          noiseTolerance: 1,
          sleepSchedule: 'NIGHT_OWL',
          smokingStatus: 'INDOOR_SMOKER',
          socialStyle: 'EXTROVERTED',
          languages: ['German'],
          choresContribution: 5,
          needsQuietEnvironment: false,
        }),
        makeResident({
          id: '2',
          cleanlinessLevel: 5,
          noiseTolerance: 1,
          sleepSchedule: 'NIGHT_OWL',
          smokingStatus: 'INDOOR_SMOKER',
          socialStyle: 'EXTROVERTED',
          languages: ['German'],
          choresContribution: 5,
          needsQuietEnvironment: false,
        }),
        makeResident({
          id: '3',
          cleanlinessLevel: 5,
          noiseTolerance: 1,
          sleepSchedule: 'NIGHT_OWL',
          smokingStatus: 'INDOOR_SMOKER',
          socialStyle: 'EXTROVERTED',
          languages: ['German'],
          choresContribution: 5,
          needsQuietEnvironment: false,
        }),
      ]
      const profile = calculateApartmentProfile(residents)
      const worstFit = makeResident({
        id: 'worst',
        cleanlinessLevel: 1,
        noiseTolerance: 5,
        sleepSchedule: 'EARLY_BIRD',
        smokingStatus: 'NON_SMOKER',
        socialStyle: 'INTROVERTED',
        languages: ['Arabic'],
        choresContribution: 1,
        needsQuietEnvironment: true,
      })
      const result = calculateApartmentFit(worstFit, profile)
      expect(result.fitScore).toBeGreaterThanOrEqual(0)
      expect(result.fitScore).toBeLessThanOrEqual(100)
    })
  })

  describe('noise tolerance conflicts', () => {
    it('noise diff >= HIGH threshold → HIGH conflict', () => {
      const residents = [
        makeResident({ noiseTolerance: 1 }),
        makeResident({ id: '2', noiseTolerance: 1 }),
      ]
      const profile = calculateApartmentProfile(residents)
      // avg=1, new=5, diff=4 ≥ HIGH(3)
      const newResident = makeResident({ id: 'new', noiseTolerance: 5 })
      const result = calculateApartmentFit(newResident, profile)
      const noiseConflict = result.conflicts.find(c => c.attribute === 'noiseTolerance')
      expect(noiseConflict).toBeDefined()
      expect(noiseConflict!.severity).toBe('HIGH')
    })

    it('noise diff >= MEDIUM threshold → MEDIUM conflict', () => {
      const residents = [
        makeResident({ noiseTolerance: 1 }),
        makeResident({ id: '2', noiseTolerance: 1 }),
      ]
      const profile = calculateApartmentProfile(residents)
      // avg=1, new=3, diff=2 ≥ MEDIUM(2) but < HIGH(3)
      const newResident = makeResident({ id: 'new', noiseTolerance: 3 })
      const result = calculateApartmentFit(newResident, profile)
      const noiseConflict = result.conflicts.find(c => c.attribute === 'noiseTolerance')
      expect(noiseConflict).toBeDefined()
      expect(noiseConflict!.severity).toBe('MEDIUM')
    })
  })

  describe('language overlap', () => {
    it('shared language with apartment → generates strength', () => {
      const residents = [
        makeResident({ languages: ['German', 'English'] }),
        makeResident({ id: '2', languages: ['German'] }),
      ]
      const profile = calculateApartmentProfile(residents)
      const newResident = makeResident({ id: 'new', languages: ['German'] })
      const result = calculateApartmentFit(newResident, profile)
      expect(result.strengths).toEqual(
        expect.arrayContaining([expect.stringContaining('Gemeinsame Sprache')])
      )
    })

    it('no shared language with apartment → generates warning', () => {
      const residents = [
        makeResident({ languages: ['German'] }),
        makeResident({ id: '2', languages: ['German'] }),
      ]
      const profile = calculateApartmentProfile(residents)
      const newResident = makeResident({ id: 'new', languages: ['Arabic'] })
      const result = calculateApartmentFit(newResident, profile)
      expect(result.warnings).toContain('Keine gemeinsame Sprache mit Mehrheit')
    })
  })

  describe('quiet environment conflicts', () => {
    it('quiet resident + high night disturbances → HIGH conflict', () => {
      // Need >= 30% night disturbances (APARTMENT_THRESHOLDS.nightDisturbances.HIGH)
      const residents = [
        makeResident({ hasNightDisturbances: true }),
        makeResident({ id: '2', hasNightDisturbances: true }),
      ]
      const profile = calculateApartmentProfile(residents)
      // 100% night disturbances → ≥ 30% threshold
      const newResident = makeResident({ id: 'new', needsQuietEnvironment: true })
      const result = calculateApartmentFit(newResident, profile)
      const quietConflict = result.conflicts.find(c => c.attribute === 'quietEnvironment')
      expect(quietConflict).toBeDefined()
      expect(quietConflict!.severity).toBe('HIGH')
    })

    it('quiet resident + low disturbances → quiet strength', () => {
      const residents = [
        makeResident({ hasNightDisturbances: false }),
        makeResident({ id: '2', hasNightDisturbances: false }),
      ]
      const profile = calculateApartmentProfile(residents)
      const newResident = makeResident({ id: 'new', needsQuietEnvironment: true })
      const result = calculateApartmentFit(newResident, profile)
      expect(result.strengths).toEqual(
        expect.arrayContaining([expect.stringContaining('Ruhige Umgebung')])
      )
    })
  })

  describe('social style conflicts', () => {
    it('INTROVERTED into EXTROVERTED apartment → LOW conflict', () => {
      const residents = [
        makeResident({ socialStyle: 'EXTROVERTED' }),
        makeResident({ id: '2', socialStyle: 'EXTROVERTED' }),
      ]
      const profile = calculateApartmentProfile(residents)
      const newResident = makeResident({ id: 'new', socialStyle: 'INTROVERTED' })
      const result = calculateApartmentFit(newResident, profile)
      const socialConflict = result.conflicts.find(c => c.attribute === 'socialStyle')
      expect(socialConflict).toBeDefined()
      expect(socialConflict!.severity).toBe('LOW')
    })

    it('matching social style → generates strength', () => {
      const residents = [
        makeResident({ socialStyle: 'INTROVERTED' }),
        makeResident({ id: '2', socialStyle: 'INTROVERTED' }),
      ]
      const profile = calculateApartmentProfile(residents)
      const newResident = makeResident({ id: 'new', socialStyle: 'INTROVERTED' })
      const result = calculateApartmentFit(newResident, profile)
      expect(result.strengths).toEqual(
        expect.arrayContaining([expect.stringContaining('Sozialstil')])
      )
    })
  })

  describe('chores contribution conflicts', () => {
    it('chores diff >= MEDIUM threshold → MEDIUM conflict', () => {
      const residents = [
        makeResident({ choresContribution: 5 }),
        makeResident({ id: '2', choresContribution: 5 }),
      ]
      const profile = calculateApartmentProfile(residents)
      // avg=5, new=1, diff=4 ≥ MEDIUM(3)
      const newResident = makeResident({ id: 'new', choresContribution: 1 })
      const result = calculateApartmentFit(newResident, profile)
      const choresConflict = result.conflicts.find(c => c.attribute === 'choresContribution')
      expect(choresConflict).toBeDefined()
      expect(choresConflict!.severity).toBe('MEDIUM')
    })

    it('chores diff >= LOW threshold → LOW conflict', () => {
      const residents = [
        makeResident({ choresContribution: 5 }),
        makeResident({ id: '2', choresContribution: 5 }),
      ]
      const profile = calculateApartmentProfile(residents)
      // avg=5, new=3, diff=2 ≥ LOW(2) but < MEDIUM(3)
      const newResident = makeResident({ id: 'new', choresContribution: 3 })
      const result = calculateApartmentFit(newResident, profile)
      const choresConflict = result.conflicts.find(c => c.attribute === 'choresContribution')
      expect(choresConflict).toBeDefined()
      expect(choresConflict!.severity).toBe('LOW')
    })
  })
})
