/**
 * Demo seed data — the presentation narrative (SSOT).
 *
 * Creates a compelling story:
 * - Unit 5: Success story (high compatibility, 0 conflicts)
 * - Unit 12: Problem unit (low compatibility, multiple conflicts)
 * - Unit 7: Good unit ready for Ahmed
 * - Unit 3: Empty unit ready for new residents
 * - Ahmed: New resident who would fail in Unit 12 but succeed in Unit 7
 *
 * Called from BOTH the CLI seed (prisma/seed-demo.ts, via ts-node) and the
 * daily reset endpoint (api/cron/reset-demo). It only CREATES rows — wiping
 * is the caller's job (see reset.ts) so this stays runnable on an empty dev
 * DB and on the truncated prod demo alike.
 *
 * Relative-import-safe (no '@/' aliases): ts-node does not resolve tsconfig
 * path aliases.
 */

import type { PrismaClient } from '@prisma/client'
import { resolveDemoResidentCode } from './config'

export interface DemoSeedSummary {
  residents: number
  housingUnits: number
  placements: number
  incidents: number
  demoResidentCode: string
}

export async function seedDemoData(prisma: PrismaClient): Promise<DemoSeedSummary> {
  // The portal demo logs in as Fatima: PLACED, in the zero-conflict success
  // unit, so a visitor sees roommates, rules and chores — not an empty shell.
  const demoResidentCode = resolveDemoResidentCode()

  // ========================================================================
  // RESIDENTS - Creating diverse profiles for the story
  // ========================================================================

  // SUCCESS UNIT (Unit 5) - 4 highly compatible residents
  const fatima = await prisma.resident.create({
    data: {
      code: demoResidentCode,
      // Self-chosen profile — shows the resident-profile feature in the tour.
      displayName: 'Fatima',
      bio: 'Ich koche gern für alle und mag es ruhig am Abend.',
      ageRange: 'ADULT',
      gender: 'FEMALE',
      familyStatus: 'FAMILY_WITH_CHILDREN',
      sleepSchedule: 'STANDARD',
      noiseTolerance: 3,
      cleanlinessPractice: 4,
      cleanlinessExpectation: 4,
      chaosTolerance: 6 - (4),
      socialStyle: 'MODERATE',
      languages: ['Arabic', 'German', 'English'],
      culturalRegion: 'Middle East',
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: ['halal'],
      mobilityNeeds: 'NONE',
      medicalEquipment: false,
      petTolerance: true,
      sharedBathroom: true,
      sharedKitchen: true,
      privacyNeed: 3,
      choresContribution: 4,
      recyclingKnowledge: 'BASIC',
      roomSharingStatus: 'PREFERS_PRIVATE',
      hasNightDisturbances: false,
      needsQuietEnvironment: false,
      hasSleepEquipment: false,
      supportLevel: 'STANDARD',
      status: 'PLACED',
      hasMedicalDocumentation: false,
    },
  })

  const yasmin = await prisma.resident.create({
    data: {
      code: 'RES-Y002',
      ageRange: 'ADULT',
      gender: 'FEMALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'STANDARD',
      noiseTolerance: 3,
      cleanlinessPractice: 4,
      cleanlinessExpectation: 4,
      chaosTolerance: 6 - (4),
      socialStyle: 'MODERATE',
      languages: ['Arabic', 'German'],
      culturalRegion: 'Middle East',
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: ['halal'],
      mobilityNeeds: 'NONE',
      medicalEquipment: false,
      petTolerance: true,
      sharedBathroom: true,
      sharedKitchen: true,
      privacyNeed: 3,
      choresContribution: 4,
      recyclingKnowledge: 'GOOD',
      roomSharingStatus: 'CAN_SHARE',
      hasNightDisturbances: false,
      needsQuietEnvironment: false,
      hasSleepEquipment: false,
      supportLevel: 'STANDARD',
      status: 'PLACED',
      hasMedicalDocumentation: false,
    },
  })

  const amira = await prisma.resident.create({
    data: {
      code: 'RES-A003',
      ageRange: 'YOUNG_ADULT',
      gender: 'FEMALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'STANDARD',
      noiseTolerance: 4,
      cleanlinessPractice: 3,
      cleanlinessExpectation: 3,
      chaosTolerance: 6 - (3),
      socialStyle: 'EXTROVERTED',
      languages: ['Arabic', 'English'],
      culturalRegion: 'Middle East',
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: ['halal'],
      mobilityNeeds: 'NONE',
      medicalEquipment: false,
      petTolerance: true,
      sharedBathroom: true,
      sharedKitchen: true,
      privacyNeed: 2,
      choresContribution: 5,
      recyclingKnowledge: 'BASIC',
      roomSharingStatus: 'CAN_SHARE',
      hasNightDisturbances: false,
      needsQuietEnvironment: false,
      hasSleepEquipment: false,
      supportLevel: 'STANDARD',
      status: 'PLACED',
      hasMedicalDocumentation: false,
    },
  })

  const sara = await prisma.resident.create({
    data: {
      code: 'RES-S004',
      ageRange: 'ADULT',
      gender: 'FEMALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'EARLY_BIRD',
      noiseTolerance: 3,
      cleanlinessPractice: 5,
      cleanlinessExpectation: 5,
      chaosTolerance: 6 - (5),
      socialStyle: 'INTROVERTED',
      languages: ['Arabic', 'French', 'English'],
      culturalRegion: 'North Africa',
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: ['halal', 'vegetarian'],
      mobilityNeeds: 'NONE',
      medicalEquipment: false,
      petTolerance: false,
      sharedBathroom: true,
      sharedKitchen: true,
      privacyNeed: 4,
      choresContribution: 4,
      recyclingKnowledge: 'GOOD',
      roomSharingStatus: 'PREFERS_PRIVATE',
      hasNightDisturbances: false,
      needsQuietEnvironment: true,
      hasSleepEquipment: false,
      supportLevel: 'STANDARD',
      status: 'PLACED',
      hasMedicalDocumentation: false,
    },
  })

  // PROBLEM UNIT (Unit 12) - 4 incompatible residents
  const marco = await prisma.resident.create({
    data: {
      code: 'RES-M005',
      ageRange: 'YOUNG_ADULT',
      gender: 'MALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'NIGHT_OWL',
      noiseTolerance: 5,
      cleanlinessPractice: 1,
      cleanlinessExpectation: 1,
      chaosTolerance: 6 - (1),
      socialStyle: 'EXTROVERTED',
      languages: ['Italian', 'English'],
      culturalRegion: 'Europe',
      smokingStatus: 'OUTDOOR_SMOKER',
      dietaryNeeds: [],
      mobilityNeeds: 'NONE',
      medicalEquipment: false,
      petTolerance: true,
      sharedBathroom: true,
      sharedKitchen: true,
      privacyNeed: 1,
      choresContribution: 1,
      recyclingKnowledge: 'NONE',
      roomSharingStatus: 'CAN_SHARE',
      hasNightDisturbances: true,
      needsQuietEnvironment: false,
      hasSleepEquipment: false,
      supportLevel: 'STANDARD',
      status: 'PLACED',
      hasMedicalDocumentation: false,
    },
  })

  const dmitri = await prisma.resident.create({
    data: {
      code: 'RES-D006',
      ageRange: 'ADULT',
      gender: 'MALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'IRREGULAR',
      noiseTolerance: 5,
      cleanlinessPractice: 2,
      cleanlinessExpectation: 2,
      chaosTolerance: 6 - (2),
      socialStyle: 'MODERATE',
      languages: ['Russian', 'English'],
      culturalRegion: 'Eastern Europe',
      smokingStatus: 'OUTDOOR_SMOKER',
      dietaryNeeds: [],
      mobilityNeeds: 'NONE',
      medicalEquipment: false,
      petTolerance: true,
      sharedBathroom: true,
      sharedKitchen: true,
      privacyNeed: 2,
      choresContribution: 2,
      recyclingKnowledge: 'NONE',
      roomSharingStatus: 'CAN_SHARE',
      hasNightDisturbances: false,
      needsQuietEnvironment: false,
      hasSleepEquipment: false,
      supportLevel: 'ELEVATED',
      status: 'PLACED',
      hasMedicalDocumentation: false,
    },
  })

  const petro = await prisma.resident.create({
    data: {
      code: 'RES-P007',
      ageRange: 'YOUNG_ADULT',
      gender: 'MALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'NIGHT_OWL',
      noiseTolerance: 4,
      cleanlinessPractice: 2,
      cleanlinessExpectation: 2,
      chaosTolerance: 6 - (2),
      socialStyle: 'EXTROVERTED',
      languages: ['Ukrainian', 'Russian'],
      culturalRegion: 'Eastern Europe',
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: [],
      mobilityNeeds: 'NONE',
      medicalEquipment: false,
      petTolerance: true,
      sharedBathroom: true,
      sharedKitchen: true,
      privacyNeed: 1,
      choresContribution: 1,
      recyclingKnowledge: 'NONE',
      roomSharingStatus: 'CAN_SHARE',
      hasNightDisturbances: false,
      needsQuietEnvironment: false,
      hasSleepEquipment: false,
      supportLevel: 'STANDARD',
      status: 'PLACED',
      hasMedicalDocumentation: false,
    },
  })

  const alexei = await prisma.resident.create({
    data: {
      code: 'RES-AL008',
      ageRange: 'ADULT',
      gender: 'MALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'STANDARD',
      noiseTolerance: 3,
      cleanlinessPractice: 5,
      cleanlinessExpectation: 5,
      chaosTolerance: 6 - (5),
      socialStyle: 'INTROVERTED',
      languages: ['Russian', 'German'],
      culturalRegion: 'Eastern Europe',
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: [],
      mobilityNeeds: 'NONE',
      medicalEquipment: false,
      petTolerance: false,
      sharedBathroom: true,
      sharedKitchen: true,
      privacyNeed: 5,
      choresContribution: 5,
      recyclingKnowledge: 'GOOD',
      roomSharingStatus: 'NEEDS_PRIVATE',
      hasNightDisturbances: false,
      needsQuietEnvironment: true,
      hasSleepEquipment: false,
      supportLevel: 'STANDARD',
      status: 'PLACED',
      hasMedicalDocumentation: true,
      medicalDocType: 'PRIVATE_ROOM',
      medicalDocDate: new Date('2024-01-15'),
    },
  })

  // UNIT 7 RESIDENTS - Good mid-tier unit
  const habib = await prisma.resident.create({
    data: {
      code: 'RES-H009',
      ageRange: 'ADULT',
      gender: 'MALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'EARLY_BIRD',
      noiseTolerance: 3,
      cleanlinessPractice: 4,
      cleanlinessExpectation: 4,
      chaosTolerance: 6 - (4),
      socialStyle: 'MODERATE',
      languages: ['Arabic', 'French', 'German'],
      culturalRegion: 'North Africa',
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: ['halal'],
      mobilityNeeds: 'NONE',
      medicalEquipment: false,
      petTolerance: true,
      sharedBathroom: true,
      sharedKitchen: true,
      privacyNeed: 3,
      choresContribution: 4,
      recyclingKnowledge: 'BASIC',
      roomSharingStatus: 'CAN_SHARE',
      hasNightDisturbances: false,
      needsQuietEnvironment: false,
      hasSleepEquipment: false,
      supportLevel: 'STANDARD',
      status: 'PLACED',
      hasMedicalDocumentation: false,
    },
  })

  const omar = await prisma.resident.create({
    data: {
      code: 'RES-O010',
      ageRange: 'YOUNG_ADULT',
      gender: 'MALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'STANDARD',
      noiseTolerance: 4,
      cleanlinessPractice: 3,
      cleanlinessExpectation: 3,
      chaosTolerance: 6 - (3),
      socialStyle: 'MODERATE',
      languages: ['Arabic', 'German'],
      culturalRegion: 'Middle East',
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: ['halal'],
      mobilityNeeds: 'NONE',
      medicalEquipment: false,
      petTolerance: true,
      sharedBathroom: true,
      sharedKitchen: true,
      privacyNeed: 2,
      choresContribution: 3,
      recyclingKnowledge: 'BASIC',
      roomSharingStatus: 'CAN_SHARE',
      hasNightDisturbances: false,
      needsQuietEnvironment: false,
      hasSleepEquipment: false,
      supportLevel: 'STANDARD',
      status: 'PLACED',
      hasMedicalDocumentation: false,
    },
  })

  const mustafa = await prisma.resident.create({
    data: {
      code: 'RES-MU011',
      ageRange: 'ADULT',
      gender: 'MALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'EARLY_BIRD',
      noiseTolerance: 3,
      cleanlinessPractice: 4,
      cleanlinessExpectation: 4,
      chaosTolerance: 6 - (4),
      socialStyle: 'INTROVERTED',
      languages: ['Turkish', 'German', 'English'],
      culturalRegion: 'Middle East',
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: ['halal'],
      mobilityNeeds: 'NONE',
      medicalEquipment: false,
      petTolerance: true,
      sharedBathroom: true,
      sharedKitchen: true,
      privacyNeed: 4,
      choresContribution: 5,
      recyclingKnowledge: 'GOOD',
      roomSharingStatus: 'PREFERS_PRIVATE',
      hasNightDisturbances: false,
      needsQuietEnvironment: false,
      hasSleepEquipment: false,
      supportLevel: 'STANDARD',
      status: 'PLACED',
      hasMedicalDocumentation: false,
    },
  })

  // UNIT 9 RESIDENTS - Mixed unit
  const elena = await prisma.resident.create({
    data: {
      code: 'RES-E012',
      ageRange: 'MIDDLE_AGED',
      gender: 'FEMALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'STANDARD',
      noiseTolerance: 3,
      cleanlinessPractice: 3,
      cleanlinessExpectation: 3,
      chaosTolerance: 6 - (3),
      socialStyle: 'MODERATE',
      languages: ['Spanish', 'English'],
      culturalRegion: 'Latin America',
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: [],
      mobilityNeeds: 'NONE',
      medicalEquipment: false,
      petTolerance: true,
      sharedBathroom: true,
      sharedKitchen: true,
      privacyNeed: 3,
      choresContribution: 3,
      recyclingKnowledge: 'BASIC',
      roomSharingStatus: 'CAN_SHARE',
      hasNightDisturbances: false,
      needsQuietEnvironment: false,
      hasSleepEquipment: false,
      supportLevel: 'STANDARD',
      status: 'PLACED',
      hasMedicalDocumentation: false,
    },
  })

  const grace = await prisma.resident.create({
    data: {
      code: 'RES-G013',
      ageRange: 'YOUNG_ADULT',
      gender: 'FEMALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'STANDARD',
      noiseTolerance: 4,
      cleanlinessPractice: 3,
      cleanlinessExpectation: 3,
      chaosTolerance: 6 - (3),
      socialStyle: 'EXTROVERTED',
      languages: ['English', 'French'],
      culturalRegion: 'Sub-Saharan Africa',
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: [],
      mobilityNeeds: 'NONE',
      medicalEquipment: false,
      petTolerance: true,
      sharedBathroom: true,
      sharedKitchen: true,
      privacyNeed: 2,
      choresContribution: 4,
      recyclingKnowledge: 'BASIC',
      roomSharingStatus: 'CAN_SHARE',
      hasNightDisturbances: false,
      needsQuietEnvironment: false,
      hasSleepEquipment: false,
      supportLevel: 'STANDARD',
      status: 'PLACED',
      hasMedicalDocumentation: false,
    },
  })

  // UNPLACED RESIDENTS - The stars of the demo
  const ahmed = await prisma.resident.create({
    data: {
      code: 'RES-AH014',
      ageRange: 'ADULT',
      gender: 'MALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'EARLY_BIRD',
      noiseTolerance: 3,
      cleanlinessPractice: 4,
      cleanlinessExpectation: 4,
      chaosTolerance: 6 - (4),
      socialStyle: 'MODERATE',
      languages: ['Arabic', 'German'],
      culturalRegion: 'Middle East',
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: ['halal'],
      mobilityNeeds: 'NONE',
      medicalEquipment: false,
      petTolerance: true,
      sharedBathroom: true,
      sharedKitchen: true,
      privacyNeed: 3,
      choresContribution: 4,
      recyclingKnowledge: 'BASIC',
      roomSharingStatus: 'CAN_SHARE',
      hasNightDisturbances: false,
      needsQuietEnvironment: false,
      hasSleepEquipment: false,
      supportLevel: 'STANDARD',
      status: 'ACTIVE', // UNPLACED - This is our demo star!
      notes: 'New arrival today - needs placement. Good candidate for Arabic-speaking unit.',
      hasMedicalDocumentation: false,
    },
  })

  const maria = await prisma.resident.create({
    data: {
      code: 'RES-MA015',
      ageRange: 'MIDDLE_AGED',
      gender: 'FEMALE',
      familyStatus: 'SINGLE',
      sleepSchedule: 'STANDARD',
      noiseTolerance: 2,
      cleanlinessPractice: 5,
      cleanlinessExpectation: 5,
      chaosTolerance: 6 - (5),
      socialStyle: 'INTROVERTED',
      languages: ['Spanish', 'English'],
      culturalRegion: 'Latin America',
      smokingStatus: 'NON_SMOKER',
      dietaryNeeds: [],
      mobilityNeeds: 'NONE',
      medicalEquipment: false,
      petTolerance: false,
      sharedBathroom: true,
      sharedKitchen: true,
      privacyNeed: 5,
      choresContribution: 5,
      recyclingKnowledge: 'GOOD',
      roomSharingStatus: 'PREFERS_PRIVATE',
      hasNightDisturbances: false,
      needsQuietEnvironment: true,
      hasSleepEquipment: false,
      supportLevel: 'ELEVATED',
      status: 'ACTIVE', // UNPLACED
      notes: 'Previously transferred 3 times due to cleanliness conflicts. Needs quiet, clean environment.',
      hasMedicalDocumentation: false,
    },
  })


  // ========================================================================
  // HOUSING UNITS
  // ========================================================================


  // UNIT 5 - THE SUCCESS STORY
  const unit5 = await prisma.housingUnit.create({
    data: {
      code: 'UNIT-005',
      address: 'Mühlebachstrasse 45, 8008 Zürich',
      // Resident-chosen apartment name — shows the apartment profile feature.
      nickname: 'Casa Harmonie',
      totalBeds: 4,
      totalRooms: 2,
      sharedRooms: 2,
      privateRooms: 0,
      sharedBathrooms: 1,
      privateBathrooms: 0,
      sharedKitchen: true,
      privateKitchen: false,
      groundFloor: false,
      wheelchairAccess: false,
      elevator: true,
      smokingAllowed: false,
      petsAllowed: false,
      quietHours: '22:00-07:00',
      nearPublicTransport: true,
      nearHealthServices: true,
      nearSchools: false,
      status: 'FULL',
      notes: 'Success story - 6 months with zero conflicts. All residents highly compatible.',
    },
  })

  // UNIT 12 - THE PROBLEM UNIT
  const unit12 = await prisma.housingUnit.create({
    data: {
      code: 'UNIT-012',
      address: 'Langstrasse 127, 8004 Zürich',
      totalBeds: 5,
      totalRooms: 3,
      sharedRooms: 2,
      privateRooms: 1,
      sharedBathrooms: 2,
      privateBathrooms: 0,
      sharedKitchen: true,
      privateKitchen: false,
      groundFloor: false,
      wheelchairAccess: false,
      elevator: false,
      smokingAllowed: true,
      petsAllowed: true,
      quietHours: '23:00-06:00',
      nearPublicTransport: true,
      nearHealthServices: false,
      nearSchools: false,
      status: 'AVAILABLE',
      notes: 'Historical issues with noise and cleanliness. Needs careful matching.',
    },
  })

  // UNIT 7 - GOOD UNIT (ready for Ahmed)
  const unit7 = await prisma.housingUnit.create({
    data: {
      code: 'UNIT-007',
      address: 'Badenerstrasse 88, 8004 Zürich',
      totalBeds: 4,
      totalRooms: 2,
      sharedRooms: 2,
      privateRooms: 0,
      sharedBathrooms: 1,
      privateBathrooms: 0,
      sharedKitchen: true,
      privateKitchen: false,
      groundFloor: false,
      wheelchairAccess: false,
      elevator: true,
      smokingAllowed: false,
      petsAllowed: false,
      quietHours: '22:00-07:00',
      nearPublicTransport: true,
      nearHealthServices: true,
      nearSchools: false,
      status: 'AVAILABLE',
      notes: 'Stable unit with Arabic-speaking residents. Good for cultural integration.',
    },
  })

  // UNIT 3 - EMPTY UNIT
  const unit3 = await prisma.housingUnit.create({
    data: {
      code: 'UNIT-003',
      address: 'Hohlstrasse 56, 8004 Zürich',
      totalBeds: 3,
      totalRooms: 3,
      sharedRooms: 0,
      privateRooms: 3,
      sharedBathrooms: 1,
      privateBathrooms: 0,
      sharedKitchen: true,
      privateKitchen: false,
      groundFloor: true,
      wheelchairAccess: true,
      elevator: false,
      smokingAllowed: false,
      petsAllowed: false,
      quietHours: '22:00-07:00',
      nearPublicTransport: true,
      nearHealthServices: true,
      nearSchools: true,
      status: 'AVAILABLE',
      notes: 'Newly available unit. All private rooms. Ground floor with wheelchair access.',
    },
  })

  // UNIT 9 - MIXED UNIT
  const unit9 = await prisma.housingUnit.create({
    data: {
      code: 'UNIT-009',
      address: 'Josefstrasse 34, 8005 Zürich',
      totalBeds: 3,
      totalRooms: 2,
      sharedRooms: 1,
      privateRooms: 1,
      sharedBathrooms: 1,
      privateBathrooms: 0,
      sharedKitchen: true,
      privateKitchen: false,
      groundFloor: false,
      wheelchairAccess: false,
      elevator: true,
      smokingAllowed: false,
      petsAllowed: true,
      quietHours: '22:00-07:00',
      nearPublicTransport: true,
      nearHealthServices: false,
      nearSchools: false,
      status: 'AVAILABLE',
      notes: 'Mixed demographic unit. Moderate performance.',
    },
  })


  // ========================================================================
  // PLACEMENT SPOTS
  // ========================================================================


  // Unit 5 spots (all occupied)
  const unit5Bed1 = await prisma.placementSpot.create({
    data: { housingUnitId: unit5.id, code: 'R1-B1', label: 'Room 1 - Bed 1', type: 'BED', capacity: 1, status: 'OCCUPIED' }
  })
  const unit5Bed2 = await prisma.placementSpot.create({
    data: { housingUnitId: unit5.id, code: 'R1-B2', label: 'Room 1 - Bed 2', type: 'BED', capacity: 1, status: 'OCCUPIED' }
  })
  const unit5Bed3 = await prisma.placementSpot.create({
    data: { housingUnitId: unit5.id, code: 'R2-B1', label: 'Room 2 - Bed 1', type: 'BED', capacity: 1, status: 'OCCUPIED' }
  })
  const unit5Bed4 = await prisma.placementSpot.create({
    data: { housingUnitId: unit5.id, code: 'R2-B2', label: 'Room 2 - Bed 2', type: 'BED', capacity: 1, status: 'OCCUPIED' }
  })

  // Unit 12 spots
  const unit12Bed1 = await prisma.placementSpot.create({
    data: { housingUnitId: unit12.id, code: 'R1-B1', label: 'Room 1 - Bed 1', type: 'BED', capacity: 1, status: 'OCCUPIED' }
  })
  const unit12Bed2 = await prisma.placementSpot.create({
    data: { housingUnitId: unit12.id, code: 'R1-B2', label: 'Room 1 - Bed 2', type: 'BED', capacity: 1, status: 'OCCUPIED' }
  })
  const unit12Bed3 = await prisma.placementSpot.create({
    data: { housingUnitId: unit12.id, code: 'R2-B1', label: 'Room 2 - Bed 1', type: 'BED', capacity: 1, status: 'OCCUPIED' }
  })
  const unit12Room3 = await prisma.placementSpot.create({
    data: { housingUnitId: unit12.id, code: 'R3', label: 'Private Room 3', type: 'PRIVATE_ROOM', capacity: 1, status: 'OCCUPIED', requiresMedicalDocs: true }
  })
  const unit12Bed5 = await prisma.placementSpot.create({
    data: { housingUnitId: unit12.id, code: 'R2-B2', label: 'Room 2 - Bed 2', type: 'BED', capacity: 1, status: 'AVAILABLE' }
  })

  // Unit 7 spots (one available for Ahmed!)
  const unit7Bed1 = await prisma.placementSpot.create({
    data: { housingUnitId: unit7.id, code: 'R1-B1', label: 'Room 1 - Bed 1', type: 'BED', capacity: 1, status: 'OCCUPIED' }
  })
  const unit7Bed2 = await prisma.placementSpot.create({
    data: { housingUnitId: unit7.id, code: 'R1-B2', label: 'Room 1 - Bed 2', type: 'BED', capacity: 1, status: 'OCCUPIED' }
  })
  const unit7Bed3 = await prisma.placementSpot.create({
    data: { housingUnitId: unit7.id, code: 'R2-B1', label: 'Room 2 - Bed 1', type: 'BED', capacity: 1, status: 'OCCUPIED' }
  })
  const unit7Bed4 = await prisma.placementSpot.create({
    data: { housingUnitId: unit7.id, code: 'R2-B2', label: 'Room 2 - Bed 2', type: 'BED', capacity: 1, status: 'AVAILABLE' }
  })

  // Unit 3 spots (all empty)
  await prisma.placementSpot.create({
    data: { housingUnitId: unit3.id, code: 'R1', label: 'Private Room 1', type: 'PRIVATE_ROOM', capacity: 1, status: 'AVAILABLE' }
  })
  await prisma.placementSpot.create({
    data: { housingUnitId: unit3.id, code: 'R2', label: 'Private Room 2', type: 'PRIVATE_ROOM', capacity: 1, status: 'AVAILABLE' }
  })
  await prisma.placementSpot.create({
    data: { housingUnitId: unit3.id, code: 'R3', label: 'Private Room 3', type: 'PRIVATE_ROOM', capacity: 1, status: 'AVAILABLE' }
  })

  // Unit 9 spots
  const unit9Bed1 = await prisma.placementSpot.create({
    data: { housingUnitId: unit9.id, code: 'R1-B1', label: 'Shared Room - Bed 1', type: 'BED', capacity: 1, status: 'OCCUPIED' }
  })
  const unit9Bed2 = await prisma.placementSpot.create({
    data: { housingUnitId: unit9.id, code: 'R1-B2', label: 'Shared Room - Bed 2', type: 'BED', capacity: 1, status: 'OCCUPIED' }
  })
  await prisma.placementSpot.create({
    data: { housingUnitId: unit9.id, code: 'R2', label: 'Private Room', type: 'PRIVATE_ROOM', capacity: 1, status: 'AVAILABLE' }
  })


  // ========================================================================
  // PLACEMENTS
  // ========================================================================


  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

  // Unit 5 placements (SUCCESS - all high compatibility)
  await prisma.placement.create({
    data: {
      residentId: fatima.id,
      housingUnitId: unit5.id,
      spotId: unit5Bed1.id,
      startDate: sixMonthsAgo,
      status: 'ACTIVE',
      compatibilityScore: 88,
      lifestyleScore: 85,
      socialScore: 92,
      practicalScore: 87,
      riskScore: 12,
      placementNotes: 'Apartment Fit: 88%\n\nStrong match - similar cultural background and lifestyle preferences.',
    }
  })

  await prisma.placement.create({
    data: {
      residentId: yasmin.id,
      housingUnitId: unit5.id,
      spotId: unit5Bed2.id,
      startDate: sixMonthsAgo,
      status: 'ACTIVE',
      compatibilityScore: 85,
      lifestyleScore: 83,
      socialScore: 90,
      practicalScore: 84,
      riskScore: 15,
      placementNotes: 'Apartment Fit: 85%\n\nExcellent language match with Fatima (both Arabic speakers).',
    }
  })

  await prisma.placement.create({
    data: {
      residentId: amira.id,
      housingUnitId: unit5.id,
      spotId: unit5Bed3.id,
      startDate: sixMonthsAgo,
      status: 'ACTIVE',
      compatibilityScore: 82,
      lifestyleScore: 80,
      socialScore: 88,
      practicalScore: 81,
      riskScore: 18,
      placementNotes: 'Apartment Fit: 82%\n\nGood fit with existing residents. Slightly more extroverted but compatible.',
    }
  })

  await prisma.placement.create({
    data: {
      residentId: sara.id,
      housingUnitId: unit5.id,
      spotId: unit5Bed4.id,
      startDate: sixMonthsAgo,
      status: 'ACTIVE',
      compatibilityScore: 79,
      lifestyleScore: 82,
      socialScore: 85,
      practicalScore: 75,
      riskScore: 21,
      placementNotes: 'Apartment Fit: 79%\n\nHighly clean, might set good example. Needs quiet which aligns with unit culture.',
    }
  })

  // Unit 12 placements (PROBLEM - low compatibility, conflicts expected)
  await prisma.placement.create({
    data: {
      residentId: marco.id,
      housingUnitId: unit12.id,
      spotId: unit12Bed1.id,
      startDate: threeMonthsAgo,
      status: 'ACTIVE',
      compatibilityScore: 45,
      lifestyleScore: 38,
      socialScore: 52,
      practicalScore: 48,
      riskScore: 62,
      placementNotes: 'Apartment Fit: 45%\n\nSuboptimal match - significant lifestyle differences.',
    }
  })

  await prisma.placement.create({
    data: {
      residentId: dmitri.id,
      housingUnitId: unit12.id,
      spotId: unit12Bed2.id,
      startDate: threeMonthsAgo,
      status: 'ACTIVE',
      compatibilityScore: 42,
      lifestyleScore: 35,
      socialScore: 48,
      practicalScore: 45,
      riskScore: 58,
      placementNotes: 'Apartment Fit: 42%\n\nLanguage barrier with Marco. Both low on chores contribution.',
    }
  })

  await prisma.placement.create({
    data: {
      residentId: petro.id,
      housingUnitId: unit12.id,
      spotId: unit12Bed3.id,
      startDate: twoMonthsAgo,
      status: 'ACTIVE',
      compatibilityScore: 48,
      lifestyleScore: 40,
      socialScore: 55,
      practicalScore: 50,
      riskScore: 52,
      placementNotes: 'Apartment Fit: 48%\n\nBetter than existing residents but still suboptimal.',
    }
  })

  await prisma.placement.create({
    data: {
      residentId: alexei.id,
      housingUnitId: unit12.id,
      spotId: unit12Room3.id,
      startDate: twoMonthsAgo,
      status: 'ACTIVE',
      compatibilityScore: 28,
      lifestyleScore: 22,
      socialScore: 35,
      practicalScore: 30,
      riskScore: 78,
      placementNotes: 'Apartment Fit: 28%\n\nVery poor match - extremely clean person in messy unit. High conflict risk.',
    }
  })

  // Unit 7 placements (GOOD - ready for Ahmed)
  await prisma.placement.create({
    data: {
      residentId: habib.id,
      housingUnitId: unit7.id,
      spotId: unit7Bed1.id,
      startDate: threeMonthsAgo,
      status: 'ACTIVE',
      compatibilityScore: 82,
      lifestyleScore: 80,
      socialScore: 88,
      practicalScore: 80,
      riskScore: 18,
      placementNotes: 'Apartment Fit: 82%\n\nGood foundational resident for unit.',
    }
  })

  await prisma.placement.create({
    data: {
      residentId: omar.id,
      housingUnitId: unit7.id,
      spotId: unit7Bed2.id,
      startDate: threeMonthsAgo,
      status: 'ACTIVE',
      compatibilityScore: 80,
      lifestyleScore: 78,
      socialScore: 86,
      practicalScore: 78,
      riskScore: 20,
      placementNotes: 'Apartment Fit: 80%\n\nStrong language match with Habib.',
    }
  })

  await prisma.placement.create({
    data: {
      residentId: mustafa.id,
      housingUnitId: unit7.id,
      spotId: unit7Bed3.id,
      startDate: twoMonthsAgo,
      status: 'ACTIVE',
      compatibilityScore: 76,
      lifestyleScore: 75,
      socialScore: 80,
      practicalScore: 74,
      riskScore: 24,
      placementNotes: 'Apartment Fit: 76%\n\nGood addition. Similar early bird schedule with Habib.',
    }
  })

  // Unit 9 placements
  await prisma.placement.create({
    data: {
      residentId: elena.id,
      housingUnitId: unit9.id,
      spotId: unit9Bed1.id,
      startDate: threeMonthsAgo,
      status: 'ACTIVE',
      compatibilityScore: 68,
      lifestyleScore: 65,
      socialScore: 72,
      practicalScore: 67,
      riskScore: 33,
      placementNotes: 'Apartment Fit: 68%\n\nModerate match.',
    }
  })

  await prisma.placement.create({
    data: {
      residentId: grace.id,
      housingUnitId: unit9.id,
      spotId: unit9Bed2.id,
      startDate: twoMonthsAgo,
      status: 'ACTIVE',
      compatibilityScore: 72,
      lifestyleScore: 70,
      socialScore: 75,
      practicalScore: 71,
      riskScore: 28,
      placementNotes: 'Apartment Fit: 72%\n\nGood addition to unit.',
    }
  })


  // ============================================================================
  // INCIDENTS - Demonstrate patterns (Unit 5=success, Unit 12=problems)
  // ============================================================================

  // Unit 12 - PROBLEM UNIT: Multiple conflicts demonstrating poor compatibility

  // Week 2: First cleanliness complaint (predicted timing)
  const incident1 = await prisma.incident.create({
    data: {
      housingUnitId: unit12.id,
      category: 'INTERPERSONAL',
      type: 'CLEANLINESS_DISPUTE',
      date: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000), // 85 days ago
      description: 'Sauberkeitskonflikt: Marco beschwert sich über unordentliche Gemeinschaftsbereiche. Dmitri und Petro lassen Geschirr ungespült.',
      severity: 'MEDIUM',
      resolvedAt: new Date(Date.now() - 83 * 24 * 60 * 60 * 1000),
      resolution: 'Hausordnung besprochen. Putzplan erstellt.',
      reportedById: marco.id,
    }
  })

  await prisma.incidentInvolvement.createMany({
    data: [
      { incidentId: incident1.id, residentId: marco.id, role: 'INVOLVED' },
      { incidentId: incident1.id, residentId: dmitri.id, role: 'INVOLVED' },
      { incidentId: incident1.id, residentId: petro.id, role: 'INVOLVED' },
    ]
  })

  // Week 3: Noise complaint (night owl vs introverted needs privacy)
  const incident2 = await prisma.incident.create({
    data: {
      housingUnitId: unit12.id,
      category: 'INTERPERSONAL',
      type: 'NOISE_COMPLAINT',
      date: new Date(Date.now() - 78 * 24 * 60 * 60 * 1000), // 78 days ago
      description: 'Lärmbelästigung: Alexei beschwert sich über nächtlichen Lärm von Petro (23:00-02:00 Uhr). Beeinflusst seinen Schlaf.',
      severity: 'HIGH',
      resolvedAt: new Date(Date.now() - 76 * 24 * 60 * 60 * 1000),
      resolution: 'Ruhezeiten nach 22:00 Uhr vereinbart. Petro zugestimmt.',
      reportedById: alexei.id,
    }
  })

  await prisma.incidentInvolvement.createMany({
    data: [
      { incidentId: incident2.id, residentId: alexei.id, role: 'INVOLVED' },
      { incidentId: incident2.id, residentId: petro.id, role: 'INVOLVED' },
    ]
  })

  // Week 4: Cleanliness escalation (difference of 3 levels)
  const incident3 = await prisma.incident.create({
    data: {
      housingUnitId: unit12.id,
      category: 'INTERPERSONAL',
      type: 'CLEANLINESS_DISPUTE',
      date: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000), // 70 days ago
      description: 'Schwerer Sauberkeitskonflikt: Alexei (sehr sauber) kann nicht mit Dmitri und Petro (beide Sauberkeit Level 2) zusammenleben. Küche nicht gereinigt seit 5 Tagen.',
      severity: 'HIGH',
      // No reportedById = staff reported
    }
  })

  await prisma.incidentInvolvement.createMany({
    data: [
      { incidentId: incident3.id, residentId: alexei.id, role: 'INVOLVED' },
      { incidentId: incident3.id, residentId: dmitri.id, role: 'INVOLVED' },
      { incidentId: incident3.id, residentId: petro.id, role: 'INVOLVED' },
    ]
  })

  // Week 6: Chores conflict (low contribution causing tension)
  const incident4 = await prisma.incident.create({
    data: {
      housingUnitId: unit12.id,
      category: 'INTERPERSONAL',
      type: 'PERSONAL_CONFLICT',
      date: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000), // 56 days ago
      description: 'Hausarbeitskonflikt: Petro (Beitrag Level 1) beteiligt sich nicht an Reinigungsarbeiten. Marco übernimmt alle Aufgaben.',
      severity: 'MEDIUM',
      resolvedAt: new Date(Date.now() - 52 * 24 * 60 * 60 * 1000),
      resolution: 'Rotierender Putzplan mit klaren Zuständigkeiten eingeführt.',
      reportedById: marco.id,
    }
  })

  await prisma.incidentInvolvement.createMany({
    data: [
      { incidentId: incident4.id, residentId: marco.id, role: 'INVOLVED' },
      { incidentId: incident4.id, residentId: petro.id, role: 'INVOLVED' },
    ]
  })

  // Week 9: Recycling dispute (knowledge gap causing issues)
  const incident5 = await prisma.incident.create({
    data: {
      housingUnitId: unit12.id,
      category: 'INTERPERSONAL',
      type: 'PERSONAL_CONFLICT',
      date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
      description: 'Recycling-Fehler: Dmitri und Petro (keine Recycling-Kenntnisse) werfen alles in den Restmüll. Alexei frustriert.',
      severity: 'LOW',
      resolvedAt: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000),
      resolution: 'Recycling-Schulung durchgeführt. Infografik in Küche aufgehängt.',
      reportedById: alexei.id,
    }
  })

  await prisma.incidentInvolvement.createMany({
    data: [
      { incidentId: incident5.id, residentId: alexei.id, role: 'INVOLVED' },
      { incidentId: incident5.id, residentId: dmitri.id, role: 'INVOLVED' },
      { incidentId: incident5.id, residentId: petro.id, role: 'INVOLVED' },
    ]
  })

  // Week 11: Recent noise complaint (pattern continues)
  const incident6 = await prisma.incident.create({
    data: {
      housingUnitId: unit12.id,
      category: 'INTERPERSONAL',
      type: 'NOISE_COMPLAINT',
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      description: 'Erneute Lärmbelästigung: Petro hält sich nicht an vereinbarte Ruhezeiten. Alexei erwägt Umzug.',
      severity: 'HIGH',
      reportedById: alexei.id,
    }
  })

  await prisma.incidentInvolvement.createMany({
    data: [
      { incidentId: incident6.id, residentId: alexei.id, role: 'INVOLVED' },
      { incidentId: incident6.id, residentId: petro.id, role: 'INVOLVED' },
    ]
  })

  // Unit 5 - SUCCESS STORY: 0 incidents over 6 months (no incidents to create)
  // This demonstrates what good compatibility looks like

  // Unit 9 - One minor incident (manageable with moderate compatibility)
  const incident7 = await prisma.incident.create({
    data: {
      housingUnitId: unit9.id,
      category: 'INTERPERSONAL',
      type: 'PERSONAL_CONFLICT',
      date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      description: 'Kleine Meinungsverschiedenheit über Küchennutzungszeiten. Schnell gelöst durch Kompromiss.',
      severity: 'LOW',
      resolvedAt: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000),
      resolution: 'Nutzungsplan erstellt. Beide Parteien zufrieden.',
      reportedById: elena.id,
    }
  })

  await prisma.incidentInvolvement.createMany({
    data: [
      { incidentId: incident7.id, residentId: elena.id, role: 'INVOLVED' },
      { incidentId: incident7.id, residentId: grace.id, role: 'INVOLVED' },
    ]
  })

  // ========================================================================
  // SHARED EXPENSES (Unit 5) — the expense-sharing tour
  // ========================================================================
  // An equal 4-way split of CHF 48.00 with one settlement already recorded,
  // so the demo shows balances, a suggested transfer AND a payment history.
  const unit5MemberIds = [fatima.id, yasmin.id, amira.id, sara.id]
  const groceries = await prisma.expense.create({
    data: {
      housingUnitId: unit5.id,
      paidById: fatima.id,
      createdById: fatima.id,
      description: 'Wocheneinkauf Migros',
      category: 'GROCERIES',
      amountRappen: 4800,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      shares: {
        create: unit5MemberIds.map((residentId) => ({ residentId, amountRappen: 1200 })),
      },
    },
  })
  await prisma.expense.create({
    data: {
      housingUnitId: unit5.id,
      paidById: yasmin.id,
      createdById: yasmin.id,
      description: 'Putzmittel und WC-Papier',
      category: 'HOUSEHOLD',
      amountRappen: 1860,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      shares: {
        create: unit5MemberIds.map((residentId) => ({ residentId, amountRappen: 465 })),
      },
    },
  })
  await prisma.settlement.create({
    data: {
      housingUnitId: unit5.id,
      fromId: sara.id,
      toId: fatima.id,
      amountRappen: 1200,
      note: `Anteil ${groceries.description}`,
    },
  })

  // Counts are queried, not hardcoded, so the summary can never drift from
  // the data above (ground truth #2: one source of truth).
  const [residents, housingUnits, placements, incidents] = await Promise.all([
    prisma.resident.count(),
    prisma.housingUnit.count(),
    prisma.placement.count(),
    prisma.incident.count(),
  ])

  return { residents, housingUnits, placements, incidents, demoResidentCode }
}
