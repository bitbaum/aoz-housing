/**
 * Shared UI Types - derived from Prisma models
 *
 * These are Pick/subset types for components that don't need full Prisma models.
 * The Prisma schema remains the SSOT — these types are derived, not duplicated.
 *
 * @see prisma/schema.prisma (source of truth)
 */

import type { Resident, PlacementSpot, HousingUnit } from '@prisma/client'

// =============================================================================
// RESIDENT SUBSETS
// =============================================================================

/** Resident fields commonly needed for compatibility UI (popovers, matrices, cards) */
export type ResidentSummary = Pick<
  Resident,
  | 'id'
  | 'code'
  | 'ageRange'
  | 'gender'
  | 'languages'
  | 'socialStyle'
  | 'sleepSchedule'
  | 'smokingStatus'
  | 'noiseTolerance'
  | 'cleanlinessLevel'
  | 'privacyNeed'
>

/** Resident fields needed for apartment profile calculations */
export type ResidentHouseholdProfile = Pick<
  Resident,
  | 'id'
  | 'code'
  | 'cleanlinessLevel'
  | 'noiseTolerance'
  | 'privacyNeed'
  | 'choresContribution'
  | 'sleepSchedule'
  | 'socialStyle'
  | 'smokingStatus'
  | 'languages'
>

/** Minimal resident for matrix headers and simple lists */
export type ResidentBasic = Pick<Resident, 'id' | 'code' | 'ageRange' | 'languages'>

// =============================================================================
// SPOT / UNIT SUBSETS
// =============================================================================

/** Spot fields for selection UIs (transfer, placement) */
export type SpotInfo = Pick<PlacementSpot, 'id' | 'code' | 'type' | 'label'>

/** Unit with available spots for transfer/placement selection */
export interface UnitWithSpots {
  id: string
  code: string
  address: string
  spots: SpotInfo[]
}

// =============================================================================
// RE-EXPORTS for convenience
// =============================================================================

export type { Resident, PlacementSpot, HousingUnit } from '@prisma/client'
