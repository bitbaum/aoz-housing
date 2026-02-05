import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find the housing unit WIT-440
  const housing = await prisma.housingUnit.findUnique({
    where: { code: 'WIT-440' },
    include: { spots: true }
  })

  if (!housing) {
    console.error('Housing unit WIT-440 not found')
    process.exit(1)
  }

  console.log('Found housing:', housing.code, housing.address)
  console.log('Spots:', housing.spots.map(s => `${s.code} (${s.type}, capacity: ${s.capacity})`))

  // Find the rooms and beds
  const rooms = housing.spots.filter(s => s.type === 'ROOM')
  const beds = housing.spots.filter(s => s.type === 'BED')

  console.log('\nRooms:', rooms.map(r => r.code))
  console.log('Beds:', beds.map(b => `${b.code} (parent: ${b.parentSpotId})`))

  // Find rooms by label
  const room3Person = rooms.find(r => r.label?.includes('3-Personen'))
  const room1Person = rooms.find(r => r.label?.includes('1-Personen'))
  const room2PersonA = rooms.find(r => r.label?.includes('2-Personen Zimmer A'))
  const room2PersonB = rooms.find(r => r.label?.includes('2-Personen Zimmer B'))

  console.log('\nRoom assignments:')
  console.log('3-person room:', room3Person?.code)
  console.log('1-person room:', room1Person?.code)
  console.log('2-person room A:', room2PersonA?.code)
  console.log('2-person room B:', room2PersonB?.code)

  // Get beds for each room
  const beds3Person = beds.filter(b => b.parentSpotId === room3Person?.id)
  const beds1Person = beds.filter(b => b.parentSpotId === room1Person?.id)
  const beds2PersonA = beds.filter(b => b.parentSpotId === room2PersonA?.id)
  const beds2PersonB = beds.filter(b => b.parentSpotId === room2PersonB?.id)

  console.log('\nBeds in 3-person room:', beds3Person.map(b => b.code))
  console.log('Beds in 1-person room:', beds1Person.map(b => b.code))
  console.log('Beds in 2-person room A:', beds2PersonA.map(b => b.code))
  console.log('Beds in 2-person room B:', beds2PersonB.map(b => b.code))

  // Default resident data
  const defaultData = {
    ageRange: 'ADULT' as const,
    gender: 'MALE' as const,
    familyStatus: 'SINGLE' as const,
    sleepSchedule: 'STANDARD' as const,
    noiseTolerance: 3,
    cleanlinessLevel: 3,
    socialStyle: 'MODERATE' as const,
    languages: ['DE'],
    smokingStatus: 'NON_SMOKER' as const,
    mobilityNeeds: 'NONE' as const,
    privacyNeed: 3,
    choresContribution: 3,
    recyclingKnowledge: 'BASIC' as const,
    roomSharingStatus: 'CAN_SHARE' as const,
    supportLevel: 'STANDARD' as const,
    status: 'ACTIVE' as const,
  }

  // Create 5 residents
  const residents = ['GB', 'SK', 'DK', 'DS', 'DH']
  const createdResidents: Record<string, any> = {}

  for (const code of residents) {
    // Check if resident already exists
    const existing = await prisma.resident.findUnique({ where: { code } })
    if (existing) {
      console.log(`Resident ${code} already exists, skipping creation`)
      createdResidents[code] = existing
      continue
    }

    const resident = await prisma.resident.create({
      data: {
        code,
        ...defaultData,
      }
    })
    console.log(`Created resident: ${code} (${resident.id})`)
    createdResidents[code] = resident
  }

  // Create placements:
  // - GB lives in a 2-person room (R3 - 2-Personen Zimmer A, alone)
  // - DH and DS live in the 3-person room (R1)
  // - DK and SK share a 2-person room (R4 - 2-Personen Zimmer B)

  const placements = [
    { resident: 'GB', bed: beds2PersonA[0] }, // GB in 2-person room A, bed 1
    { resident: 'DH', bed: beds3Person[0] },  // DH in 3-person room, bed 1
    { resident: 'DS', bed: beds3Person[1] },  // DS in 3-person room, bed 2
    { resident: 'DK', bed: beds2PersonB[0] }, // DK in 2-person room B, bed 1
    { resident: 'SK', bed: beds2PersonB[1] }, // SK in 2-person room B, bed 2
  ]

  for (const p of placements) {
    if (!p.bed) {
      console.error(`No bed found for ${p.resident}`)
      continue
    }

    const resident = createdResidents[p.resident]

    // Check if placement already exists
    const existingPlacement = await prisma.placement.findFirst({
      where: {
        residentId: resident.id,
        status: 'ACTIVE'
      }
    })

    if (existingPlacement) {
      console.log(`Placement for ${p.resident} already exists, skipping`)
      continue
    }

    const placement = await prisma.placement.create({
      data: {
        residentId: resident.id,
        housingUnitId: housing.id,
        spotId: p.bed.id,
        startDate: new Date(),
        status: 'ACTIVE',
      }
    })

    // Update spot status to OCCUPIED
    await prisma.placementSpot.update({
      where: { id: p.bed.id },
      data: { status: 'OCCUPIED' }
    })

    // Update resident status to PLACED
    await prisma.resident.update({
      where: { id: resident.id },
      data: { status: 'PLACED' }
    })

    console.log(`Created placement: ${p.resident} -> ${p.bed.code}`)
  }

  console.log('\nDone!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
