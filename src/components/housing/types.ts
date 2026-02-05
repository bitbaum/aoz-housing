/**
 * Shared types for housing components
 */

import type { SpotTypeKey, SpotStatusKey } from '@/lib/config/placement-spots'

export interface HousingResident {
  id: string
  code: string
  ageRange?: string
  gender?: string
  languages?: string[]
  socialStyle?: string
  sleepSchedule?: string
  smokingStatus?: string
  noiseTolerance?: number
  cleanlinessLevel?: number
  privacyNeed?: number
}

export interface HousingPlacement {
  id: string
  resident: HousingResident
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
  resident: HousingResident & { ageRange: string; languages: string[] }
  fitScore: number
  strengths: string[]
  concerns: string[]
}
