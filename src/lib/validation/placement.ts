/**
 * Server-side validation schemas for placement operations
 */

import { z } from 'zod'

/**
 * Schema for validating placement form data
 */
export const placementSchema = z.object({
  residentId: z.string().min(1, 'Bewohner-ID ist erforderlich'),
  housingUnitId: z.string().min(1, 'Unterkunfts-ID ist erforderlich'),
  spotId: z.string().nullable(),
  compatibilityScore: z.number().min(0).max(100),
  lifestyleScore: z.number().min(0).max(100),
  socialScore: z.number().min(0).max(100),
  practicalScore: z.number().min(0).max(100),
  riskScore: z.number().min(0).max(100),
  apartmentFitScore: z.number().min(0).max(100).default(100),
  hasBlockingConflicts: z.boolean().default(false),
  notes: z.string().optional(),
})

export type PlacementInput = z.infer<typeof placementSchema>

/**
 * Parse and validate placement form data from FormData
 */
export function validatePlacementFormData(formData: FormData) {
  const data = {
    residentId: formData.get('residentId') as string,
    housingUnitId: formData.get('housingUnitId') as string,
    spotId: (formData.get('spotId') as string) || null,
    compatibilityScore: parseFloat(formData.get('compatibilityScore') as string),
    lifestyleScore: parseFloat(formData.get('lifestyleScore') as string),
    socialScore: parseFloat(formData.get('socialScore') as string),
    practicalScore: parseFloat(formData.get('practicalScore') as string),
    riskScore: parseFloat(formData.get('riskScore') as string),
    apartmentFitScore: parseFloat(formData.get('apartmentFitScore') as string) || 100,
    hasBlockingConflicts: formData.get('hasBlockingConflicts') === 'true',
    notes: formData.get('notes') as string,
  }

  return placementSchema.parse(data)
}

/**
 * Schema for check-in data
 */
export const checkInSchema = z.object({
  placementId: z.string().min(1, 'Placement-ID ist erforderlich'),
  notes: z.string().optional(),
  wellbeingScore: z.number().int().min(1).max(5).optional(),
  hasIssues: z.boolean().default(false),
  followUpRequired: z.boolean().default(false),
})

export type CheckInInput = z.infer<typeof checkInSchema>
