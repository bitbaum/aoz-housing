/**
 * Types for the compatibility scoring system
 */

export interface ResidentProfile {
  id: string
  code: string

  // Demographics
  ageRange: AgeRange
  gender: Gender
  familyStatus: FamilyStatus

  // Lifestyle
  sleepSchedule: SleepSchedule
  noiseTolerance: number // 1-5
  cleanlinessLevel: number // 1-5

  // Social
  socialStyle: SocialStyle
  languages: string[]
  culturalRegion?: string

  // Practical
  smokingStatus: SmokingStatus
  dietaryNeeds: string[]
  mobilityNeeds: MobilityNeed
  medicalEquipment: boolean

  // Preferences
  petTolerance: boolean
  sharedBathroom: boolean
  sharedKitchen: boolean
  privacyNeed: number // 1-5

  // Household
  choresContribution: number // 1-5
  recyclingKnowledge: RecyclingKnowledge

  // Health/Support needs (functional, not diagnostic)
  roomSharingStatus: RoomSharingStatus
  hasNightDisturbances: boolean
  needsQuietEnvironment: boolean
  hasSleepEquipment: boolean
  supportLevel: SupportLevel
}

export type AgeRange = 'YOUNG_ADULT' | 'ADULT' | 'MIDDLE_AGED' | 'SENIOR'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_SAY'
export type FamilyStatus = 'SINGLE' | 'COUPLE' | 'FAMILY_WITH_CHILDREN' | 'SINGLE_PARENT'
export type SleepSchedule = 'EARLY_BIRD' | 'STANDARD' | 'NIGHT_OWL' | 'IRREGULAR'
export type SocialStyle = 'INTROVERTED' | 'MODERATE' | 'EXTROVERTED'
export type SmokingStatus = 'NON_SMOKER' | 'OUTDOOR_SMOKER' | 'INDOOR_SMOKER'
export type MobilityNeed = 'NONE' | 'GROUND_FLOOR' | 'WHEELCHAIR'
export type RoomSharingStatus = 'CAN_SHARE' | 'PREFERS_PRIVATE' | 'NEEDS_PRIVATE'
export type SupportLevel = 'STANDARD' | 'ELEVATED' | 'INTENSIVE'
export type RecyclingKnowledge = 'NONE' | 'BASIC' | 'GOOD'

export interface CompatibilityScore {
  overall: number // 0-100
  lifestyle: number
  social: number
  practical: number
  risk: number // Lower is better

  strengths: string[]
  concerns: string[]
  recommendations: string[]
  predictions?: string[] // NEW: Predicted conflict types and timeframes
}

export interface CompatibilityWeights {
  lifestyle: number // Default 30
  social: number // Default 25
  practical: number // Default 25
  risk: number // Default 20
}

export interface DimensionResult {
  score: number
  factors: FactorResult[]
}

export interface FactorResult {
  name: string
  score: number
  weight: number
  note?: string
}

/**
 * Aggregate profile of an apartment based on current residents
 */
export interface ApartmentProfile {
  unitId: string
  currentResidentCount: number
  isEmpty: boolean

  // Numeric attributes (averages)
  avgNoiseTolerance: number | null
  avgCleanlinessLevel: number | null
  avgPrivacyNeed: number | null
  avgChoresContribution: number | null

  // Enum attributes (dominant/distribution)
  dominantSleepSchedule: SleepSchedule | null
  sleepScheduleDistribution: Record<SleepSchedule, number>
  dominantSocialStyle: SocialStyle | null
  dominantSmokingStatus: SmokingStatus | null

  // Multi-value attributes
  commonLanguages: string[]

  // Boolean attributes (percentages)
  percentNeedsQuiet: number
  percentHasNightDisturbances: number
}

/**
 * Compatibility of new resident with apartment aggregate profile
 */
export interface ApartmentCompatibility {
  apartmentProfile: ApartmentProfile
  fitScore: number // 0-100
  conflicts: ApartmentConflict[]
  strengths: string[]
  warnings: string[]
}

export interface ApartmentConflict {
  attribute: string
  severity: 'BLOCKING' | 'HIGH' | 'MEDIUM' | 'LOW'
  message: string
  residentValue: number | string
  apartmentAverage: number | string
}
