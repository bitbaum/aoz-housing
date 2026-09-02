/**
 * Test troublemaker detection by creating multiple incidents about Carlos
 */

import { eq, or } from 'drizzle-orm'
import { db, resident, housingUnit, incident as incidentTable } from '../src/lib/db'

async function main() {
  console.log('🔍 Testing troublemaker detection workflow...\n')

  // Find Carlos (WIT-005) - the party person
  const carlos = await db.query.resident.findFirst({
    where: eq(resident.code, 'WIT-005'),
  })

  if (!carlos) {
    console.log('❌ Carlos not found')
    return
  }

  // Find the housing unit
  const unit = await db.query.housingUnit.findFirst({
    where: eq(housingUnit.code, 'ZH-1-440'),
  })

  if (!unit) {
    console.log('❌ Housing unit not found')
    return
  }

  // Find other residents to report incidents
  const ahmed = await db.query.resident.findFirst({ where: eq(resident.code, 'WIT-001') })
  const john = await db.query.resident.findFirst({ where: eq(resident.code, 'WIT-007') })
  const yuki = await db.query.resident.findFirst({ where: eq(resident.code, 'WIT-008') })

  console.log('📊 Creating multiple incidents about Carlos to trigger warning...\n')

  // Incident 2: Cleanliness issue
  await db.insert(incidentTable).values({
    housingUnitId: unit.id,
    reportedById: john!.id,
    subjectId: carlos.id,
    category: 'INTERPERSONAL',
    type: 'CLEANLINESS_DISPUTE',
    severity: 'MEDIUM',
    description: 'Carlos left dirty dishes in the kitchen for 3 days',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  })
  console.log('✅ Incident 2: CLEANLINESS_DISPUTE')
  console.log(`   Reported by: ${john!.code}`)
  console.log(`   Subject: ${carlos.code}`)

  // Incident 3: Another noise complaint
  await db.insert(incidentTable).values({
    housingUnitId: unit.id,
    reportedById: yuki!.id,
    subjectId: carlos.id,
    category: 'INTERPERSONAL',
    type: 'NOISE_COMPLAINT',
    severity: 'HIGH',
    description: 'Carlos had a party with friends, very loud until 4 AM',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  })
  console.log('✅ Incident 3: NOISE_COMPLAINT')
  console.log(`   Reported by: ${yuki!.code}`)
  console.log(`   Subject: ${carlos.code}`)

  // Get stats for Carlos
  const stats = await db.query.incident.findMany({
    where: or(eq(incidentTable.reportedById, carlos.id), eq(incidentTable.subjectId, carlos.id)),
    with: {
      reportedBy: { columns: { code: true } },
      subject: { columns: { code: true } },
    },
  })

  console.log(`\n📈 Carlos (${carlos.code}) incident statistics:`)
  console.log(`   Reported by him: ${stats.filter((i) => i.reportedById === carlos.id).length}`)
  console.log(`   About him: ${stats.filter((i) => i.subjectId === carlos.id).length}`)
  console.log(`   Total incidents: ${stats.length}`)

  console.log(`\n⚠️  Carlos should now show a WARNING in the UI (3+ incidents as subject)`)

  // Check housing unit frequent subjects
  const allIncidents = await db.query.incident.findMany({
    where: eq(incidentTable.housingUnitId, unit.id),
    with: {
      subject: { columns: { code: true } },
    },
  })

  const subjectCounts: Record<string, number> = {}
  for (const incident of allIncidents) {
    if (incident.subject) {
      const code = incident.subject.code
      subjectCounts[code] = (subjectCounts[code] || 0) + 1
    }
  }

  console.log(`\n🏠 Housing unit ${unit.code} - Frequent subjects:`)
  Object.entries(subjectCounts)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .forEach(([code, count]) => {
      console.log(`   ${code}: ${count} incidents ${count >= 3 ? '⚠️  WARNING' : ''}`)
    })

  console.log(`\n✅ Troublemaker detection test complete!`)
  console.log(`\n📌 Next steps:`)
  console.log(`   1. Visit /residents/WIT-005 - should see warning banner`)
  console.log(`   2. Visit /housing/${unit.id} - should see Carlos in frequent subjects`)
  console.log(`   3. Visit /incidents - should see all 3 incidents`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
