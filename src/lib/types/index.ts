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
  // Carried so every card/popover can show a name via residentName(); a
  // summary without it can only ever render a login code.
  | 'displayName'
  | 'ageRange'
  | 'gender'
  | 'languages'
  | 'socialStyle'
  | 'sleepSchedule'
  | 'smokingStatus'
  | 'noiseTolerance'
  | 'cleanlinessPractice'
  | 'privacyNeed'
>

/** Resident fields needed for apartment profile calculations */
export type ResidentHouseholdProfile = Pick<
  Resident,
  | 'id'
  | 'code'
  | 'cleanlinessPractice'
  | 'noiseTolerance'
  | 'privacyNeed'
  | 'choresContribution'
  | 'sleepSchedule'
  | 'socialStyle'
  | 'smokingStatus'
  | 'languages'
>

/**
 * Minimal resident for matrix headers and simple lists.
 *
 * `displayName` is part of the minimum: a resident subset that carries only the
 * code forces every consumer to render the login code, which is how the
 * compatibility matrix came to label its rows "RES-DEMO08".
 */
export type ResidentBasic = Pick<
  Resident,
  'id' | 'code' | 'displayName' | 'ageRange' | 'languages'
>

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
