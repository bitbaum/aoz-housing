import { z } from 'zod'

export const ResidentImportSchema = z.object({
  code: z.string().min(1, 'Code ist erforderlich'),
  ageRange: z.enum(['YOUNG_ADULT', 'ADULT', 'MIDDLE_AGED', 'SENIOR']),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_SAY']),
  familyStatus: z.enum([
    'SINGLE',
    'COUPLE',
    'FAMILY_WITH_CHILDREN',
    'SINGLE_PARENT',
  ]),
  sleepSchedule: z.enum(['EARLY_BIRD', 'STANDARD', 'NIGHT_OWL', 'IRREGULAR']),
  noiseTolerance: z.coerce.number().int().min(1).max(5),
  cleanlinessLevel: z.coerce.number().int().min(1).max(5),
  socialStyle: z.enum(['INTROVERTED', 'MODERATE', 'EXTROVERTED']),
  smokingStatus: z.enum(['NON_SMOKER', 'OUTDOOR_SMOKER', 'INDOOR_SMOKER']),
  mobilityNeeds: z.enum(['NONE', 'GROUND_FLOOR', 'WHEELCHAIR']),
  languages: z
    .string()
    .transform((s) =>
      s
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean)
    ),
})

export type ResidentImportRow = z.infer<typeof ResidentImportSchema>
