/**
 * Zod validation schemas for all server action inputs
 * SSOT for input validation - derived from Prisma schema enums
 */

import { z } from 'zod'

// =============================================================================
// ENUM SCHEMAS (derived from Prisma schema)
// =============================================================================

export const AgeRangeSchema = z.enum(['YOUNG_ADULT', 'ADULT', 'MIDDLE_AGED', 'SENIOR'])
export const GenderSchema = z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_SAY'])
export const FamilyStatusSchema = z.enum(['SINGLE', 'COUPLE', 'FAMILY_WITH_CHILDREN', 'SINGLE_PARENT'])
export const SleepScheduleSchema = z.enum(['EARLY_BIRD', 'STANDARD', 'NIGHT_OWL', 'IRREGULAR'])
export const SocialStyleSchema = z.enum(['INTROVERTED', 'MODERATE', 'EXTROVERTED'])
export const SmokingStatusSchema = z.enum(['NON_SMOKER', 'OUTDOOR_SMOKER', 'INDOOR_SMOKER'])
export const MobilityNeedSchema = z.enum(['NONE', 'GROUND_FLOOR', 'WHEELCHAIR'])
export const ResidentStatusSchema = z.enum(['ACTIVE', 'PLACED', 'TRANSFERRED', 'EXITED'])
export const RoomSharingStatusSchema = z.enum(['CAN_SHARE', 'PREFERS_PRIVATE', 'NEEDS_PRIVATE'])
export const SupportLevelSchema = z.enum(['STANDARD', 'ELEVATED', 'INTENSIVE'])
export const RecyclingKnowledgeSchema = z.enum(['NONE', 'BASIC', 'GOOD'])
export const MedicalDocTypeSchema = z.enum(['PRIVATE_ROOM', 'STUDIO', 'BOTH'])

export const HousingStatusSchema = z.enum(['AVAILABLE', 'FULL', 'MAINTENANCE', 'CLOSED'])
export const SpotTypeSchema = z.enum(['BED', 'PRIVATE_ROOM', 'STUDIO', 'ROOM'])
export const SpotStatusSchema = z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLOSED'])

export const PlacementStatusSchema = z.enum(['ACTIVE', 'ENDED', 'TRANSFERRED'])
export const EndReasonSchema = z.enum(['NATURAL', 'CONFLICT', 'REQUEST', 'CAPACITY', 'UPGRADE', 'OTHER'])

export const IncidentCategorySchema = z.enum(['INTERPERSONAL', 'MAINTENANCE', 'SAFETY'])
export const IncidentTypeSchema = z.enum([
  'NOISE_COMPLAINT', 'CLEANLINESS_DISPUTE', 'PERSONAL_CONFLICT', 'CULTURAL_FRICTION',
  'SPACE_DISPUTE', 'SCHEDULE_CONFLICT', 'SAFETY_CONCERN',
  'PLUMBING', 'ELECTRICAL', 'HEATING_COOLING', 'APPLIANCE', 'STRUCTURAL',
  'PEST_CONTROL', 'SECURITY_SYSTEM', 'GENERAL_MAINTENANCE', 'OTHER'
])
export const IncidentSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
export const FollowUpPrioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
export const InvolvementRoleSchema = z.enum(['INVOLVED', 'WITNESS', 'MEDIATOR'])

export const MaintenanceCategorySchema = z.enum([
  'PLUMBING', 'ELECTRICAL', 'HEATING_COOLING', 'APPLIANCE', 'STRUCTURAL',
  'PEST_CONTROL', 'SECURITY', 'CLEANING', 'EXTERIOR', 'OTHER'
])
export const MaintenancePrioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
export const MaintenanceStatusSchema = z.enum([
  'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'
])

export const CheckInTypeSchema = z.enum(['INITIAL', 'REGULAR', 'AD_HOC', 'EXIT'])

// =============================================================================
// COMMON HELPERS
// =============================================================================

// Scale validation (1-5)
const scaleSchema = z.coerce.number().int().min(1).max(5)

// Optional CUID
const optionalCuid = z.string().cuid().optional().or(z.literal(''))

// Date string to Date
const dateString = z.string().transform((val) => val ? new Date(val) : undefined)

// =============================================================================
// RESIDENT SCHEMAS
// =============================================================================

export const ResidentInputSchema = z.object({
  code: z.string().min(1, 'Code ist erforderlich').max(50),
  ageRange: AgeRangeSchema,
  gender: GenderSchema,
  familyStatus: FamilyStatusSchema,
  sleepSchedule: SleepScheduleSchema,
  noiseTolerance: scaleSchema.default(3),
  cleanlinessLevel: scaleSchema.default(3),
  socialStyle: SocialStyleSchema,
  languages: z.array(z.string()).default([]),
  culturalRegion: z.string().optional().nullable(),
  smokingStatus: SmokingStatusSchema,
  dietaryNeeds: z.array(z.string()).default([]),
  mobilityNeeds: MobilityNeedSchema,
  medicalEquipment: z.coerce.boolean().default(false),
  petTolerance: z.coerce.boolean().default(true),
  sharedBathroom: z.coerce.boolean().default(true),
  sharedKitchen: z.coerce.boolean().default(true),
  privacyNeed: scaleSchema.default(3),
  choresContribution: scaleSchema.default(3),
  recyclingKnowledge: RecyclingKnowledgeSchema.default('NONE'),
  roomSharingStatus: RoomSharingStatusSchema.default('CAN_SHARE'),
  hasNightDisturbances: z.coerce.boolean().default(false),
  needsQuietEnvironment: z.coerce.boolean().default(false),
  hasSleepEquipment: z.coerce.boolean().default(false),
  supportLevel: SupportLevelSchema.default('STANDARD'),
  hasMedicalDocumentation: z.coerce.boolean().default(false),
  medicalDocType: MedicalDocTypeSchema.optional().nullable(),
  medicalDocDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
  medicalDocNotes: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const ResidentUpdateSchema = ResidentInputSchema.extend({
  id: z.string().cuid(),
})

// =============================================================================
// HOUSING SCHEMAS
// =============================================================================

export const HousingUnitInputSchema = z.object({
  code: z.string().min(1, 'Code ist erforderlich').max(50),
  address: z.string().min(1, 'Adresse ist erforderlich'),
  totalBeds: z.coerce.number().int().min(1),
  totalRooms: z.coerce.number().int().min(1),
  sharedRooms: z.coerce.number().int().min(0),
  privateRooms: z.coerce.number().int().min(0),
  sharedBathrooms: z.coerce.number().int().min(0),
  privateBathrooms: z.coerce.number().int().min(0),
  sharedKitchen: z.coerce.boolean().default(true),
  privateKitchen: z.coerce.boolean().default(false),
  groundFloor: z.coerce.boolean().default(false),
  wheelchairAccess: z.coerce.boolean().default(false),
  elevator: z.coerce.boolean().default(false),
  smokingAllowed: z.coerce.boolean().default(false),
  petsAllowed: z.coerce.boolean().default(false),
  quietHours: z.string().optional().nullable(),
  nearPublicTransport: z.coerce.boolean().default(true),
  nearHealthServices: z.coerce.boolean().default(false),
  nearSchools: z.coerce.boolean().default(false),
  notes: z.string().optional().nullable(),
})

export const HousingUnitUpdateSchema = HousingUnitInputSchema.extend({
  id: z.string().cuid(),
})

// =============================================================================
// SPOT SCHEMAS
// =============================================================================

export const SpotInputSchema = z.object({
  housingUnitId: z.string().cuid(),
  code: z.string().min(1, 'Code ist erforderlich'),
  label: z.string().optional().nullable(),
  type: SpotTypeSchema,
  parentSpotId: z.string().cuid().optional().nullable(),
  squareMeters: z.coerce.number().positive().optional().nullable(),
  floor: z.coerce.number().int().optional().nullable(),
  requiresMedicalDocs: z.coerce.boolean().default(false),
  status: SpotStatusSchema.default('AVAILABLE'),
  notes: z.string().optional().nullable(),
})

export const SpotUpdateSchema = SpotInputSchema.partial().extend({
  id: z.string().cuid(),
  housingUnitId: z.string().cuid(),
})

export const MultipleSpotInputSchema = z.object({
  housingUnitId: z.string().cuid(),
  roomCode: z.string().min(1, 'Zimmer-Code ist erforderlich'),
  roomLabel: z.string().optional().nullable(),
  bedCount: z.coerce.number().int().min(1).max(8).default(2),
  squareMeters: z.coerce.number().positive().optional().nullable(),
  floor: z.coerce.number().int().optional().nullable(),
})

// =============================================================================
// PLACEMENT SCHEMAS
// =============================================================================

export const PlacementInputSchema = z.object({
  residentId: z.string().cuid(),
  housingUnitId: z.string().cuid(),
  spotId: z.string().cuid().optional(),
  compatibilityScore: z.coerce.number().min(0).max(100).optional(),
  lifestyleScore: z.coerce.number().min(0).max(100).optional(),
  socialScore: z.coerce.number().min(0).max(100).optional(),
  practicalScore: z.coerce.number().min(0).max(100).optional(),
  riskScore: z.coerce.number().min(0).max(100).optional(),
  placementNotes: z.string().optional().nullable(),
})

export const EndPlacementSchema = z.object({
  placementId: z.string().cuid(),
  residentId: z.string().cuid(),
  endReason: EndReasonSchema,
  notes: z.string().optional().nullable(),
})

export const TransferPlacementSchema = z.object({
  currentPlacementId: z.string().cuid(),
  residentId: z.string().cuid(),
  targetHousingUnitId: z.string().cuid(),
  targetSpotId: z.string().cuid(),
  transferReason: EndReasonSchema,
  notes: z.string().optional().nullable(),
})

// =============================================================================
// INCIDENT SCHEMAS
// =============================================================================

export const IncidentInputSchema = z.object({
  housingUnitId: z.string().cuid(),
  reportedById: z.string().cuid().optional().nullable(),
  subjectId: z.string().cuid().optional().nullable(),
  category: IncidentCategorySchema,
  type: IncidentTypeSchema,
  severity: IncidentSeveritySchema,
  description: z.string().min(1, 'Beschreibung ist erforderlich'),
  date: z.string().transform((val) => new Date(val)),
})

export const ResolveIncidentSchema = z.object({
  incidentId: z.string().cuid(),
  resolution: z.string().optional().default('Gelöst durch Administrator'),
})

export const FollowUpInputSchema = z.object({
  incidentId: z.string().cuid(),
  action: z.string().min(1, 'Aktion ist erforderlich'),
  notes: z.string().optional().nullable(),
  outcome: z.string().optional().nullable(),
  staffName: z.string().optional().nullable(),
  scheduledNextDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
  followUpPriority: FollowUpPrioritySchema.optional().nullable(),
})

// =============================================================================
// MAINTENANCE SCHEMAS
// =============================================================================

export const MaintenanceRequestInputSchema = z.object({
  housingUnitId: z.string().cuid(),
  spotId: z.string().cuid().optional().nullable(),
  category: MaintenanceCategorySchema,
  priority: MaintenancePrioritySchema.default('NORMAL'),
  title: z.string().min(1, 'Titel ist erforderlich'),
  description: z.string().min(1, 'Beschreibung ist erforderlich'),
  location: z.string().optional().nullable(),
  reportedById: z.string().cuid().optional().nullable(),
  reporterName: z.string().optional().nullable(),
})

export const MaintenanceStatusUpdateSchema = z.object({
  requestId: z.string().cuid(),
  status: MaintenanceStatusSchema,
  assignedTo: z.string().optional().nullable(),
  resolution: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  cost: z.coerce.number().positive().optional().nullable(),
})

export const AssignMaintenanceSchema = z.object({
  requestId: z.string().cuid(),
  assignedTo: z.string().min(1, 'Zuweisungsname ist erforderlich'),
})

// =============================================================================
// SATISFACTION CHECK-IN SCHEMAS
// =============================================================================

export const SatisfactionCheckInInputSchema = z.object({
  placementId: z.string().cuid(),
  checkInType: CheckInTypeSchema,
  weekNumber: z.coerce.number().int().positive().optional().nullable(),
  overallSatisfaction: scaleSchema,
  roommateRelations: scaleSchema.optional().nullable(),
  facilitySatisfaction: scaleSchema.optional().nullable(),
  safetyFeeling: scaleSchema.optional().nullable(),
  concerns: z.string().optional().nullable(),
  improvements: z.string().optional().nullable(),
  positives: z.string().optional().nullable(),
  collectedBy: z.string().optional().nullable(),
  isAnonymous: z.coerce.boolean().default(false),
})

// =============================================================================
// VALIDATION HELPER
// =============================================================================

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; details?: Record<string, string[] | undefined> }

/**
 * Validates FormData against a Zod schema
 * Returns parsed data or throws structured error
 */
export function validateFormData<T extends z.ZodTypeAny>(
  schema: T,
  formData: FormData
): z.output<T> {
  // Convert FormData to object
  const rawData: Record<string, any> = {}

  formData.forEach((value, key) => {
    // Handle arrays (multiple values with same key)
    if (key.endsWith('[]') || rawData[key] !== undefined) {
      const cleanKey = key.replace('[]', '')
      if (!Array.isArray(rawData[cleanKey])) {
        rawData[cleanKey] = rawData[cleanKey] ? [rawData[cleanKey]] : []
      }
      rawData[cleanKey].push(value)
    } else {
      rawData[key] = value === '' ? undefined : value
    }
  })

  // Handle checkbox boolean conversion
  // Unchecked checkboxes don't appear in FormData

  const result = schema.safeParse(rawData)

  if (!result.success) {
    const errors = result.error.flatten()
    const errorMessage = Object.entries(errors.fieldErrors)
      .map(([field, messages]) => `${field}: ${messages?.join(', ')}`)
      .join('; ')
    throw new ValidationError(errorMessage, errors.fieldErrors)
  }

  return result.data
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public fieldErrors: Record<string, string[] | undefined>
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}
