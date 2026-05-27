/**
 * Unit-level fit concerns based on a resident's hard requirements vs a unit's
 * physical/policy constraints. Returned strings are German user-facing labels
 * pulled from PLACEMENT_CONCERN_LABELS.
 *
 * SSOT for the wheelchair / ground-floor / smoking / shared-facility checks
 * that used to be duplicated across matching, housing detail, and resident
 * detail pages.
 */

import { PLACEMENT_CONCERN_LABELS } from '@/lib/constants'

interface ResidentFitInput {
  mobilityNeeds: string
  smokingStatus: string
  sharedKitchen?: boolean
  sharedBathroom?: boolean
}

interface UnitFitInput {
  wheelchairAccess: boolean
  groundFloor: boolean
  elevator: boolean
  smokingAllowed: boolean
  sharedKitchen?: boolean
  sharedBathrooms?: number
}

export interface UnitFitConcerns {
  concerns: string[]
  /** True if at least one concern is a hard blocker (wheelchair/ground-floor mismatch). */
  hasBlockingIssue: boolean
}

const BLOCKING_CONCERNS = new Set<string>([
  PLACEMENT_CONCERN_LABELS.wheelchairRequired,
  PLACEMENT_CONCERN_LABELS.groundFloorRequired,
])

/**
 * Compute fit concerns for a resident in a candidate unit.
 *
 * @param includeSharedFacilities  when true, also flag shared-kitchen / shared-bathroom mismatches
 *                                 (only the matching detail page wants these — most callers don't).
 */
export function getUnitFitConcerns(
  resident: ResidentFitInput,
  unit: UnitFitInput,
  options: { includeSharedFacilities?: boolean } = {},
): UnitFitConcerns {
  const concerns: string[] = []
  let hasBlockingIssue = false

  if (resident.mobilityNeeds === 'WHEELCHAIR' && !unit.wheelchairAccess) {
    concerns.push(PLACEMENT_CONCERN_LABELS.wheelchairRequired)
    hasBlockingIssue = true
  }
  if (resident.mobilityNeeds === 'GROUND_FLOOR' && !unit.groundFloor && !unit.elevator) {
    concerns.push(PLACEMENT_CONCERN_LABELS.groundFloorRequired)
    hasBlockingIssue = true
  }
  if (resident.smokingStatus !== 'NON_SMOKER' && !unit.smokingAllowed) {
    concerns.push(PLACEMENT_CONCERN_LABELS.smokerInNonSmokingUnit)
  }

  if (options.includeSharedFacilities) {
    if (resident.sharedKitchen === false && unit.sharedKitchen) {
      concerns.push(PLACEMENT_CONCERN_LABELS.sharedKitchenOnly)
    }
    if (resident.sharedBathroom === false && (unit.sharedBathrooms ?? 0) > 0) {
      concerns.push(PLACEMENT_CONCERN_LABELS.sharedBathroomOnly)
    }
  }

  return { concerns, hasBlockingIssue }
}

/** Convenience: is a string concern one of the hard blockers? */
export function isBlockingConcern(concern: string): boolean {
  return BLOCKING_CONCERNS.has(concern)
}
