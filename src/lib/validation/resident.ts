/**
 * Server-side validation schemas for resident operations
 */

import { z } from 'zod'

/**
 * Schema for resident creation/update
 */
export const residentSchema = z.object({
  code: z.string().min(1, 'Code ist erforderlich').max(50),
  ageRange: z.enum(['YOUNG_ADULT', 'ADULT', 'MIDDLE_AGED', 'SENIOR']),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_SAY']),
  familyStatus: z.enum(['SINGLE', 'COUPLE', 'FAMILY_WITH_CHILDREN', 'SINGLE_PARENT']),

  // Lifestyle
  sleepSchedule: z.enum(['EARLY_BIRD', 'STANDARD', 'NIGHT_OWL', 'IRREGULAR']),
  noiseTolerance: z.number().int().min(1).max(5),
  cleanlinessLevel: z.number().int().min(1).max(5),

  // Social
  socialStyle: z.enum(['INTROVERTED', 'MODERATE', 'EXTROVERTED']),
  languages: z.array(z.string()).min(1, 'Mindestens eine Sprache erforderlich'),
  culturalRegion: z.string().optional(),

  // Practical
  smokingStatus: z.enum(['NON_SMOKER', 'OUTDOOR_SMOKER', 'INDOOR_SMOKER']),
  dietaryNeeds: z.array(z.string()).default([]),
  mobilityNeeds: z.enum(['NONE', 'GROUND_FLOOR', 'WHEELCHAIR']),
  medicalEquipment: z.boolean().default(false),

  // Preferences
  petTolerance: z.boolean().default(false),
  sharedBathroom: z.boolean().default(true),
  sharedKitchen: z.boolean().default(true),
  privacyNeed: z.number().int().min(1).max(5),

  // Household
  choresContribution: z.number().int().min(1).max(5),
  recyclingKnowledge: z.enum(['NONE', 'BASIC', 'GOOD']),

  // Health/Support
  roomSharingStatus: z.enum(['CAN_SHARE', 'PREFERS_PRIVATE', 'NEEDS_PRIVATE']),
  hasNightDisturbances: z.boolean().default(false),
  needsQuietEnvironment: z.boolean().default(false),
  hasSleepEquipment: z.boolean().default(false),
  supportLevel: z.enum(['STANDARD', 'ELEVATED', 'INTENSIVE']),

  // Medical documentation
  hasMedicalDocumentation: z.boolean().default(false),
  medicalDocType: z.enum(['ARZTZEUGNIS', 'IV_VERFUEGUNG', 'NONE']).optional(),
})

export type ResidentInput = z.infer<typeof residentSchema>

/**
 * Partial schema for updates (all fields optional)
 */
export const residentUpdateSchema = residentSchema.partial()

export type ResidentUpdateInput = z.infer<typeof residentUpdateSchema>
