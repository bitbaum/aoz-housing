/**
 * Shared scoring helpers for placement operations
 *
 * Extracted from matching.ts and placements.ts to eliminate duplication.
 * Used by server actions that create or transfer placements.
 */

import { calculateCompatibility } from '@/lib/compatibility'
import { toResidentProfile } from '@/lib/compatibility/convert'
import type { Resident, Placement } from '@prisma/client'

/** Calculate average compatibility scores between a resident and existing placements */
export function calculateAverageScores(
  resident: Resident,
  existingPlacements: (Placement & { resident: Resident })[]
) {
  if (existingPlacements.length === 0) {
    return { compatibilityScore: 100, lifestyleScore: 100, socialScore: 100, practicalScore: 100, riskScore: 0 }
  }

  const residentProfile = toResidentProfile(resident)
  const scores = existingPlacements.map((p) => {
    const otherProfile = toResidentProfile(p.resident)
    return calculateCompatibility(residentProfile, otherProfile)
  })

  return {
    compatibilityScore: Math.round(scores.reduce((a, s) => a + s.overall, 0) / scores.length),
    lifestyleScore: Math.round(scores.reduce((a, s) => a + s.lifestyle, 0) / scores.length),
    socialScore: Math.round(scores.reduce((a, s) => a + s.social, 0) / scores.length),
    practicalScore: Math.round(scores.reduce((a, s) => a + s.practical, 0) / scores.length),
    riskScore: Math.round(scores.reduce((a, s) => a + s.risk, 0) / scores.length),
  }
}
