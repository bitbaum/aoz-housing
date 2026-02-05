/**
 * Test troublemaker detection by creating multiple incidents about Carlos
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Testing troublemaker detection workflow...\n')

  // Find Carlos (WIT-005) - the party person
  const carlos = await prisma.resident.findUnique({
    where: { code: 'WIT-005' },
  })

  if (!carlos) {
    console.log('❌ Carlos not found')
    return
  }

  // Find the housing unit
  const unit = await prisma.housingUnit.findUnique({
    where: { code: 'ZH-1-440' },
  })

  if (!unit) {
    console.log('❌ Housing unit not found')
    return
  }

  // Find other residents to report incidents
  const ahmed = await prisma.resident.findUnique({ where: { code: 'WIT-001' } })
  const john = await prisma.resident.findUnique({ where: { code: 'WIT-007' } })
  const yuki = await prisma.resident.findUnique({ where: { code: 'WIT-008' } })

  console.log('📊 Creating multiple incidents about Carlos to trigger warning...\n')

  // Incident 2: Cleanliness issue
  const incident2 = await prisma.incident.create({
    data: {
      housingUnitId: unit.id,
      reportedById: john!.id,
      subjectId: carlos.id,
      category: 'INTERPERSONAL',
      type: 'CLEANLINESS_DISPUTE',
      severity: 'MEDIUM',
      description: 'Carlos left dirty dishes in the kitchen for 3 days',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  })
  console.log('✅ Incident 2: CLEANLINESS_DISPUTE')
  console.log(`   Reported by: ${john!.code}`)
  console.log(`   Subject: ${carlos.code}`)

  // Incident 3: Another noise complaint
  const incident3 = await prisma.incident.create({
    data: {
      housingUnitId: unit.id,
      reportedById: yuki!.id,
      subjectId: carlos.id,
      category: 'INTERPERSONAL',
      type: 'NOISE_COMPLAINT',
      severity: 'HIGH',
      description: 'Carlos had a party with friends, very loud until 4 AM',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  })
  console.log('✅ Incident 3: NOISE_COMPLAINT')
  console.log(`   Reported by: ${yuki!.code}`)
  console.log(`   Subject: ${carlos.code}`)

  // Get stats for Carlos
  const stats = await prisma.incident.findMany({
    where: {
      OR: [
        { reportedById: carlos.id },
        { subjectId: carlos.id },
      ],
    },
    include: {
      reportedBy: { select: { code: true } },
      subject: { select: { code: true } },
    },
  })

  console.log(`\n📈 Carlos (${carlos.code}) incident statistics:`)
  console.log(`   Reported by him: ${stats.filter(i => i.reportedById === carlos.id).length}`)
  console.log(`   About him: ${stats.filter(i => i.subjectId === carlos.id).length}`)
  console.log(`   Total incidents: ${stats.length}`)

  console.log(`\n⚠️  Carlos should now show a WARNING in the UI (3+ incidents as subject)`)

  // Check housing unit frequent subjects
  const allIncidents = await prisma.incident.findMany({
    where: { housingUnitId: unit.id },
    include: {
      subject: { select: { code: true } },
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
  .finally(async () => {
    await prisma.$disconnect()
  })
