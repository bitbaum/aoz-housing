/**
 * Zod validation schemas for all server action inputs
 *
 * SSOT COMPLIANCE: Enum values are DERIVED from config/labels to ensure
 * validation stays in sync with the rest of the application.
 *
 * Type assertions are used to maintain Prisma type compatibility while
 * deriving values from config.
 */

import { z } from 'zod'
import type {
  AgeRange,
  Gender,
  FamilyStatus,
  SleepSchedule,
  SocialStyle,
  SmokingStatus,
  MobilityNeed,
  RoomSharingStatus,
  SupportLevel,
  RecyclingKnowledge,
  MedicalDocType,
  ResidentStatus,
  HousingStatus,
  SpotType,
  SpotStatus,
  PlacementStatus,
  EndReason,
  IncidentCategory,
  IncidentType,
  IncidentSeverity,
  FollowUpPriority,
  InvolvementRole,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
  CheckInType,
} from '@prisma/client'
import { RESIDENT_FACTORS } from '@/lib/config/resident-factors'
import {
  INCIDENT_CATEGORY_LABELS,
  INCIDENT_TYPE_LABELS,
  INCIDENT_SEVERITY_LABELS,
  FOLLOW_UP_PRIORITY_LABELS,
  INVOLVEMENT_ROLE_LABELS,
  HOUSING_STATUS_LABELS,
  PLACEMENT_STATUS_LABELS,
  END_REASON_LABELS,
  RESIDENT_STATUS_LABELS,
  MAINTENANCE_CATEGORY_LABELS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_STATUS_LABELS,
  CHECK_IN_TYPE_LABELS,
  COMPATIBILITY_GAP_LABELS,
} from '@/lib/constants/labels'
import {
  SPOT_TYPE_LABELS,
  SPOT_STATUS_LABELS,
  MEDICAL_DOC_TYPE_LABELS,
} from '@/lib/config/placement-spots'

// =============================================================================
// HELPER: Derive Zod enum from config/labels with proper typing
// =============================================================================

/**
 * Creates a Zod enum schema from an object's keys, typed as the Prisma enum
 */
function enumFromKeys<T>(obj: Record<string, unknown>): z.ZodType<T> {
  const keys = Object.keys(obj) as [string, ...string[]]
  return z.enum(keys) as unknown as z.ZodType<T>
}

/**
 * Creates a Zod enum schema from a factor's options array, typed as the Prisma enum
 */
function enumFromFactor<T>(factorId: keyof typeof RESIDENT_FACTORS): z.ZodType<T> {
  const factor = RESIDENT_FACTORS[factorId]
  if (!factor || !('options' in factor)) {
    throw new Error(`Factor ${factorId} not found or has no options`)
  }
  const options = factor.options as readonly string[]
  return z.enum(options as [string, ...string[]]) as unknown as z.ZodType<T>
}

// =============================================================================
// ENUM SCHEMAS (derived from config/labels - SSOT, typed as Prisma enums)
// =============================================================================

// Resident factors - derived from RESIDENT_FACTORS config
export const AgeRangeSchema = enumFromFactor<AgeRange>('ageRange')
export const GenderSchema = enumFromFactor<Gender>('gender')
export const FamilyStatusSchema = enumFromFactor<FamilyStatus>('familyStatus')
export const SleepScheduleSchema = enumFromFactor<SleepSchedule>('sleepSchedule')
export const SocialStyleSchema = enumFromFactor<SocialStyle>('socialStyle')
export const SmokingStatusSchema = enumFromFactor<SmokingStatus>('smokingStatus')
export const MobilityNeedSchema = enumFromFactor<MobilityNeed>('mobilityNeeds')
export const RoomSharingStatusSchema = enumFromFactor<RoomSharingStatus>('roomSharingStatus')
export const SupportLevelSchema = enumFromFactor<SupportLevel>('supportLevel')
export const RecyclingKnowledgeSchema = enumFromFactor<RecyclingKnowledge>('recyclingKnowledge')

// Spot/placement - derived from placement-spots config
export const SpotTypeSchema = enumFromKeys<SpotType>(SPOT_TYPE_LABELS)
export const SpotStatusSchema = enumFromKeys<SpotStatus>(SPOT_STATUS_LABELS)
export const MedicalDocTypeSchema = enumFromKeys<MedicalDocType>(MEDICAL_DOC_TYPE_LABELS)

// Status enums - derived from labels
export const HousingStatusSchema = enumFromKeys<HousingStatus>(HOUSING_STATUS_LABELS)
export const ResidentStatusSchema = enumFromKeys<ResidentStatus>(RESIDENT_STATUS_LABELS)
export const PlacementStatusSchema = enumFromKeys<PlacementStatus>(PLACEMENT_STATUS_LABELS)
export const EndReasonSchema = enumFromKeys<EndReason>(END_REASON_LABELS)

// Incident - derived from labels
export const IncidentCategorySchema = enumFromKeys<IncidentCategory>(INCIDENT_CATEGORY_LABELS)
export const IncidentTypeSchema = enumFromKeys<IncidentType>(INCIDENT_TYPE_LABELS)
export const IncidentSeveritySchema = enumFromKeys<IncidentSeverity>(INCIDENT_SEVERITY_LABELS)
export const FollowUpPrioritySchema = enumFromKeys<FollowUpPriority>(FOLLOW_UP_PRIORITY_LABELS)
export const InvolvementRoleSchema = enumFromKeys<InvolvementRole>(INVOLVEMENT_ROLE_LABELS)

// Maintenance - derived from labels
export const MaintenanceCategorySchema = enumFromKeys<MaintenanceCategory>(MAINTENANCE_CATEGORY_LABELS)
export const MaintenancePrioritySchema = enumFromKeys<MaintenancePriority>(MAINTENANCE_PRIORITY_LABELS)
export const MaintenanceStatusSchema = enumFromKeys<MaintenanceStatus>(MAINTENANCE_STATUS_LABELS)

// Check-in - derived from labels
export const CheckInTypeSchema = enumFromKeys<CheckInType>(CHECK_IN_TYPE_LABELS)

// Compatibility gap - for conflict analysis
export const CompatibilityGapSchema = enumFromKeys<string>(COMPATIBILITY_GAP_LABELS)

// =============================================================================
// COMMON HELPERS
// =============================================================================

// Scale validation (1-5)
const scaleSchema = z.coerce.number().int().min(1).max(5)

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
  recyclingKnowledge: RecyclingKnowledgeSchema.default('NONE' as RecyclingKnowledge),
  roomSharingStatus: RoomSharingStatusSchema.default('CAN_SHARE' as RoomSharingStatus),
  hasNightDisturbances: z.coerce.boolean().default(false),
  needsQuietEnvironment: z.coerce.boolean().default(false),
  hasSleepEquipment: z.coerce.boolean().default(false),
  supportLevel: SupportLevelSchema.default('STANDARD' as SupportLevel),
  hasMedicalDocumentation: z.coerce.boolean().default(false),
  medicalDocType: MedicalDocTypeSchema.optional().nullable(),
  medicalDocDate: z.string().optional().nullable()
    .refine((val) => !val || !isNaN(new Date(val).getTime()), { message: 'Ungültiges Datum' })
    .transform((val) => val ? new Date(val) : null),
  medicalDocNotes: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const ResidentUpdateSchema = ResidentInputSchema.extend({
  id: z.string().cuid(),
  // code is disabled (read-only) in edit form, so it's not included in FormData
  code: z.string().optional(),
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
  status: SpotStatusSchema.default('AVAILABLE' as SpotStatus),
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
  // Conflict analysis fields (required when endReason is CONFLICT)
  conflictGap: CompatibilityGapSchema.optional().nullable(),
  wasPredictable: z.coerce.boolean().optional().nullable(),
  relatedIncidentId: z.string().cuid().optional().nullable(),
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
  date: z.string()
    .refine((val) => !isNaN(new Date(val).getTime()), { message: 'Ungültiges Datum' })
    .transform((val) => new Date(val)),
  mediationMinutes: z.coerce.number().int().min(0).optional().nullable(),
})

export const ResolveIncidentSchema = z.object({
  incidentId: z.string().cuid(),
  resolution: z.string().optional().default('Gelöst durch Administrator'),
})

export const UpdateMediationTimeSchema = z.object({
  incidentId: z.string().cuid(),
  mediationMinutes: z.coerce.number().int().min(0).max(9999),
})

export const FollowUpInputSchema = z.object({
  incidentId: z.string().cuid(),
  action: z.string().min(1, 'Aktion ist erforderlich'),
  notes: z.string().optional().nullable(),
  outcome: z.string().optional().nullable(),
  staffName: z.string().optional().nullable(),
  scheduledNextDate: z.string().optional().nullable()
    .refine((val) => !val || !isNaN(new Date(val).getTime()), { message: 'Ungültiges Datum' })
    .transform((val) => val ? new Date(val) : null),
  followUpPriority: FollowUpPrioritySchema.optional().nullable(),
})

// =============================================================================
// MAINTENANCE SCHEMAS
// =============================================================================

export const MaintenanceRequestInputSchema = z.object({
  housingUnitId: z.string().cuid(),
  spotId: z.string().cuid().optional().nullable(),
  category: MaintenanceCategorySchema,
  priority: MaintenancePrioritySchema.default('NORMAL' as MaintenancePriority),
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
// PORTAL SCHEMAS (Resident self-service)
// =============================================================================

export const portalLoginSchema = z.object({
  code: z.string().min(1, 'Code ist erforderlich').max(50),
})

export const portalReportSchema = z.object({
  category: IncidentCategorySchema,
  type: IncidentTypeSchema,
  severity: IncidentSeveritySchema,
  description: z.string().min(1, 'Beschreibung ist erforderlich').max(2000),
  location: z.string().max(200).optional(),
  incidentDate: z.string().optional()
    .refine((val) => !val || !isNaN(new Date(val).getTime()), { message: 'Ungültiges Datum' }),
  involvedResident: z.union([z.literal('external'), z.literal('anonymous'), z.string().cuid()]).optional(),
  requestMediation: z.coerce.boolean().default(false),
})

export const portalPreferencesSchema = z.object({
  sleepSchedule: SleepScheduleSchema,
  noiseTolerance: scaleSchema,
  cleanlinessLevel: scaleSchema,
  socialStyle: SocialStyleSchema,
  privacyNeed: scaleSchema,
  smokingStatus: SmokingStatusSchema,
  petTolerance: z.coerce.boolean().default(false),
  sharedBathroom: z.coerce.boolean().default(false),
  sharedKitchen: z.coerce.boolean().default(false),
  languages: z.array(z.string()).default([]),
  dietaryNeeds: z.array(z.string()).default([]),
  preferredAgeRange: z.string().max(50).optional(),
  culturalPreference: z.string().max(50).optional(),
  additionalPreferences: z.string().max(1000).optional(),
})

export const portalRegistrationSchema = z.object({
  ageRange: AgeRangeSchema,
  gender: GenderSchema,
  familyStatus: FamilyStatusSchema,
  languages: z.array(z.string()).default([]),
})

export const portalSatisfactionSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  concerns: z.string().max(2000).optional(),
})

// =============================================================================
// HOUSEHOLD TASK SCHEMAS (Portal chore management)
// =============================================================================

import {
  TASK_TYPE_LABELS,
  TASK_CATEGORY_LABELS,
  TASK_PRIORITY_LABELS,
} from '@/lib/config/household-tasks'
import type {
  HouseholdTaskType,
  HouseholdTaskCategory,
  HouseholdTaskPriority,
} from '@prisma/client'

export const HouseholdTaskTypeSchema = enumFromKeys<HouseholdTaskType>(TASK_TYPE_LABELS)
export const HouseholdTaskCategorySchema = enumFromKeys<HouseholdTaskCategory>(TASK_CATEGORY_LABELS)
export const HouseholdTaskPrioritySchema = enumFromKeys<HouseholdTaskPriority>(TASK_PRIORITY_LABELS)

export const portalCreateTaskSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(200),
  description: z.string().max(2000).optional(),
  instructions: z.string().max(2000).optional(),
  taskType: HouseholdTaskTypeSchema,
  category: HouseholdTaskCategorySchema,
  priority: HouseholdTaskPrioritySchema.default('NORMAL' as HouseholdTaskPriority),
  scheduleHuman: z.string().max(100).optional(),
  estimatedMinutes: z.coerce.number().int().positive().max(480).optional(),
})

export const portalCompleteTaskSchema = z.object({
  notes: z.string().max(500).optional(),
  durationMinutes: z.coerce.number().int().positive().max(480).optional(),
})

export const portalAttentionFlagSchema = z.object({
  message: z.string().max(500).optional(),
})

export const portalTaskRequestSchema = z.object({
  requestedResidentId: z.string().cuid().optional(),
  message: z.string().max(500).optional(),
})

export const portalTaskComplaintSchema = z.object({
  description: z.string().min(1, 'Beschreibung ist erforderlich').max(2000),
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
  const rawData: Record<string, unknown> = {}

  formData.forEach((value, key) => {
    // Handle arrays (multiple values with same key)
    if (key.endsWith('[]') || rawData[key] !== undefined) {
      const cleanKey = key.replace('[]', '')
      if (!Array.isArray(rawData[cleanKey])) {
        rawData[cleanKey] = rawData[cleanKey] ? [rawData[cleanKey]] : []
      }
      ;(rawData[cleanKey] as unknown[]).push(value)
    } else {
      rawData[key] = value === '' ? undefined : value
    }
  })

  // Coerce single values to arrays for schema fields that expect arrays.
  // FormData sends a single string when only one checkbox is checked,
  // but Zod array fields need an actual array.
  if ('shape' in schema && typeof schema.shape === 'object') {
    const shape = schema.shape as Record<string, z.ZodTypeAny>
    for (const [key, fieldSchema] of Object.entries(shape)) {
      if (rawData[key] !== undefined && !Array.isArray(rawData[key])) {
        // Unwrap ZodDefault, ZodOptional, etc. to find the inner type
        let inner: z.ZodTypeAny = fieldSchema
        while (
          inner instanceof z.ZodDefault ||
          inner instanceof z.ZodOptional ||
          inner instanceof z.ZodNullable
        ) {
          inner = inner._def.innerType
        }
        if (inner instanceof z.ZodArray) {
          rawData[key] = [rawData[key]]
        }
      }
    }
  }

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
