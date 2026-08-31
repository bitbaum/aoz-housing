import {
  frictionBetween,
  hasDoubleStandard,
  isHighMaintenance,
  scoreCleanlinessAgainstGroup,
  scoreCleanlinessPair,
  type CleanlinessProfile,
} from '../cleanliness'

function profile(practice: number, expectation: number, tolerance: number): CleanlinessProfile {
  return {
    cleanlinessPractice: practice,
    cleanlinessExpectation: expectation,
    chaosTolerance: tolerance,
  }
}

// Recurring archetypes, named the way staff would describe them.
const TIDY_AND_RELAXED = profile(5, 1, 5) // keeps order, does not impose it
const TIDY_AND_DEMANDING = profile(5, 5, 1) // keeps order, requires it of others
const MESSY_AND_RELAXED = profile(1, 1, 5) // little order, minds nothing
const MESSY_AND_DEMANDING = profile(2, 5, 1) // little order, demands a lot
const AVERAGE = profile(3, 3, 3)

describe('frictionBetween', () => {
  it('reports no friction when the other person exceeds what I expect', () => {
    const friction = frictionBetween(MESSY_AND_RELAXED, TIDY_AND_RELAXED)

    expect(friction.gap).toBe(0)
    expect(friction.score).toBe(100)
  })

  it('reports friction only for the shortfall, never for excess cleanliness', () => {
    // Being cleaner than required is not a defect.
    const tooClean = frictionBetween(profile(1, 1, 3), profile(5, 5, 3))
    expect(tooClean.gap).toBe(0)
  })

  it('scales friction with how far the expectation is missed', () => {
    const small = frictionBetween(profile(3, 3, 3), profile(3, 3, 3))
    const large = frictionBetween(profile(3, 5, 3), profile(1, 3, 3))

    expect(large.gap).toBeGreaterThan(small.gap)
    expect(large.score).toBeLessThan(small.score)
  })

  it('softens the same gap for someone who can live with mess', () => {
    const intolerant = frictionBetween(profile(3, 5, 1), profile(1, 1, 3))
    const tolerant = frictionBetween(profile(3, 5, 5), profile(1, 1, 3))

    expect(intolerant.gap).toBe(tolerant.gap)
    expect(tolerant.feltFriction).toBeLessThan(intolerant.feltFriction)
    expect(tolerant.score).toBeGreaterThan(intolerant.score)
  })

  it('is asymmetric — the whole point of the model', () => {
    const forward = frictionBetween(TIDY_AND_DEMANDING, MESSY_AND_RELAXED)
    const backward = frictionBetween(MESSY_AND_RELAXED, TIDY_AND_DEMANDING)

    expect(forward.score).toBeLessThan(backward.score)
    expect(backward.score).toBe(100)
  })
})

describe('scoreCleanlinessPair', () => {
  it('rates two relaxed people as compatible however different their habits', () => {
    const result = scoreCleanlinessPair(TIDY_AND_RELAXED, MESSY_AND_RELAXED)

    expect(result.score).toBe(100)
    expect(result.direction).toBe('NONE')
  })

  it('identifies which side will be unhappy', () => {
    const result = scoreCleanlinessPair(TIDY_AND_DEMANDING, MESSY_AND_RELAXED)

    expect(result.direction).toBe('A_BOTHERED_BY_B')
    expect(result.note).toBeDefined()
  })

  it('reports mutual friction when both expectations go unmet', () => {
    const result = scoreCleanlinessPair(MESSY_AND_DEMANDING, MESSY_AND_DEMANDING)

    expect(result.direction).toBe('MUTUAL')
    expect(result.score).toBeLessThan(50)
  })

  it('scores the pair by its unhappier member, not the average', () => {
    // One content person does not compensate for one miserable one.
    const result = scoreCleanlinessPair(TIDY_AND_DEMANDING, MESSY_AND_RELAXED)

    expect(result.bTowardA.score).toBe(100)
    expect(result.score).toBe(result.aTowardB.score)
    expect(result.score).toBeLessThan(100)
  })

  it('rates the messy-but-demanding person as a poor match for a fellow messy person', () => {
    // Identical practice — the symmetric model called this a perfect match.
    const symmetricWouldSayPerfect = scoreCleanlinessPair(MESSY_AND_DEMANDING, MESSY_AND_RELAXED)

    expect(symmetricWouldSayPerfect.score).toBeLessThan(70)
    expect(symmetricWouldSayPerfect.direction).toBe('A_BOTHERED_BY_B')
  })

  it('is order-independent in its score', () => {
    const forward = scoreCleanlinessPair(TIDY_AND_DEMANDING, MESSY_AND_RELAXED)
    const backward = scoreCleanlinessPair(MESSY_AND_RELAXED, TIDY_AND_DEMANDING)

    expect(forward.score).toBe(backward.score)
    expect(backward.direction).toBe('B_BOTHERED_BY_A')
  })
})

describe('hasDoubleStandard', () => {
  it('flags someone who demands more than they contribute', () => {
    expect(hasDoubleStandard(MESSY_AND_DEMANDING)).toBe(true)
  })

  it('does not flag someone who lives up to their own standard', () => {
    expect(hasDoubleStandard(TIDY_AND_DEMANDING)).toBe(false)
    expect(hasDoubleStandard(MESSY_AND_RELAXED)).toBe(false)
    expect(hasDoubleStandard(AVERAGE)).toBe(false)
  })

  it('does not flag someone who gives more than they ask for', () => {
    expect(hasDoubleStandard(TIDY_AND_RELAXED)).toBe(false)
  })
})

describe('isHighMaintenance', () => {
  it('flags high expectation combined with low tolerance', () => {
    expect(isHighMaintenance(TIDY_AND_DEMANDING)).toBe(true)
    expect(isHighMaintenance(MESSY_AND_DEMANDING)).toBe(true)
  })

  it('does not flag a demanding person who can still live with mess', () => {
    expect(isHighMaintenance(profile(5, 5, 5))).toBe(false)
  })
})

describe('scoreCleanlinessAgainstGroup', () => {
  it('treats an empty household as a perfect fit', () => {
    const result = scoreCleanlinessAgainstGroup(MESSY_AND_DEMANDING, [])

    expect(result.score).toBe(100)
    expect(result.botheredByCandidate).toBe(0)
  })

  it('scores by the worst pairing rather than the average', () => {
    // Averaging would hide the single pairing that generates the incidents.
    const result = scoreCleanlinessAgainstGroup(MESSY_AND_RELAXED, [
      MESSY_AND_RELAXED,
      MESSY_AND_RELAXED,
      TIDY_AND_DEMANDING,
    ])

    expect(result.score).toBeLessThan(70)
    expect(result.botheredByCandidate).toBe(1)
  })

  it('counts how many existing residents the candidate will bother', () => {
    const result = scoreCleanlinessAgainstGroup(MESSY_AND_RELAXED, [
      TIDY_AND_DEMANDING,
      TIDY_AND_DEMANDING,
      MESSY_AND_RELAXED,
    ])

    expect(result.botheredByCandidate).toBe(2)
    expect(result.note).toContain('2 von 3')
  })

  it('separately reports when the candidate will be the unhappy one', () => {
    const result = scoreCleanlinessAgainstGroup(TIDY_AND_DEMANDING, [
      MESSY_AND_RELAXED,
      MESSY_AND_RELAXED,
    ])

    expect(result.candidateBothered).toBe(true)
    expect(result.botheredByCandidate).toBe(0)
    expect(result.note).toContain('zu unordentlich')
  })

  it('reports a clean fit when the candidate matches everyone', () => {
    const result = scoreCleanlinessAgainstGroup(AVERAGE, [AVERAGE, AVERAGE])

    expect(result.score).toBe(100)
    expect(result.note).toBeUndefined()
  })
})
