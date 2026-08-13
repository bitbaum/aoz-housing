/**
 * Seed a REAL apartment (no demo data) from prisma/real/*.ts config.
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-real.ts [--wipe]
 *
 * --wipe first truncates every table except User/AlgorithmWeight/SystemConfig
 * (same keep-list as the demo reset) — use it exactly once, when converting a
 * demo instance into the real one.
 *
 * Idempotent without --wipe: if the unit already has active placements the
 * script refuses to run, so a re-run can never duplicate people.
 *
 * Login codes are GENERATED here and printed once — hand them out and store
 * them; they are intentionally not committed anywhere.
 */

import { PrismaClient } from '@prisma/client'
import { REAL_APARTMENT } from './real/witikonerstrasse-458'
import { generateResidentCode } from '../src/lib/auth/code-generation'
import { wipeAllExceptKeepList } from '../src/lib/demo/wipe'
import { syncOrgRules } from '../src/lib/governance/sync-org-rules'

const prisma = new PrismaClient()

async function uniqueResidentCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateResidentCode()
    if (!(await prisma.resident.findUnique({ where: { code }, select: { id: true } }))) {
      return code
    }
  }
  throw new Error('could not generate a unique resident code')
}

async function main() {
  const wipe = process.argv.includes('--wipe')
  if (wipe) {
    const wiped = await wipeAllExceptKeepList(prisma)
    console.log(`🧹 Wiped ${wiped} tables (keep-list preserved)`)
  }

  const existing = await prisma.housingUnit.findUnique({
    where: { code: REAL_APARTMENT.unit.code },
    select: { id: true, placements: { where: { status: 'ACTIVE' }, select: { id: true } } },
  })
  if (existing && existing.placements.length > 0) {
    console.error(
      `✋ ${REAL_APARTMENT.unit.code} already has ${existing.placements.length} active placements — refusing to seed twice.`
    )
    process.exit(1)
  }

  const unit = await prisma.housingUnit.create({
    data: { ...REAL_APARTMENT.unit, status: 'FULL' },
  })

  // Rooms with their beds (the spot hierarchy the rest of the app expects).
  const bedsByRoom = new Map<string, string[]>()
  for (const room of REAL_APARTMENT.rooms) {
    const roomSpot = await prisma.placementSpot.create({
      data: {
        housingUnitId: unit.id,
        code: room.code,
        label: room.label,
        type: 'ROOM',
        capacity: room.beds,
        status: 'OCCUPIED',
      },
    })
    const bedIds: string[] = []
    for (let i = 1; i <= room.beds; i++) {
      const bed = await prisma.placementSpot.create({
        data: {
          housingUnitId: unit.id,
          code: `${room.code}-B${i}`,
          type: 'BED',
          parentSpotId: roomSpot.id,
          capacity: 1,
          status: 'AVAILABLE',
        },
      })
      bedIds.push(bed.id)
    }
    bedsByRoom.set(room.code, bedIds)
  }

  const startDate = new Date()
  const credentials: Array<{ name: string; code: string; room: string }> = []

  for (const person of REAL_APARTMENT.residents) {
    const bedIds = bedsByRoom.get(person.room)
    if (!bedIds || bedIds.length === 0) {
      throw new Error(`no free bed left in ${person.room} for ${person.displayName}`)
    }
    const bedId = bedIds.shift()!

    const code = await uniqueResidentCode()
    const resident = await prisma.resident.create({
      data: {
        code,
        displayName: person.displayName,
        // Neutral defaults — everyone refines their own preferences in the
        // portal. Nothing here is a statement about the person.
        ageRange: 'ADULT',
        gender: 'PREFER_NOT_SAY',
        familyStatus: 'SINGLE',
        sleepSchedule: 'STANDARD',
        noiseTolerance: 3,
        cleanlinessPractice: 3,
        socialStyle: 'MODERATE',
        languages: [],
        smokingStatus: 'NON_SMOKER',
        mobilityNeeds: 'NONE',
        privacyNeed: 3,
        status: 'PLACED',
      },
    })

    await prisma.placement.create({
      data: {
        residentId: resident.id,
        housingUnitId: unit.id,
        spotId: bedId,
        startDate,
        status: 'ACTIVE',
      },
    })
    await prisma.placementSpot.update({ where: { id: bedId }, data: { status: 'OCCUPIED' } })

    credentials.push({ name: person.displayName, code, room: person.room })
  }

  await syncOrgRules(prisma)

  console.log(`\n🏠 Seeded ${REAL_APARTMENT.unit.code} (${REAL_APARTMENT.unit.address})`)
  console.log('\nLogin codes — hand these out, they are shown ONCE:\n')
  for (const c of credentials) {
    console.log(`  ${c.name.padEnd(10)} ${c.room}  →  ${c.code}`)
  }
  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
