/**
 * Persist a bidirectional CompatibilityAssessment between two residents.
 *
 * Compatibility is symmetric: if A scores 75 with B, then B scores 75 with A.
 * The DB stores both rows so matrix queries can read either direction without
 * a UNION. This helper makes both upserts atomic from the caller's perspective.
 */

import type { Prisma } from '@prisma/client'
import type { CompatibilityScore } from './types'

type CompatibilityAssessmentTx = {
  compatibilityAssessment: {
    upsert: (args: Prisma.CompatibilityAssessmentUpsertArgs) => Promise<unknown>
  }
}

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

  await tx.compatibilityAssessment.upsert({
    where: {
      residentId_comparedWithId: {
        residentId: residentAId,
        comparedWithId: residentBId,
      },
    },
    update: data,
    create: { residentId: residentAId, comparedWithId: residentBId, ...data },
  })

  await tx.compatibilityAssessment.upsert({
    where: {
      residentId_comparedWithId: {
        residentId: residentBId,
        comparedWithId: residentAId,
      },
    },
    update: data,
    create: { residentId: residentBId, comparedWithId: residentAId, ...data },
  })
}
