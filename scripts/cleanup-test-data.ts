/**
 * Clean up existing test data before running workflow test
 */

import { eq, like } from 'drizzle-orm'
import { db, resident, housingUnit, placement, incident, placementSpot } from '../src/lib/db'

async function main() {
  console.log('🧹 Cleaning up existing test data...\n')

  // Delete residents with WIT codes
  const deletedResidents = await db
    .delete(resident)
    .where(like(resident.code, 'WIT-%'))
    .returning({ id: resident.id })
  console.log(`✅ Deleted ${deletedResidents.length} residents with WIT- codes`)

  // Find housing unit to delete related data
  const unit = await db.query.housingUnit.findFirst({
    where: eq(housingUnit.code, 'ZH-1-440'),
  })

  if (unit) {
    // Delete placements first
    const deletedPlacements = await db
      .delete(placement)
      .where(eq(placement.housingUnitId, unit.id))
      .returning({ id: placement.id })
    console.log(`✅ Deleted ${deletedPlacements.length} placements`)

    // Delete incidents
    const deletedIncidents = await db
      .delete(incident)
      .where(eq(incident.housingUnitId, unit.id))
      .returning({ id: incident.id })
    console.log(`✅ Deleted ${deletedIncidents.length} incidents`)

    // Delete spots
    const deletedSpots = await db
      .delete(placementSpot)
      .where(eq(placementSpot.housingUnitId, unit.id))
      .returning({ id: placementSpot.id })
    console.log(`✅ Deleted ${deletedSpots.length} spots`)

    // Delete housing unit
    await db.delete(housingUnit).where(eq(housingUnit.id, unit.id))
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
  .finally(() => {
    process.exit(0)
  })
