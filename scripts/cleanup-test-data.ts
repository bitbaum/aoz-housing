/**
 * Clean up existing test data before running workflow test
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning up existing test data...\n')

  // Delete residents with WIT codes
  const deletedResidents = await prisma.resident.deleteMany({
    where: {
      code: {
        startsWith: 'WIT-',
      },
    },
  })
  console.log(`✅ Deleted ${deletedResidents.count} residents with WIT- codes`)

  // Find housing unit to delete related data
  const unit = await prisma.housingUnit.findUnique({
    where: { code: 'ZH-1-440' },
  })

  if (unit) {
    // Delete placements first
    const deletedPlacements = await prisma.placement.deleteMany({
      where: { housingUnitId: unit.id },
    })
    console.log(`✅ Deleted ${deletedPlacements.count} placements`)

    // Delete incidents
    const deletedIncidents = await prisma.incident.deleteMany({
      where: { housingUnitId: unit.id },
    })
    console.log(`✅ Deleted ${deletedIncidents.count} incidents`)

    // Delete spots
    const deletedSpots = await prisma.placementSpot.deleteMany({
      where: { housingUnitId: unit.id },
    })
    console.log(`✅ Deleted ${deletedSpots.count} spots`)

    // Delete housing unit
    await prisma.housingUnit.delete({
      where: { id: unit.id },
    })
    console.log(`✅ Deleted housing unit ZH-1-440`)
  } else {
    console.log('ℹ️  No housing unit ZH-1-440 found')
  }

  console.log('\n✨ Cleanup complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
