/**
 * Validation for the facts a client keeps about their own admin life.
 *
 * Every id uses `idSchema`, never a shape assertion: this repo has already
 * lost 96% of its rows to `z.string().cuid()` outliving the generator that
 * produced cuid v1. An id is an opaque key, and the row lookup plus the
 * permission check — both of which run anyway — prove everything its shape
 * could have.
 *
 * The dates are the point of the feature, so they are parsed here rather than
 * trusted: a renewal reminder computed from a string is a reminder that fires
 * on the wrong day.
 */

import { z } from 'zod'

import { CLIENT_FACT_STATUSES } from '@/lib/client-facts/policy'
import { idSchema } from '@/lib/validation/schemas'

/** An optional `<input type="date">` value, as a Date at UTC midnight. */
const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => value === undefined || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'Bitte ein gültiges Datum wählen.',
  })
  .transform((value) => (value ? new Date(`${value}T00:00:00.000Z`) : null))

const trimmed = (max: number) => z.string().trim().max(max)
const optionalText = (max: number) =>
  trimmed(max)
    .optional()
    .transform((value) => (value ? value : null))

export const PERMIT_TYPES = ['N', 'F', 'B', 'C', 'S', 'OTHER', 'UNSPECIFIED'] as const

export const insuranceInputSchema = z.object({
  id: idSchema.optional(),
  insurerName: trimmed(120).min(1, 'Bitte den Namen der Krankenkasse angeben.'),
  policyNumber: optionalText(80),
  validUntil: optionalDate,
})
export type InsuranceInput = z.infer<typeof insuranceInputSchema>

export const healthContactInputSchema = z.object({
  id: idSchema.optional(),
  name: trimmed(120).min(1, 'Bitte den Namen angeben.'),
  profession: trimmed(80).min(1, 'Bitte angeben, worum es sich handelt (z. B. Zahnärztin).'),
  phone: optionalText(40),
  address: optionalText(200),
  note: optionalText(500),
})
export type HealthContactInput = z.infer<typeof healthContactInputSchema>

export const permitInputSchema = z.object({
  id: idSchema.optional(),
  type: z.enum(PERMIT_TYPES),
  validUntil: optionalDate,
})
export type PermitInput = z.infer<typeof permitInputSchema>

/**
 * A staff review. `note` is what the client will read, so it is optional on a
 * confirmation and required on a rejection — telling someone their entry was
 * refused without saying why leaves them with nothing to do next, which is the
 * same failure as a refusal that reaches nobody.
 */
export const reviewInputSchema = z
  .object({
    id: idSchema,
    kind: z.enum(['INSURANCE', 'HEALTH_CONTACT', 'PERMIT']),
    decision: z.enum(['CONFIRMED', 'REJECTED']),
    staffNote: optionalText(500),
  })
  .refine((value) => value.decision !== 'REJECTED' || !!value.staffNote, {
    path: ['staffNote'],
    message: 'Bitte kurz begründen, was fehlt oder nicht stimmt.',
  })
export type ReviewInput = z.infer<typeof reviewInputSchema>

export const factStatusSchema = z.enum(CLIENT_FACT_STATUSES)
