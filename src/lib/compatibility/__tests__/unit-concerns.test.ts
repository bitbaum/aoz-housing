import { getUnitFitConcerns, isBlockingConcern } from '../unit-concerns'
import { PLACEMENT_CONCERN_LABELS } from '@/lib/constants'

// A unit that satisfies every hard requirement — start here and break one
// constraint at a time so each test isolates a single concern.
const accessibleUnit = {
  wheelchairAccess: true,
  groundFloor: true,
  elevator: true,
  smokingAllowed: true,
  sharedKitchen: false,
  sharedBathrooms: 0,
}

const unrestrictedResident = {
  mobilityNeeds: 'NONE',
  smokingStatus: 'NON_SMOKER',
  sharedKitchen: true,
  sharedBathroom: true,
}

describe('getUnitFitConcerns — mobility', () => {
  it('flags a blocking concern when a wheelchair user has no wheelchair access', () => {
    const { concerns, hasBlockingIssue } = getUnitFitConcerns(
      { ...unrestrictedResident, mobilityNeeds: 'WHEELCHAIR' },
      { ...accessibleUnit, wheelchairAccess: false },
    )
    expect(concerns).toContain(PLACEMENT_CONCERN_LABELS.wheelchairRequired)
    expect(hasBlockingIssue).toBe(true)
  })

  it('does not flag wheelchair access when the unit provides it', () => {
    const { concerns, hasBlockingIssue } = getUnitFitConcerns(
      { ...unrestrictedResident, mobilityNeeds: 'WHEELCHAIR' },
      accessibleUnit,
    )
    expect(concerns).toHaveLength(0)
    expect(hasBlockingIssue).toBe(false)
  })

  it('flags a blocking concern for a ground-floor need with neither ground floor nor elevator', () => {
    const { concerns, hasBlockingIssue } = getUnitFitConcerns(
      { ...unrestrictedResident, mobilityNeeds: 'GROUND_FLOOR' },
      { ...accessibleUnit, groundFloor: false, elevator: false },
    )
    expect(concerns).toContain(PLACEMENT_CONCERN_LABELS.groundFloorRequired)
    expect(hasBlockingIssue).toBe(true)
  })

  it('accepts a ground-floor need when an elevator is available', () => {
    const { concerns, hasBlockingIssue } = getUnitFitConcerns(
      { ...unrestrictedResident, mobilityNeeds: 'GROUND_FLOOR' },
      { ...accessibleUnit, groundFloor: false, elevator: true },
    )
    expect(concerns).toHaveLength(0)
    expect(hasBlockingIssue).toBe(false)
  })

  it('accepts a ground-floor need when the unit is on the ground floor', () => {
    const { concerns } = getUnitFitConcerns(
      { ...unrestrictedResident, mobilityNeeds: 'GROUND_FLOOR' },
      { ...accessibleUnit, groundFloor: true, elevator: false },
    )
    expect(concerns).toHaveLength(0)
  })
})

describe('getUnitFitConcerns — smoking', () => {
  it('flags a smoker in a non-smoking unit (non-blocking)', () => {
    const { concerns, hasBlockingIssue } = getUnitFitConcerns(
      { ...unrestrictedResident, smokingStatus: 'SMOKER' },
      { ...accessibleUnit, smokingAllowed: false },
    )
    expect(concerns).toContain(PLACEMENT_CONCERN_LABELS.smokerInNonSmokingUnit)
    expect(hasBlockingIssue).toBe(false)
  })

  it('does not flag a smoker when smoking is allowed', () => {
    const { concerns } = getUnitFitConcerns(
      { ...unrestrictedResident, smokingStatus: 'SMOKER' },
      accessibleUnit,
    )
    expect(concerns).toHaveLength(0)
  })

  it('never flags a non-smoker regardless of unit policy', () => {
    const { concerns } = getUnitFitConcerns(
      { ...unrestrictedResident, smokingStatus: 'NON_SMOKER' },
      { ...accessibleUnit, smokingAllowed: false },
    )
    expect(concerns).toHaveLength(0)
  })
})

describe('getUnitFitConcerns — shared facilities (opt-in)', () => {
  const privacyResident = {
    ...unrestrictedResident,
    sharedKitchen: false,
    sharedBathroom: false,
  }
  const sharedUnit = { ...accessibleUnit, sharedKitchen: true, sharedBathrooms: 2 }

  it('ignores shared-facility mismatches by default', () => {
    const { concerns } = getUnitFitConcerns(privacyResident, sharedUnit)
    expect(concerns).toHaveLength(0)
  })

  it('flags a shared-kitchen mismatch when opted in', () => {
    const { concerns } = getUnitFitConcerns(privacyResident, sharedUnit, {
      includeSharedFacilities: true,
    })
    expect(concerns).toContain(PLACEMENT_CONCERN_LABELS.sharedKitchenOnly)
  })

  it('flags a shared-bathroom mismatch when opted in', () => {
    const { concerns } = getUnitFitConcerns(privacyResident, sharedUnit, {
      includeSharedFacilities: true,
    })
    expect(concerns).toContain(PLACEMENT_CONCERN_LABELS.sharedBathroomOnly)
  })

  it('does not flag shared facilities the resident accepts', () => {
    const { concerns } = getUnitFitConcerns(unrestrictedResident, sharedUnit, {
      includeSharedFacilities: true,
    })
    expect(concerns).toHaveLength(0)
  })
})

describe('getUnitFitConcerns — combinations', () => {
  it('returns no concerns for a fully compatible placement', () => {
    expect(getUnitFitConcerns(unrestrictedResident, accessibleUnit)).toEqual({
      concerns: [],
      hasBlockingIssue: false,
    })
  })

  it('reports multiple concerns and stays blocking when a hard blocker is present', () => {
    const { concerns, hasBlockingIssue } = getUnitFitConcerns(
      { ...unrestrictedResident, mobilityNeeds: 'WHEELCHAIR', smokingStatus: 'SMOKER' },
      { ...accessibleUnit, wheelchairAccess: false, smokingAllowed: false },
    )
    expect(concerns).toContain(PLACEMENT_CONCERN_LABELS.wheelchairRequired)
    expect(concerns).toContain(PLACEMENT_CONCERN_LABELS.smokerInNonSmokingUnit)
    expect(hasBlockingIssue).toBe(true)
  })
})

describe('isBlockingConcern', () => {
  it('treats wheelchair and ground-floor concerns as hard blockers', () => {
    expect(isBlockingConcern(PLACEMENT_CONCERN_LABELS.wheelchairRequired)).toBe(true)
    expect(isBlockingConcern(PLACEMENT_CONCERN_LABELS.groundFloorRequired)).toBe(true)
  })

  it('does not treat the smoking concern as a hard blocker', () => {
    expect(isBlockingConcern(PLACEMENT_CONCERN_LABELS.smokerInNonSmokingUnit)).toBe(false)
  })

  it('returns false for an unrelated string', () => {
    expect(isBlockingConcern('etwas anderes')).toBe(false)
  })
})
