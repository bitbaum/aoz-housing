/**
 * Seed script for AOZ Housing
 *
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.incidentInvolvement.deleteMany()
  await prisma.incident.deleteMany()
  await prisma.compatibilityAssessment.deleteMany()
  await prisma.placement.deleteMany()
  await prisma.placementSpot.deleteMany()
  await prisma.resident.deleteMany()
  await prisma.housingUnit.deleteMany()
  await prisma.algorithmWeight.deleteMany()

  // Create algorithm weights
  await prisma.algorithmWeight.create({
    data: {
      lifestyleWeight: 30,
      socialWeight: 25,
      practicalWeight: 25,
      riskWeight: 20,
      factorWeights: {
        sleep: 40,
        noise: 30,
        cleanliness: 30,
        socialStyle: 35,
        language: 40,
        privacy: 25,
        smoking: 40,
        sharedSpaces: 30,
        pets: 15,
        dietary: 15,
      },
      active: true,
      notes: 'Initial weights',
    },
  })

  // Create housing units
  const units = await Promise.all([
    prisma.housingUnit.create({
      data: {
        code: 'ZH-001',
        address: 'Langstrasse 42, 8004 Zürich',
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
        notes: 'Zentrale Lage, gute ÖV-Anbindung',
      },
    }),
    prisma.housingUnit.create({
      data: {
        code: 'ZH-002',
        address: 'Badenerstrasse 120, 8004 Zürich',
        totalBeds: 6,
        totalRooms: 3,
        sharedRooms: 2,
        privateRooms: 1,
        sharedBathrooms: 2,
        privateBathrooms: 0,
        sharedKitchen: true,
        privateKitchen: false,
        groundFloor: true,
        wheelchairAccess: true,
        elevator: false,
        smokingAllowed: false,
        petsAllowed: true,
        quietHours: '22:00-07:00',
        nearPublicTransport: true,
        nearHealthServices: false,
        nearSchools: true,
        status: 'AVAILABLE',
        notes: 'Erdgeschoss, barrierefrei',
      },
    }),
    prisma.housingUnit.create({
      data: {
        code: 'ZH-003',
        address: 'Seestrasse 55, 8002 Zürich',
        totalBeds: 3,
        totalRooms: 3,
        sharedRooms: 0,
        privateRooms: 3,
        sharedBathrooms: 1,
        privateBathrooms: 0,
        sharedKitchen: true,
        privateKitchen: false,
        groundFloor: false,
        wheelchairAccess: false,
        elevator: true,
        smokingAllowed: false,
        petsAllowed: false,
        quietHours: '21:00-08:00',
        nearPublicTransport: true,
        nearHealthServices: true,
        nearSchools: false,
        status: 'AVAILABLE',
        notes: 'Ruhige Lage am See, alle Einzelzimmer',
      },
    }),
    prisma.housingUnit.create({
      data: {
        code: 'ZH-004',
        address: 'Hardstrasse 88, 8005 Zürich',
        totalBeds: 8,
        totalRooms: 4,
        sharedRooms: 4,
        privateRooms: 0,
        sharedBathrooms: 2,
        privateBathrooms: 0,
        sharedKitchen: true,
        privateKitchen: false,
        groundFloor: false,
        wheelchairAccess: false,
        elevator: false,
        smokingAllowed: true,
        petsAllowed: false,
        quietHours: '23:00-06:00',
        nearPublicTransport: true,
        nearHealthServices: false,
        nearSchools: false,
        status: 'AVAILABLE',
        notes: 'Grössere Unterkunft, Rauchen auf Balkon erlaubt',
      },
    }),
    prisma.housingUnit.create({
      data: {
        code: 'ZH-005',
        address: 'Militärstrasse 30, 8004 Zürich',
        totalBeds: 2,
        totalRooms: 1,
        sharedRooms: 1,
        privateRooms: 0,
        sharedBathrooms: 1,
        privateBathrooms: 0,
        sharedKitchen: true,
        privateKitchen: false,
        groundFloor: true,
        wheelchairAccess: false,
        elevator: false,
        smokingAllowed: false,
        petsAllowed: false,
        quietHours: '22:00-07:00',
        nearPublicTransport: true,
        nearHealthServices: false,
        nearSchools: true,
        status: 'MAINTENANCE',
        notes: 'Kleine Einheit, derzeit Renovation',
      },
    }),
  ])

  console.log(`✅ Created ${units.length} housing units`)

  // Create placement spots for each unit
  // ZH-001: 2 rooms, 4 beds total (2 beds per room)
  const zh001Room1 = await prisma.placementSpot.create({
    data: {
      housingUnitId: units[0].id,
      code: 'R1',
      label: 'Zimmer 1',
      type: 'ROOM',
      squareMeters: 12,
      floor: 2,
      capacity: 2,
      status: 'AVAILABLE',
    },
  })
  const zh001Room2 = await prisma.placementSpot.create({
    data: {
      housingUnitId: units[0].id,
      code: 'R2',
      label: 'Zimmer 2',
      type: 'ROOM',
      squareMeters: 10,
      floor: 2,
      capacity: 2,
      status: 'AVAILABLE',
    },
  })
  const zh001Beds = await Promise.all([
    prisma.placementSpot.create({
      data: {
        housingUnitId: units[0].id,
        code: 'R1-B1',
        label: 'Bett A',
        type: 'BED',
        parentSpotId: zh001Room1.id,
        status: 'AVAILABLE',
      },
    }),
    prisma.placementSpot.create({
      data: {
        housingUnitId: units[0].id,
        code: 'R1-B2',
        label: 'Bett B',
        type: 'BED',
        parentSpotId: zh001Room1.id,
        status: 'AVAILABLE',
      },
    }),
    prisma.placementSpot.create({
      data: {
        housingUnitId: units[0].id,
        code: 'R2-B1',
        label: 'Bett A',
        type: 'BED',
        parentSpotId: zh001Room2.id,
        status: 'AVAILABLE',
      },
    }),
    prisma.placementSpot.create({
      data: {
        housingUnitId: units[0].id,
        code: 'R2-B2',
        label: 'Bett B',
        type: 'BED',
        parentSpotId: zh001Room2.id,
        status: 'AVAILABLE',
      },
    }),
  ])

  // ZH-002: 3 rooms - 2 shared (2 beds each) + 1 private room (medical)
  const zh002Room1 = await prisma.placementSpot.create({
    data: {
      housingUnitId: units[1].id,
      code: 'R1',
      label: 'Zimmer 1',
      type: 'ROOM',
      squareMeters: 14,
      floor: 0,
      capacity: 2,
      status: 'AVAILABLE',
    },
  })
  const zh002Room2 = await prisma.placementSpot.create({
    data: {
      housingUnitId: units[1].id,
      code: 'R2',
      label: 'Zimmer 2',
      type: 'ROOM',
      squareMeters: 12,
      floor: 0,
      capacity: 2,
      status: 'AVAILABLE',
    },
  })
  const zh002PrivateRoom = await prisma.placementSpot.create({
    data: {
      housingUnitId: units[1].id,
      code: 'R3',
      label: 'Einzelzimmer',
      type: 'PRIVATE_ROOM',
      squareMeters: 10,
      floor: 0,
      capacity: 1,
      requiresMedicalDocs: true,
      status: 'AVAILABLE',
    },
  })
  const zh002Beds = await Promise.all([
    prisma.placementSpot.create({
      data: {
        housingUnitId: units[1].id,
        code: 'R1-B1',
        label: 'Bett A',
        type: 'BED',
        parentSpotId: zh002Room1.id,
        status: 'AVAILABLE',
      },
    }),
    prisma.placementSpot.create({
      data: {
        housingUnitId: units[1].id,
        code: 'R1-B2',
        label: 'Bett B',
        type: 'BED',
        parentSpotId: zh002Room1.id,
        status: 'AVAILABLE',
      },
    }),
    prisma.placementSpot.create({
      data: {
        housingUnitId: units[1].id,
        code: 'R2-B1',
        label: 'Bett A',
        type: 'BED',
        parentSpotId: zh002Room2.id,
        status: 'AVAILABLE',
      },
    }),
    prisma.placementSpot.create({
      data: {
        housingUnitId: units[1].id,
        code: 'R2-B2',
        label: 'Bett B',
        type: 'BED',
        parentSpotId: zh002Room2.id,
        status: 'AVAILABLE',
      },
    }),
  ])

  // ZH-003: 3 private rooms (all medical)
  const zh003Rooms = await Promise.all([
    prisma.placementSpot.create({
      data: {
        housingUnitId: units[2].id,
        code: 'R1',
        label: 'Einzelzimmer 1',
        type: 'PRIVATE_ROOM',
        squareMeters: 12,
        floor: 3,
        capacity: 1,
        requiresMedicalDocs: true,
        status: 'AVAILABLE',
      },
    }),
    prisma.placementSpot.create({
      data: {
        housingUnitId: units[2].id,
        code: 'R2',
        label: 'Einzelzimmer 2',
        type: 'PRIVATE_ROOM',
        squareMeters: 10,
        floor: 3,
        capacity: 1,
        requiresMedicalDocs: true,
        status: 'AVAILABLE',
      },
    }),
    prisma.placementSpot.create({
      data: {
        housingUnitId: units[2].id,
        code: 'R3',
        label: 'Einzelzimmer 3',
        type: 'PRIVATE_ROOM',
        squareMeters: 11,
        floor: 3,
        capacity: 1,
        requiresMedicalDocs: true,
        status: 'AVAILABLE',
      },
    }),
  ])

  // ZH-004: 4 rooms, 8 beds total (2 beds per room)
  const zh004Rooms = await Promise.all([
    prisma.placementSpot.create({
      data: {
        housingUnitId: units[3].id,
        code: 'R1',
        label: 'Zimmer 1',
        type: 'ROOM',
        squareMeters: 10,
        floor: 1,
        capacity: 2,
        status: 'AVAILABLE',
      },
    }),
    prisma.placementSpot.create({
      data: {
        housingUnitId: units[3].id,
        code: 'R2',
        label: 'Zimmer 2',
        type: 'ROOM',
        squareMeters: 10,
        floor: 1,
        capacity: 2,
        status: 'AVAILABLE',
      },
    }),
    prisma.placementSpot.create({
      data: {
        housingUnitId: units[3].id,
        code: 'R3',
        label: 'Zimmer 3',
        type: 'ROOM',
        squareMeters: 12,
        floor: 2,
        capacity: 2,
        status: 'AVAILABLE',
      },
    }),
    prisma.placementSpot.create({
      data: {
        housingUnitId: units[3].id,
        code: 'R4',
        label: 'Zimmer 4',
        type: 'ROOM',
        squareMeters: 12,
        floor: 2,
        capacity: 2,
        status: 'AVAILABLE',
      },
    }),
  ])
  const zh004Beds = await Promise.all(
    zh004Rooms.flatMap((room, idx) => [
      prisma.placementSpot.create({
        data: {
          housingUnitId: units[3].id,
          code: `R${idx + 1}-B1`,
          label: 'Bett A',
          type: 'BED',
          parentSpotId: room.id,
          status: 'AVAILABLE',
        },
      }),
      prisma.placementSpot.create({
        data: {
          housingUnitId: units[3].id,
          code: `R${idx + 1}-B2`,
          label: 'Bett B',
          type: 'BED',
          parentSpotId: room.id,
          status: 'AVAILABLE',
        },
      }),
    ])
  )

  // ZH-005: 1 room, 2 beds (in maintenance)
  const zh005Room = await prisma.placementSpot.create({
    data: {
      housingUnitId: units[4].id,
      code: 'R1',
      label: 'Zimmer 1',
      type: 'ROOM',
      squareMeters: 10,
      floor: 0,
      capacity: 2,
      status: 'MAINTENANCE',
    },
  })
  const zh005Beds = await Promise.all([
    prisma.placementSpot.create({
      data: {
        housingUnitId: units[4].id,
        code: 'R1-B1',
        label: 'Bett A',
        type: 'BED',
        parentSpotId: zh005Room.id,
        status: 'MAINTENANCE',
      },
    }),
    prisma.placementSpot.create({
      data: {
        housingUnitId: units[4].id,
        code: 'R1-B2',
        label: 'Bett B',
        type: 'BED',
        parentSpotId: zh005Room.id,
        status: 'MAINTENANCE',
      },
    }),
  ])

  // Collect all spots for later use
  const allSpots = {
    zh001: { rooms: [zh001Room1, zh001Room2], beds: zh001Beds },
    zh002: { rooms: [zh002Room1, zh002Room2], privateRoom: zh002PrivateRoom, beds: zh002Beds },
    zh003: { rooms: zh003Rooms },
    zh004: { rooms: zh004Rooms, beds: zh004Beds },
    zh005: { room: zh005Room, beds: zh005Beds },
  }

  const spotCount = 2 + 4 + 3 + 4 + 1 + 4 + 8 + 1 + 2 + 3 // rooms + beds for each unit
  console.log(`✅ Created ${spotCount} placement spots`)

  // Create residents
  const residents = await Promise.all([
    // Placed residents
    prisma.resident.create({
      data: {
        code: 'RES-001',
        ageRange: 'YOUNG_ADULT',
        gender: 'MALE',
        familyStatus: 'SINGLE',
        sleepSchedule: 'STANDARD',
        noiseTolerance: 3,
        cleanlinessLevel: 4,
        socialStyle: 'MODERATE',
        languages: ['ar', 'en'],
        culturalRegion: 'Middle East',
        smokingStatus: 'NON_SMOKER',
        dietaryNeeds: ['halal'],
        mobilityNeeds: 'NONE',
        medicalEquipment: false,
        petTolerance: true,
        sharedBathroom: true,
        sharedKitchen: true,
        privacyNeed: 3,
        status: 'PLACED',
        notes: 'Studiert Informatik an der ETH',
      },
    }),
    prisma.resident.create({
      data: {
        code: 'RES-002',
        ageRange: 'ADULT',
        gender: 'MALE',
        familyStatus: 'SINGLE',
        sleepSchedule: 'NIGHT_OWL',
        noiseTolerance: 4,
        cleanlinessLevel: 3,
        socialStyle: 'EXTROVERTED',
        languages: ['ar', 'fr'],
        culturalRegion: 'Middle East',
        smokingStatus: 'OUTDOOR_SMOKER',
        dietaryNeeds: ['halal'],
        mobilityNeeds: 'NONE',
        medicalEquipment: false,
        petTolerance: true,
        sharedBathroom: true,
        sharedKitchen: true,
        privacyNeed: 2,
        status: 'PLACED',
        notes: 'Arbeitet als Koch, Spätschicht',
      },
    }),
    prisma.resident.create({
      data: {
        code: 'RES-003',
        ageRange: 'ADULT',
        gender: 'FEMALE',
        familyStatus: 'SINGLE',
        sleepSchedule: 'EARLY_BIRD',
        noiseTolerance: 2,
        cleanlinessLevel: 5,
        socialStyle: 'INTROVERTED',
        languages: ['uk', 'ru', 'en'],
        culturalRegion: 'Eastern Europe',
        smokingStatus: 'NON_SMOKER',
        dietaryNeeds: [],
        mobilityNeeds: 'NONE',
        medicalEquipment: false,
        petTolerance: false,
        sharedBathroom: true,
        sharedKitchen: true,
        privacyNeed: 5,
        status: 'PLACED',
        notes: 'Ärztin, wartet auf Anerkennung',
        // Medical docs for private room eligibility
        hasMedicalDocumentation: true,
        medicalDocType: 'PRIVATE_ROOM',
        medicalDocDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
        medicalDocNotes: 'Benötigt Einzelzimmer aufgrund erhöhtem Privatsphärebedürfnis',
      },
    }),
    prisma.resident.create({
      data: {
        code: 'RES-004',
        ageRange: 'MIDDLE_AGED',
        gender: 'MALE',
        familyStatus: 'SINGLE',
        sleepSchedule: 'STANDARD',
        noiseTolerance: 3,
        cleanlinessLevel: 4,
        socialStyle: 'MODERATE',
        languages: ['ti', 'en'],
        culturalRegion: 'East Africa',
        smokingStatus: 'NON_SMOKER',
        dietaryNeeds: [],
        mobilityNeeds: 'NONE',
        medicalEquipment: false,
        petTolerance: true,
        sharedBathroom: true,
        sharedKitchen: true,
        privacyNeed: 3,
        status: 'PLACED',
        notes: 'Gelernter Elektriker',
      },
    }),
    prisma.resident.create({
      data: {
        code: 'RES-005',
        ageRange: 'YOUNG_ADULT',
        gender: 'MALE',
        familyStatus: 'SINGLE',
        sleepSchedule: 'STANDARD',
        noiseTolerance: 4,
        cleanlinessLevel: 3,
        socialStyle: 'EXTROVERTED',
        languages: ['fa', 'en'],
        culturalRegion: 'Central Asia',
        smokingStatus: 'NON_SMOKER',
        dietaryNeeds: ['halal'],
        mobilityNeeds: 'NONE',
        medicalEquipment: false,
        petTolerance: true,
        sharedBathroom: true,
        sharedKitchen: true,
        privacyNeed: 2,
        status: 'PLACED',
        notes: 'Macht Deutschkurs B1',
        // Medical docs for private room eligibility (in ZH-003)
        hasMedicalDocumentation: true,
        medicalDocType: 'BOTH',
        medicalDocDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        medicalDocNotes: 'Psychologische Empfehlung für ruhige Umgebung',
      },
    }),
    prisma.resident.create({
      data: {
        code: 'RES-006',
        ageRange: 'SENIOR',
        gender: 'MALE',
        familyStatus: 'SINGLE',
        sleepSchedule: 'EARLY_BIRD',
        noiseTolerance: 1,
        cleanlinessLevel: 5,
        socialStyle: 'INTROVERTED',
        languages: ['tr', 'de'],
        culturalRegion: 'Middle East',
        smokingStatus: 'NON_SMOKER',
        dietaryNeeds: [],
        mobilityNeeds: 'GROUND_FLOOR',
        medicalEquipment: true,
        petTolerance: false,
        sharedBathroom: true,
        sharedKitchen: true,
        privacyNeed: 5,
        status: 'PLACED',
        notes: 'Pensioniert, braucht CPAP-Gerät nachts',
      },
    }),
    prisma.resident.create({
      data: {
        code: 'RES-007',
        ageRange: 'ADULT',
        gender: 'FEMALE',
        familyStatus: 'SINGLE',
        sleepSchedule: 'STANDARD',
        noiseTolerance: 3,
        cleanlinessLevel: 4,
        socialStyle: 'MODERATE',
        languages: ['so', 'ar', 'en'],
        culturalRegion: 'East Africa',
        smokingStatus: 'NON_SMOKER',
        dietaryNeeds: ['halal'],
        mobilityNeeds: 'NONE',
        medicalEquipment: false,
        petTolerance: true,
        sharedBathroom: true,
        sharedKitchen: true,
        privacyNeed: 4,
        status: 'PLACED',
        notes: 'Arbeitet Teilzeit im Reinigungsbereich',
        // Medical docs for private room eligibility (in ZH-003)
        hasMedicalDocumentation: true,
        medicalDocType: 'PRIVATE_ROOM',
        medicalDocDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        medicalDocNotes: 'Ärztliches Attest für Einzelzimmer',
      },
    }),
    // Unplaced residents (waiting for placement)
    prisma.resident.create({
      data: {
        code: 'RES-008',
        ageRange: 'YOUNG_ADULT',
        gender: 'MALE',
        familyStatus: 'SINGLE',
        sleepSchedule: 'NIGHT_OWL',
        noiseTolerance: 5,
        cleanlinessLevel: 2,
        socialStyle: 'EXTROVERTED',
        languages: ['ps', 'fa'],
        culturalRegion: 'Central Asia',
        smokingStatus: 'INDOOR_SMOKER',
        dietaryNeeds: ['halal'],
        mobilityNeeds: 'NONE',
        medicalEquipment: false,
        petTolerance: true,
        sharedBathroom: true,
        sharedKitchen: true,
        privacyNeed: 1,
        status: 'ACTIVE',
        notes: 'Neu angekommen, braucht Raucherunterkunft',
      },
    }),
    prisma.resident.create({
      data: {
        code: 'RES-009',
        ageRange: 'ADULT',
        gender: 'FEMALE',
        familyStatus: 'SINGLE',
        sleepSchedule: 'STANDARD',
        noiseTolerance: 2,
        cleanlinessLevel: 5,
        socialStyle: 'INTROVERTED',
        languages: ['uk', 'en'],
        culturalRegion: 'Eastern Europe',
        smokingStatus: 'NON_SMOKER',
        dietaryNeeds: ['vegetarian'],
        mobilityNeeds: 'NONE',
        medicalEquipment: false,
        petTolerance: true,
        sharedBathroom: true,
        sharedKitchen: true,
        privacyNeed: 5,
        status: 'ACTIVE',
        notes: 'IT-Fachfrau, sucht ruhige Unterkunft',
      },
    }),
    prisma.resident.create({
      data: {
        code: 'RES-010',
        ageRange: 'MIDDLE_AGED',
        gender: 'MALE',
        familyStatus: 'SINGLE',
        sleepSchedule: 'IRREGULAR',
        noiseTolerance: 3,
        cleanlinessLevel: 3,
        socialStyle: 'MODERATE',
        languages: ['ar', 'en', 'de'],
        culturalRegion: 'Middle East',
        smokingStatus: 'OUTDOOR_SMOKER',
        dietaryNeeds: ['halal'],
        mobilityNeeds: 'NONE',
        medicalEquipment: false,
        petTolerance: true,
        sharedBathroom: true,
        sharedKitchen: true,
        privacyNeed: 3,
        status: 'ACTIVE',
        notes: 'Taxifahrer, unregelmässige Arbeitszeiten',
      },
    }),
  ])

  console.log(`✅ Created ${residents.length} residents`)

  // Create placements with spot references
  const now = new Date()
  const placements = await Promise.all([
    // ZH-001: RES-001 and RES-002 (some tension - different schedules)
    // Placed in same room (R1) - beds B1 and B2
    prisma.placement.create({
      data: {
        residentId: residents[0].id,
        housingUnitId: units[0].id,
        spotId: allSpots.zh001.beds[0].id, // R1-B1
        startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        compatibilityScore: 72,
        lifestyleScore: 65,
        socialScore: 78,
        practicalScore: 82,
        riskScore: 25,
        status: 'ACTIVE',
        placementNotes: 'Beide arabischsprachig, unterschiedliche Schlafzeiten',
      },
    }),
    prisma.placement.create({
      data: {
        residentId: residents[1].id,
        housingUnitId: units[0].id,
        spotId: allSpots.zh001.beds[1].id, // R1-B2
        startDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        compatibilityScore: 72,
        lifestyleScore: 65,
        socialScore: 78,
        practicalScore: 82,
        riskScore: 25,
        status: 'ACTIVE',
        placementNotes: 'Beide arabischsprachig, unterschiedliche Schlafzeiten',
      },
    }),
    // ZH-002: RES-003 in private room (has medical docs), RES-004, RES-006 in shared rooms
    prisma.placement.create({
      data: {
        residentId: residents[2].id,
        housingUnitId: units[1].id,
        spotId: allSpots.zh002.privateRoom.id, // Private room (medical)
        startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        compatibilityScore: 68,
        lifestyleScore: 72,
        socialScore: 60,
        practicalScore: 75,
        riskScore: 30,
        status: 'ACTIVE',
        placementNotes: 'Einzelzimmer wegen hohem Privatsphärebedürfnis (med. Dok.)',
      },
    }),
    prisma.placement.create({
      data: {
        residentId: residents[3].id,
        housingUnitId: units[1].id,
        spotId: allSpots.zh002.beds[0].id, // R1-B1
        startDate: new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000),
        compatibilityScore: 75,
        lifestyleScore: 78,
        socialScore: 72,
        practicalScore: 80,
        riskScore: 20,
        status: 'ACTIVE',
        placementNotes: 'Gute Passung mit anderen Bewohnern',
      },
    }),
    prisma.placement.create({
      data: {
        residentId: residents[5].id,
        housingUnitId: units[1].id,
        spotId: allSpots.zh002.beds[1].id, // R1-B2 (same room as RES-004)
        startDate: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
        compatibilityScore: 62,
        lifestyleScore: 55,
        socialScore: 65,
        practicalScore: 70,
        riskScore: 35,
        status: 'ACTIVE',
        placementNotes: 'Erdgeschoss wegen Mobilität, CPAP-Gerät',
      },
    }),
    // ZH-003: RES-005, RES-007 (good compatibility) - private rooms
    prisma.placement.create({
      data: {
        residentId: residents[4].id,
        housingUnitId: units[2].id,
        spotId: allSpots.zh003.rooms[0].id, // Private room 1
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        compatibilityScore: 85,
        lifestyleScore: 88,
        socialScore: 80,
        practicalScore: 90,
        riskScore: 10,
        status: 'ACTIVE',
        placementNotes: 'Sehr gute Passung',
      },
    }),
    prisma.placement.create({
      data: {
        residentId: residents[6].id,
        housingUnitId: units[2].id,
        spotId: allSpots.zh003.rooms[1].id, // Private room 2
        startDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        compatibilityScore: 85,
        lifestyleScore: 88,
        socialScore: 80,
        practicalScore: 90,
        riskScore: 10,
        status: 'ACTIVE',
        placementNotes: 'Sehr gute Passung',
      },
    }),
  ])

  // Update spot statuses to OCCUPIED for spots with active placements
  await Promise.all([
    prisma.placementSpot.update({ where: { id: allSpots.zh001.beds[0].id }, data: { status: 'OCCUPIED' } }),
    prisma.placementSpot.update({ where: { id: allSpots.zh001.beds[1].id }, data: { status: 'OCCUPIED' } }),
    prisma.placementSpot.update({ where: { id: allSpots.zh002.privateRoom.id }, data: { status: 'OCCUPIED' } }),
    prisma.placementSpot.update({ where: { id: allSpots.zh002.beds[0].id }, data: { status: 'OCCUPIED' } }),
    prisma.placementSpot.update({ where: { id: allSpots.zh002.beds[1].id }, data: { status: 'OCCUPIED' } }),
    prisma.placementSpot.update({ where: { id: allSpots.zh003.rooms[0].id }, data: { status: 'OCCUPIED' } }),
    prisma.placementSpot.update({ where: { id: allSpots.zh003.rooms[1].id }, data: { status: 'OCCUPIED' } }),
  ])

  console.log(`✅ Created ${placements.length} placements`)

  // Create compatibility assessments between roommates
  const assessments = await Promise.all([
    // ZH-001 roommates
    prisma.compatibilityAssessment.create({
      data: {
        residentId: residents[0].id,
        comparedWithId: residents[1].id,
        overallScore: 72,
        lifestyleScore: 65,
        socialScore: 78,
        practicalScore: 82,
        riskScore: 25,
        strengths: ['Gemeinsame Sprache (Arabisch)', 'Ähnliche Ernährung (Halal)'],
        concerns: ['Unterschiedliche Schlafzeiten', 'Einer raucht (draussen)'],
        recommendations: ['Klare Absprachen zu Ruhezeiten', 'Getrennte Zimmer wenn möglich'],
      },
    }),
    // ZH-002 roommates
    prisma.compatibilityAssessment.create({
      data: {
        residentId: residents[2].id,
        comparedWithId: residents[3].id,
        overallScore: 68,
        lifestyleScore: 72,
        socialScore: 55,
        practicalScore: 75,
        riskScore: 30,
        strengths: ['Beide nichtraucher', 'Ähnliche Sauberkeitsstandards'],
        concerns: ['Keine gemeinsame Sprache', 'Unterschiedliche Sozialbedürfnisse'],
        recommendations: ['Bildmaterial für Hausregeln', 'Respekt für Privatsphäre'],
      },
    }),
    prisma.compatibilityAssessment.create({
      data: {
        residentId: residents[2].id,
        comparedWithId: residents[5].id,
        overallScore: 70,
        lifestyleScore: 65,
        socialScore: 75,
        practicalScore: 72,
        riskScore: 28,
        strengths: ['Beide frühaufsteher', 'Hohe Sauberkeitsstandards'],
        concerns: ['Grosse Altersdifferenz', 'Medizinische Geräte'],
        recommendations: ['Rücksicht auf CPAP-Gerät', 'Klare Badezimmerzeiten'],
      },
    }),
    prisma.compatibilityAssessment.create({
      data: {
        residentId: residents[3].id,
        comparedWithId: residents[5].id,
        overallScore: 65,
        lifestyleScore: 60,
        socialScore: 68,
        practicalScore: 70,
        riskScore: 32,
        strengths: ['Beide ruhig', 'Respektvoller Umgang'],
        concerns: ['Altersdifferenz', 'Unterschiedliche Tagesrhythmen'],
        recommendations: ['Regelmässige Check-ins'],
      },
    }),
    // ZH-003 roommates
    prisma.compatibilityAssessment.create({
      data: {
        residentId: residents[4].id,
        comparedWithId: residents[6].id,
        overallScore: 85,
        lifestyleScore: 88,
        socialScore: 80,
        practicalScore: 90,
        riskScore: 10,
        strengths: ['Ähnliche Tagesrhythmen', 'Beide moderat sozial', 'Gemeinsame Sprache (Englisch)'],
        concerns: [],
        recommendations: ['Regelmässiger Austausch fördern'],
      },
    }),
  ])

  console.log(`✅ Created ${assessments.length} compatibility assessments`)

  // Create incidents
  const incidents = await Promise.all([
    // ZH-001: Noise complaint (interpersonal) - RES-001 reports, RES-002 is subject
    prisma.incident.create({
      data: {
        housingUnitId: units[0].id,
        placementId: placements[0].id,
        reportedById: residents[0].id,
        subjectId: residents[1].id,
        date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        category: 'INTERPERSONAL',
        type: 'NOISE_COMPLAINT',
        severity: 'MEDIUM',
        description: 'RES-001 beschwert sich über laute Musik nach 23 Uhr von RES-002',
        resolution: 'Gespräch geführt, Kopfhörer-Regelung vereinbart',
        resolvedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        predictable: true,
        compatibilityGap: 'lifestyle',
      },
    }),
    // ZH-001: Another tension - RES-002 is subject
    prisma.incident.create({
      data: {
        housingUnitId: units[0].id,
        placementId: placements[1].id,
        subjectId: residents[1].id,
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        category: 'INTERPERSONAL',
        type: 'SCHEDULE_CONFLICT',
        severity: 'LOW',
        description: 'Diskussion über Badezimmernutzung am Morgen',
        resolution: null,
        resolvedAt: null,
        predictable: true,
        compatibilityGap: 'lifestyle',
      },
    }),
    // ZH-002: Maintenance issue
    prisma.incident.create({
      data: {
        housingUnitId: units[1].id,
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        category: 'MAINTENANCE',
        type: 'PLUMBING',
        severity: 'MEDIUM',
        description: 'Wasserhahn in der Küche tropft',
        resolution: null,
        resolvedAt: null,
      },
    }),
    // ZH-002: Heater issue
    prisma.incident.create({
      data: {
        housingUnitId: units[1].id,
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        category: 'MAINTENANCE',
        type: 'HEATING_COOLING',
        severity: 'HIGH',
        description: 'Heizung im Zimmer von RES-006 funktioniert nicht richtig',
        resolution: null,
        resolvedAt: null,
      },
    }),
    // ZH-003: Resolved maintenance
    prisma.incident.create({
      data: {
        housingUnitId: units[2].id,
        date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        category: 'MAINTENANCE',
        type: 'ELECTRICAL',
        severity: 'LOW',
        description: 'Lampe im Flur defekt',
        resolution: 'Leuchtmittel ersetzt',
        resolvedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      },
    }),
    // ZH-004: Historical incident (before any placements)
    prisma.incident.create({
      data: {
        housingUnitId: units[3].id,
        date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        category: 'MAINTENANCE',
        type: 'APPLIANCE',
        severity: 'MEDIUM',
        description: 'Kühlschrank macht laute Geräusche',
        resolution: 'Neuer Kühlschrank installiert',
        resolvedAt: new Date(now.getTime() - 55 * 24 * 60 * 60 * 1000),
      },
    }),
  ])

  console.log(`✅ Created ${incidents.length} incidents`)

  // Update unit statuses based on occupancy
  await prisma.housingUnit.update({
    where: { id: units[0].id },
    data: { status: 'AVAILABLE' }, // 2/4 beds
  })
  await prisma.housingUnit.update({
    where: { id: units[1].id },
    data: { status: 'AVAILABLE' }, // 3/6 beds
  })
  await prisma.housingUnit.update({
    where: { id: units[2].id },
    data: { status: 'AVAILABLE' }, // 2/3 beds
  })

  console.log('✅ Database seeded successfully!')
  console.log('')
  console.log('📊 Summary:')
  console.log(`   - ${units.length} housing units`)
  console.log(`   - ${residents.length} residents (${residents.filter(r => r.status === 'PLACED').length} placed, ${residents.filter(r => r.status === 'ACTIVE').length} waiting)`)
  console.log(`   - ${placements.length} active placements`)
  console.log(`   - ${assessments.length} compatibility assessments`)
  console.log(`   - ${incidents.length} incidents`)
  console.log('')
  console.log('🚀 Ready to run: npm run dev')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
