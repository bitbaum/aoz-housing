/**
 * Persist a bidirectional CompatibilityAssessment between two residents.
 *
 * Compatibility is symmetric: if A scores 75 with B, then B scores 75 with A.
 * The DB stores both rows so matrix queries can read either direction without
 * a UNION. This helper makes both upserts atomic from the caller's perspective.
 */

import { compatibilityAssessment } from '@/lib/db'
import type { db } from '@/lib/db'
import type { CompatibilityScore } from './types'

/**
 * Any Drizzle client that can run inserts — the `db` singleton or, as every
 * current caller does, the `tx` handed out by `db.transaction()`.
 */
type CompatibilityAssessmentTx = Pick<typeof db, 'insert'>

export async function saveBidirectionalAssessment(
  tx: CompatibilityAssessmentTx,
  residentAId: string,
  residentBId: string,
  score: CompatibilityScore,
): Promise<void> {
  const data = {
    overallScore: score.overall,
    lifestyleScore: score.lifestyle,
    socialScore: score.social,
    practicalScore: score.practical,
    riskScore: score.risk,
    strengths: score.strengths || [],
    concerns: score.concerns || [],
  }

  await tx
    .insert(compatibilityAssessment)
    .values({ residentId: residentAId, comparedWithId: residentBId, ...data })
    .onConflictDoUpdate({
      target: [compatibilityAssessment.residentId, compatibilityAssessment.comparedWithId],
      set: data,
    })

  await tx
    .insert(compatibilityAssessment)
    .values({ residentId: residentBId, comparedWithId: residentAId, ...data })
    .onConflictDoUpdate({
      target: [compatibilityAssessment.residentId, compatibilityAssessment.comparedWithId],
      set: data,
    })
}
