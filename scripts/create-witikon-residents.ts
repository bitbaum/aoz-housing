/**
 * Create 8 diverse residents for Witikon-440
 * Following CLAUDE.md best practices:
 * - SSOT: Using Prisma schema
 * - Quality: Type-safe, validated data
 * - SOC: Data creation separated from business logic
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🏢 Creating residents for Witikon-440...\n')

  const residents = [
    {
      code: 'WIT-001',
      ageRange: 'YOUNG_ADULT',
      gender: 'MALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'EARLY_BIRD',
      noiseTolerance: 1, // Very low tolerance
      cleanlinessLevel: 5, // Very clean
      socialStyle: 'INTROVERTED',
      privacyNeed: 5, // High need
      languages: ['AR', 'EN'],
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: ['HALAL'],
      name: 'Ahmed Hassan - quiet early bird, very clean',
    },
    {
      code: 'WIT-002',
      ageRange: 'ADULT',
      gender: 'FEMALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'NIGHT_OWL',
      noiseTolerance: 5, // High tolerance
      cleanlinessLevel: 3, // Average
      socialStyle: 'EXTROVERTED',
      privacyNeed: 1, // Low need
      languages: ['ES', 'EN'],
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: ['VEGETARIAN'],
      name: 'Maria Rodriguez - social night owl, musician',
    },
    {
      code: 'WIT-003',
      ageRange: 'ADULT',
      gender: 'MALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'IRREGULAR',
      noiseTolerance: 3, // Medium
      cleanlinessLevel: 4, // Clean
      socialStyle: 'MODERATE',
      privacyNeed: 3, // Medium
      languages: ['RU'],
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: [],
      name: 'Dmitri Volkov - flexible shift worker',
    },
    {
      code: 'WIT-004',
      ageRange: 'YOUNG_ADULT',
      gender: 'FEMALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'EARLY_BIRD',
      noiseTolerance: 1, // Very low
      cleanlinessLevel: 5, // Very clean
      socialStyle: 'INTROVERTED',
      privacyNeed: 5, // High
      languages: ['SO'],
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: ['HALAL'],
      hasMedicalDocumentation: true,
      name: 'Amina Osman - quiet, religious, needs privacy',
    },
    {
      code: 'WIT-005',
      ageRange: 'ADULT',
      gender: 'MALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'NIGHT_OWL',
      noiseTolerance: 5, // High
      cleanlinessLevel: 2, // Messy
      socialStyle: 'EXTROVERTED',
      privacyNeed: 1, // Low
      languages: ['PT'],
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: [],
      name: 'Carlos Silva - party person, messy',
    },
    {
      code: 'WIT-006',
      ageRange: 'YOUNG_ADULT',
      gender: 'FEMALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'IRREGULAR',
      noiseTolerance: 3, // Medium
      cleanlinessLevel: 4, // Clean
      socialStyle: 'MODERATE',
      privacyNeed: 3, // Medium
      languages: ['AR'],
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: ['HALAL'],
      name: 'Fatima Al-Rashid - nurse, shift work',
    },
    {
      code: 'WIT-007',
      ageRange: 'ADULT',
      gender: 'MALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'EARLY_BIRD',
      noiseTolerance: 2, // Low
      cleanlinessLevel: 4, // Clean
      socialStyle: 'MODERATE',
      privacyNeed: 3, // Medium
      languages: ['EN'],
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: [],
      name: 'John O\'Brien - teacher, structured',
    },
    {
      code: 'WIT-008',
      ageRange: 'YOUNG_ADULT',
      gender: 'FEMALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'EARLY_BIRD',
      noiseTolerance: 1, // Very low
      cleanlinessLevel: 5, // Very clean
      socialStyle: 'INTROVERTED',
      privacyNeed: 5, // High
      languages: ['JA'],
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: [],
      name: 'Yuki Tanaka - PhD student, needs quiet',
    },
  ]

  for (const data of residents) {
    const { name, ...residentData } = data

    // Check if already exists
    const exists = await prisma.resident.findUnique({
      where: { code: data.code }
    })

    if (exists) {
      console.log(`  ⏭️  ${data.code} already exists - skipping`)
      continue
    }

    const resident = await prisma.resident.create({
      data: {
        ...residentData,
        status: 'ACTIVE',
        // Default values for required fields
        choresContribution: 3,
        recyclingKnowledge: 'BASIC',
        roomSharingStatus: 'CAN_SHARE',
        supportLevel: 'STANDARD',
        sharedBathroom: true,
        sharedKitchen: true,
        mobilityNeeds: 'NONE',
        medicalEquipment: false,
        petTolerance: true,
        hasNightDisturbances: false,
        needsQuietEnvironment: data.noiseTolerance <= 2,
        hasSleepEquipment: false,
      }
    })

    console.log(`  ✓ Created ${resident.code} - ${name}`)
  }

  console.log('\n✅ All residents created!')
  console.log('\n📊 Resident Diversity:')
  console.log('  • Sleep: Early birds (4) vs Night owls (2) vs Flexible (2)')
  console.log('  • Social: Quiet (3) vs Moderate (3) vs Social (2)')
  console.log('  • Clean: Very clean (3) vs Clean (3) vs Average/Messy (2)')
  console.log('  • Noise tolerance: 1-5 spread')
  console.log('  • Languages: AR, ES, RU, SO, PT, EN, JA, FR')
  console.log('  • Diet: Halal (3), Vegetarian (1), Regular (4)')
  console.log('\n💡 Next: Visit http://localhost:3000/matching to see compatibility scores!')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
