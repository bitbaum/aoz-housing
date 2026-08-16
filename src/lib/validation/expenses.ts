/**
 * Zod schemas for shared expenses, resident profile and apartment profile.
 *
 * SSOT: enum values and limits are DERIVED from lib/config — never restated.
 * All amounts arrive as integer Rappen (the client converts with chfToRappen).
 */

import { z } from 'zod'
import { EXPENSE_CATEGORY_IDS, EXPENSE_LIMITS } from '@/lib/config/expenses'
import { PROFILE_LIMITS } from '@/lib/config/profile'

export const ExpenseCategorySchema = z.enum(EXPENSE_CATEGORY_IDS)

const AmountRappenSchema = z
  .number()
  .int()
  .min(1)
  .max(EXPENSE_LIMITS.maxAmountRappen)

export const CreateExpenseSchema = z.object({
  description: z.string().trim().min(1).max(EXPENSE_LIMITS.maxDescriptionLength),
  category: ExpenseCategorySchema,
  amountRappen: AmountRappenSchema,
  /** Defaults to the authenticated resident; any unit member may be the payer. */
  paidById: z.string().min(1).optional(),
  /** Defaults to today. */
  date: z.coerce.date().optional(),
  /** Defaults to all current members of the unit (payer included). */
  participantIds: z.array(z.string().min(1)).min(1).optional(),
})
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>

export const CreateSettlementSchema = z.object({
  toResidentId: z.string().min(1),
  amountRappen: AmountRappenSchema,
  note: z.string().trim().max(EXPENSE_LIMITS.maxNoteLength).optional(),
})
export type CreateSettlementInput = z.infer<typeof CreateSettlementSchema>

// Empty strings mean "clear this field" — the route maps them to null.
export const UpdateProfileSchema = z.object({
  displayName: z.string().trim().max(PROFILE_LIMITS.maxDisplayNameLength).optional(),
  bio: z.string().trim().max(PROFILE_LIMITS.maxBioLength).optional(),
  profileVisibility: z.enum(['PRIVATE', 'ROOMMATES', 'RESIDENTS']).optional(),
})
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>

export const UpdateApartmentSchema = z.object({
  nickname: z.string().trim().max(PROFILE_LIMITS.maxNicknameLength),
})
export type UpdateApartmentInput = z.infer<typeof UpdateApartmentSchema>
