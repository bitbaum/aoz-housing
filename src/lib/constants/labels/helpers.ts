/**
 * Label helper types and functions
 */

import { RESIDENT_FACTORS } from '@/lib/config/resident-factors'

type FactorWithOptions = {
  optionLabels: Record<string, string>
}

export function getLabelsFromFactor(
  factorId: keyof typeof RESIDENT_FACTORS,
): Record<string, string> {
  const factor = RESIDENT_FACTORS[factorId] as FactorWithOptions
  return factor?.optionLabels ?? {}
}

export function getLabel(labels: Record<string, string>, key: string, fallback?: string): string {
  return labels[key] || fallback || key
}
