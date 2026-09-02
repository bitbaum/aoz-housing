/**
 * Calculate and store compatibility assessments for all residents in a housing unit
 * Run with: npx tsx scripts/calculate-compatibility.ts [housing-unit-code]
 */

import { eq } from 'drizzle-orm'
import { db, housingUnit, placement, compatibilityAssessment } from '../src/lib/db'
import { calculateCompatibility } from '../src/lib/compatibility'
import { toResidentProfile } from '../src/lib/compatibility/convert'

async function calculateCompatibilityForUnit(unitCode?: string) {
  // Get housing units (all or specific)
  const units = await db.query.housingUnit.findMany({
    where: unitCode ? eq(housingUnit.code, unitCode) : undefined,
    with: {
      placements: {
        where: eq(placement.status, 'ACTIVE'),
        with: { resident: true },
      },
    },
  })

  console.log(`Found ${units.length} housing unit(s)`)

  for (const unit of units) {
    const residents = unit.placements.map((p) => p.resident)

    if (residents.length < 2) {
      console.log(`\n${unit.code}: Only ${residents.length} resident(s), skipping`)
      continue
    }

    console.log(`\n${unit.code}: Calculating compatibility for ${residents.length} residents`)

    // Calculate pair-wise compatibility for all resident pairs
    for (let i = 0; i < residents.length; i++) {
      for (let j = i + 1; j < residents.length; j++) {
        const r1 = residents[i]
        const r2 = residents[j]

        const profile1 = toResidentProfile(r1 as any)
        const profile2 = toResidentProfile(r2 as any)
        const score = calculateCompatibility(profile1, profile2)

        console.log(`  ${r1.code} <-> ${r2.code}: ${score.overall}%`)

        const scores = {
          overallScore: score.overall,
          lifestyleScore: score.lifestyle,
          socialScore: score.social,
          practicalScore: score.practical,
          riskScore: score.risk,
          strengths: score.strengths || [],
          concerns: score.concerns || [],
        }

        // Create/update assessment for r1 -> r2
        await db
          .insert(compatibilityAssessment)
          .values({
            residentId: r1.id,
            comparedWithId: r2.id,
            ...scores,
          })
          .onConflictDoUpdate({
            target: [compatibilityAssessment.residentId, compatibilityAssessment.comparedWithId],
            set: scores,
          })

        // Create/update reverse assessment for r2 -> r1
        await db
          .insert(compatibilityAssessment)
          .values({
            residentId: r2.id,
            comparedWithId: r1.id,
            ...scores,
          })
          .onConflictDoUpdate({
            target: [compatibilityAssessment.residentId, compatibilityAssessment.comparedWithId],
            set: scores,
          })
      }
    }
  }

  console.log('\nDone!')
}

const unitCode = process.argv[2]
calculateCompatibilityForUnit(unitCode)
  .catch(console.error)
  .finally(() => process.exit(0))
