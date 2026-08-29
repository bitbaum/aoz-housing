import { z } from 'zod'
import {
  AgeRangeSchema,
  GenderSchema,
  FamilyStatusSchema,
  SleepScheduleSchema,
  SocialStyleSchema,
  SmokingStatusSchema,
  MobilityNeedSchema,
} from './schemas'

export const ResidentImportSchema = z.object({
  code: z.string().min(1, 'Code ist erforderlich'),
  ageRange: AgeRangeSchema,
  gender: GenderSchema,
  familyStatus: FamilyStatusSchema,
  sleepSchedule: SleepScheduleSchema,
  noiseTolerance: z.coerce.number().int().min(1).max(5),
  cleanlinessPractice: z.coerce.number().int().min(1).max(5),
  // Optional so CSVs exported before the cleanliness split still import;
  // missing answers stay neutral rather than being invented.
  cleanlinessExpectation: z.coerce.number().int().min(1).max(5).default(3),
  chaosTolerance: z.coerce.number().int().min(1).max(5).default(3),
  socialStyle: SocialStyleSchema,
  smokingStatus: SmokingStatusSchema,
  mobilityNeeds: MobilityNeedSchema,
  languages: z.string().transform((s) =>
    s
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean),
  ),
})
