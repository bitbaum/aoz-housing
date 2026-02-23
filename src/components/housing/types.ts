/**
 * Shared types for housing components
 */

import type { SpotTypeKey, SpotStatusKey } from '@/lib/config/placement-spots'
import type { ResidentSummary } from '@/lib/types'

/** @deprecated Use ResidentSummary from @/lib/types directly */
export type HousingResident = ResidentSummary

export interface HousingPlacement {
  id: string
  resident: ResidentSummary
  status: string
}

export interface HousingSpot {
  id: string
  code: string
  label: string | null
  type: SpotTypeKey
  status: SpotStatusKey
  squareMeters?: number | null
  requiresMedicalDocs: boolean
  parentSpotId?: string | null
  childSpots?: HousingSpot[]
  placements: HousingPlacement[]
}

export interface CompatibleResident {
  resident: ResidentSummary
  fitScore: number
  strengths: string[]
  concerns: string[]
}
