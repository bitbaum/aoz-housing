/**
 * Types for the matching page and its extracted components
 */

import type { Resident, HousingUnit, Placement, PlacementSpot } from '@/lib/db'
import type {
  ApartmentProfile,
  ApartmentCompatibility,
  CompatibilityScore,
} from '@/lib/compatibility/types'
import type { UnitMetrics } from '@/lib/analytics/unit-metrics'
import type { SafeguardWarning } from '@/lib/compatibility/safeguards'
import type { RoomFit } from '@/lib/compatibility/room-fit'

/** Housing unit with active placements (including resident) and available spots */
export type MatchUnit = HousingUnit & {
  placements: (Placement & { resident: Resident })[]
  spots: (PlacementSpot & { placements: (Placement & { resident: Resident })[] })[]
}

/** Pairwise compatibility between new resident and one existing resident */
export interface CompatibilityDetail {
  resident: Resident
  score: CompatibilityScore
}

/** Historical success rate for similar placements */
export interface SuccessRateData {
  successRate: number
  totalPlacements: number
  successfulPlacements: number
}

/** A single match result: unit + all compatibility/metrics data */
export interface MatchResult {
  unit: MatchUnit
  apartmentProfile: ApartmentProfile
  apartmentFit: ApartmentCompatibility
  unitMetrics: UnitMetrics | null
  realSuccessData: SuccessRateData | null
  compatibilityDetails: CompatibilityDetail[]
  unitConcerns: string[]
  hasBlockingIssue: boolean
  sharedLanguageCount: number
  totalRoommateConcerns: number
  safeguardWarnings: SafeguardWarning[]
  sortScore: number
  /** Best available Zimmer vs the people who share it. Null = no assignable spot. */
  bestRoomFit: RoomFit | null
}

/** Resident with active placement info (for "what-if" analysis) */
export type ResidentWithPlacement = Resident & {
  placements: (Placement & { housingUnit: { id: string; code: string } })[]
}

/** Unit-mode match: how well an unplaced resident fits a specific unit */
export interface UnitMatch {
  resident: Resident
  fitScore: number
  apartmentFit: ApartmentCompatibility
  concerns: string[]
}
