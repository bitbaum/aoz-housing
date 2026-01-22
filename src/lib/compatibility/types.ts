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
}

export type AgeRange = 'YOUNG_ADULT' | 'ADULT' | 'MIDDLE_AGED' | 'SENIOR'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_SAY'
export type FamilyStatus = 'SINGLE' | 'COUPLE' | 'FAMILY_WITH_CHILDREN' | 'SINGLE_PARENT'
export type SleepSchedule = 'EARLY_BIRD' | 'STANDARD' | 'NIGHT_OWL' | 'IRREGULAR'
export type SocialStyle = 'INTROVERTED' | 'MODERATE' | 'EXTROVERTED'
export type SmokingStatus = 'NON_SMOKER' | 'OUTDOOR_SMOKER' | 'INDOOR_SMOKER'
export type MobilityNeed = 'NONE' | 'GROUND_FLOOR' | 'WHEELCHAIR'

export interface CompatibilityScore {
  overall: number // 0-100
  lifestyle: number
  social: number
  practical: number
  risk: number // Lower is better
  
  strengths: string[]
  concerns: string[]
  recommendations: string[]
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
