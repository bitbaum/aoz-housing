/**
 * Server-side validation schemas for incident operations
 */

import { z } from 'zod'

/**
 * Schema for incident creation
 */
export const incidentSchema = z.object({
  housingUnitId: z.string().min(1, 'Unterkunfts-ID ist erforderlich'),
  date: z.date().max(new Date(), 'Datum kann nicht in der Zukunft liegen'),
  category: z.enum(['INTERPERSONAL', 'MAINTENANCE', 'SAFETY', 'POLICY_VIOLATION', 'OTHER']),
  type: z.string().min(1, 'Typ ist erforderlich'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),

  reportedById: z.string().optional(),
  subjectId: z.string().optional(),

  description: z.string().min(10, 'Beschreibung muss mindestens 10 Zeichen lang sein'),
  actionsTaken: z.string().optional(),

  requiresFollowUp: z.boolean().default(false),
  isRecurring: z.boolean().default(false),

  resolvedAt: z.date().optional(),
  resolution: z.string().optional(),
})

export type IncidentInput = z.infer<typeof incidentSchema>

/**
 * Schema for incident resolution
 */
export const incidentResolutionSchema = z.object({
  incidentId: z.string().min(1, 'Incident-ID ist erforderlich'),
  resolution: z.string().min(10, 'Lösung muss mindestens 10 Zeichen lang sein'),
  resolvedAt: z.date().default(() => new Date()),
})

export type IncidentResolutionInput = z.infer<typeof incidentResolutionSchema>

/**
 * Validate that date is not in future
 */
export function validateDateNotFuture(date: Date): boolean {
  return date <= new Date()
}

/**
 * Validate that resolution date is after incident date
 */
export function validateResolutionDate(incidentDate: Date, resolvedDate: Date): boolean {
  return resolvedDate >= incidentDate
}
