/**
 * Calculate and store compatibility assessments for all residents in a housing unit
 * Run with: npx tsx scripts/calculate-compatibility.ts [housing-unit-code]
 */

import { PrismaClient } from '@prisma/client'
import { calculateCompatibility } from '../src/lib/compatibility'
import { toResidentProfile } from '../src/lib/compatibility/convert'

const prisma = new PrismaClient()

async function calculateCompatibilityForUnit(unitCode?: string) {
  // Get housing units (all or specific)
  const units = await prisma.housingUnit.findMany({
    where: unitCode ? { code: unitCode } : undefined,
    include: {
      placements: {
        where: { status: 'ACTIVE' },
        include: { resident: true },
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

        // Create/update assessment for r1 -> r2
        await prisma.compatibilityAssessment.upsert({
          where: {
            residentId_comparedWithId: {
              residentId: r1.id,
              comparedWithId: r2.id,
            },
          },
          update: {
            overallScore: score.overall,
            lifestyleScore: score.lifestyle,
            socialScore: score.social,
            practicalScore: score.practical,
            riskScore: score.risk,
            strengths: score.strengths || [],
            concerns: score.concerns || [],
          },
          create: {
            residentId: r1.id,
            comparedWithId: r2.id,
            overallScore: score.overall,
            lifestyleScore: score.lifestyle,
            socialScore: score.social,
            practicalScore: score.practical,
            riskScore: score.risk,
            strengths: score.strengths || [],
            concerns: score.concerns || [],
          },
        })

        // Create/update reverse assessment for r2 -> r1
        await prisma.compatibilityAssessment.upsert({
          where: {
            residentId_comparedWithId: {
              residentId: r2.id,
              comparedWithId: r1.id,
            },
          },
          update: {
            overallScore: score.overall,
            lifestyleScore: score.lifestyle,
            socialScore: score.social,
            practicalScore: score.practical,
            riskScore: score.risk,
            strengths: score.strengths || [],
            concerns: score.concerns || [],
          },
          create: {
            residentId: r2.id,
            comparedWithId: r1.id,
            overallScore: score.overall,
            lifestyleScore: score.lifestyle,
            socialScore: score.social,
            practicalScore: score.practical,
            riskScore: score.risk,
            strengths: score.strengths || [],
            concerns: score.concerns || [],
          },
        })
      }
    }
  }

  console.log('\nDone!')
}

const unitCode = process.argv[2]
calculateCompatibilityForUnit(unitCode)
  .catch(console.error)
  .finally(() => prisma.$disconnect())
