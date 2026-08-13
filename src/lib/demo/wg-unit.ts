/**
 * The demo apartment — a fictional shared flat living ALONGSIDE real data.
 *
 * This is the "try it without an account" door into the real product: the
 * demo resident logs into the same portal, same features, same UI as a real
 * flatmate — just inside a dedicated unit. The portal's unit scoping is the
 * isolation boundary; nothing here can see or touch a real apartment.
 *
 * The reset tears down ONLY this unit and its fictional residents, in
 * explicit FK order (Incident and Placement have Restrict FKs on the unit;
 * everything else cascades). It can never truncate anything.
 *
 * Relative-import-safe (no '@/' aliases): loaded through ts-node.
 */

import type { PrismaClient } from '@prisma/client'
import {
  resolveDemoResidentCode,
  DEMO_WG_RESIDENT_CODE_PREFIX,
  getDemoStaffCode,
  DEMO_STAFF_NAME,
} from './config'

export const DEMO_WG_UNIT_CODE = 'DEMO-WG'

export interface DemoWgResetSummary {
  unitDeleted: boolean
  residentsDeleted: number
  demoResidentCode: string
  demoStaffCode: string | null
}

/** Delete the demo unit + its fictional residents. No-op when absent. */
export async function deleteDemoWgUnit(prisma: PrismaClient): Promise<{
  unitDeleted: boolean
  residentsDeleted: number
}> {
  const unit = await prisma.housingUnit.findUnique({
    where: { code: DEMO_WG_UNIT_CODE },
    select: { id: true },
  })

  if (unit) {
    // Restrict FKs first; the unit delete then cascades spots, expenses
    // (+shares), settlements, tasks, rules, proposals and maintenance.
    await prisma.incident.deleteMany({ where: { housingUnitId: unit.id } })
    await prisma.placement.deleteMany({ where: { housingUnitId: unit.id } })
    await prisma.housingUnit.delete({ where: { id: unit.id } })
  }

  const loginCode = resolveDemoResidentCode()
  const deleted = await prisma.resident.deleteMany({
    where: {
      OR: [{ code: { startsWith: DEMO_WG_RESIDENT_CODE_PREFIX } }, { code: loginCode }],
    },
  })

  return { unitDeleted: Boolean(unit), residentsDeleted: deleted.count }
}

/** Recreate the demo flat from scratch: 3 flatmates, expenses, a settlement. */
export async function seedDemoWgUnit(prisma: PrismaClient): Promise<DemoWgResetSummary> {
  const removed = await deleteDemoWgUnit(prisma)

  const unit = await prisma.housingUnit.create({
    data: {
      code: DEMO_WG_UNIT_CODE,
      address: 'Beispielstrasse 10, 8000 Zürich',
      nickname: 'WG Tokio',
      totalBeds: 3,
      totalRooms: 2,
      sharedRooms: 1,
      privateRooms: 1,
      sharedBathrooms: 1,
      privateBathrooms: 0,
      sharedKitchen: true,
      privateKitchen: false,
      quietHours: '22:00-07:00',
      status: 'FULL',
      notes: 'Demo-Wohnung — wird täglich zurückgesetzt.',
    },
  })

  const FLATMATES = [
    {
      code: resolveDemoResidentCode(),
      displayName: 'Lena',
      bio: 'Ich bin die Demo-Bewohnerin — schau dich ruhig um und probier alles aus.',
      room: 'R1',
    },
    {
      code: `${DEMO_WG_RESIDENT_CODE_PREFIX}2`,
      displayName: 'Sami',
      bio: 'Kocht am liebsten für alle. Frühaufsteher.',
      room: 'R2',
    },
    {
      code: `${DEMO_WG_RESIDENT_CODE_PREFIX}3`,
      displayName: 'Noah',
      bio: 'Nachteule, hört Musik nur mit Kopfhörern.',
      room: 'R2',
    },
  ]

  const bedsByRoom = new Map<string, string[]>()
  for (const room of [
    { code: 'R1', label: 'Zimmer 1', beds: 1 },
    { code: 'R2', label: 'Zimmer 2', beds: 2 },
  ]) {
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
          status: 'OCCUPIED',
        },
      })
      bedIds.push(bed.id)
    }
    bedsByRoom.set(room.code, bedIds)
  }

  const residentIds: string[] = []
  for (const person of FLATMATES) {
    const resident = await prisma.resident.create({
      data: {
        code: person.code,
        displayName: person.displayName,
        bio: person.bio,
        ageRange: 'ADULT',
        gender: 'PREFER_NOT_SAY',
        familyStatus: 'SINGLE',
        sleepSchedule: 'STANDARD',
        noiseTolerance: 3,
        cleanlinessPractice: 3,
        socialStyle: 'MODERATE',
        languages: ['de'],
        smokingStatus: 'NON_SMOKER',
        mobilityNeeds: 'NONE',
        privacyNeed: 3,
        status: 'PLACED',
      },
    })
    residentIds.push(resident.id)

    const bedId = bedsByRoom.get(person.room)!.shift()!
    await prisma.placement.create({
      data: {
        residentId: resident.id,
        housingUnitId: unit.id,
        spotId: bedId,
        startDate: new Date(),
        status: 'ACTIVE',
      },
    })
  }

  // A small, real-looking ledger: balances, a suggested transfer, a payment.
  const [lena, sami, noah] = residentIds
  await prisma.expense.create({
    data: {
      housingUnitId: unit.id,
      paidById: sami,
      createdById: sami,
      description: 'Wocheneinkauf',
      category: 'GROCERIES',
      amountRappen: 5400,
      date: new Date(),
      shares: {
        create: residentIds.map((residentId) => ({ residentId, amountRappen: 1800 })),
      },
    },
  })
  await prisma.expense.create({
    data: {
      housingUnitId: unit.id,
      paidById: lena,
      createdById: lena,
      description: 'Putzmittel',
      category: 'HOUSEHOLD',
      // Split between two on purpose: shows that not everyone has to pay.
      amountRappen: 1200,
      date: new Date(),
      shares: {
        create: [
          { residentId: lena, amountRappen: 600 },
          { residentId: sami, amountRappen: 600 },
        ],
      },
    },
  })
  await prisma.settlement.create({
    data: {
      housingUnitId: unit.id,
      fromId: noah,
      toId: sami,
      amountRappen: 1800,
      note: 'Anteil Wocheneinkauf',
    },
  })

  // Self-heal the demo staff account (when this deployment offers a staff
  // door): a visitor renaming or breaking it is undone by the next reset.
  const demoStaffCode = getDemoStaffCode()
  if (demoStaffCode) {
    await prisma.user.upsert({
      where: { code: demoStaffCode },
      update: { name: DEMO_STAFF_NAME, active: true },
      create: { code: demoStaffCode, name: DEMO_STAFF_NAME, role: 'ADMIN' },
    })
  }

  return {
    unitDeleted: removed.unitDeleted,
    residentsDeleted: removed.residentsDeleted,
    demoResidentCode: resolveDemoResidentCode(),
    demoStaffCode,
  }
}
