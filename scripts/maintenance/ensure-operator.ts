/**
 * Link the house operator's resident login to a staff identity that can work
 * all three care seats (Wohnen, Sozialarbeit, Jobcoach).
 *
 * One human, one Account, two identities — the existing auth model. Leitung
 * (ADMIN) is the staff role that may write every domain; specialists stay
 * one-seat. Empty care seats on active residents are filled with this person.
 *
 * Usage (from repo root, against the live DB env):
 *   OPERATOR_RESIDENT_NAME=Georgy npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/maintenance/ensure-operator.ts
 */

import { PrismaClient } from '@prisma/client'
import { generateStaffCode } from '../../src/lib/auth/code-generation'
import { CARE_ROLES } from '../../src/lib/config/care'

const prisma = new PrismaClient()
const RESIDENT_NAME = process.env.OPERATOR_RESIDENT_NAME || 'Georgy'

async function uniqueStaffCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateStaffCode()
    if (!(await prisma.user.findUnique({ where: { code }, select: { id: true } }))) {
      return code
    }
  }
  throw new Error('could not generate a unique staff code')
}

async function main() {
  const resident = await prisma.resident.findFirst({
    where: { displayName: RESIDENT_NAME, status: { in: ['ACTIVE', 'PLACED'] } },
    include: { account: true },
    orderBy: { createdAt: 'asc' },
  })
  if (!resident) {
    throw new Error(`No active resident named ${RESIDENT_NAME}`)
  }

  let staffId = resident.account?.userId ?? null
  let staffCode: string | null = null
  let createdStaff = false

  if (staffId) {
    const existing = await prisma.user.findUnique({
      where: { id: staffId },
      select: { id: true, code: true, role: true, active: true },
    })
    if (!existing?.active) {
      throw new Error('Linked staff identity is missing or inactive')
    }
    staffCode = existing.code
    if (existing.role !== 'ADMIN') {
      await prisma.user.update({ where: { id: existing.id }, data: { role: 'ADMIN' } })
    }
  } else {
    const named = await prisma.user.findFirst({
      where: { name: resident.displayName || RESIDENT_NAME, active: true },
      select: { id: true, code: true, account: { select: { id: true } } },
    })
    if (named && !named.account) {
      staffId = named.id
      staffCode = named.code
      await prisma.user.update({ where: { id: named.id }, data: { role: 'ADMIN' } })
    } else {
      const code = await uniqueStaffCode()
      const created = await prisma.user.create({
        data: {
          code,
          name: resident.displayName || RESIDENT_NAME,
          role: 'ADMIN',
          active: true,
        },
      })
      staffId = created.id
      staffCode = created.code
      createdStaff = true
    }

    if (resident.account) {
      await prisma.account.update({
        where: { id: resident.account.id },
        data: { userId: staffId },
      })
    }
  }

  const residents = await prisma.resident.findMany({
    where: { status: { in: ['ACTIVE', 'PLACED'] } },
    select: { id: true, displayName: true },
  })

  let seatsFilled = 0
  for (const person of residents) {
    for (const role of CARE_ROLES) {
      const existing = await prisma.careAssignment.findUnique({
        where: { residentId_role: { residentId: person.id, role } },
        select: { id: true },
      })
      if (existing) continue
      await prisma.careAssignment.create({
        data: { residentId: person.id, staffId: staffId!, role },
      })
      seatsFilled += 1
    }
  }

  console.log(`Resident ${resident.displayName} (${resident.code})`)
  console.log(`Staff ${staffCode} — Leitung, all three care domains`)
  if (createdStaff) {
    console.log('New staff code created. Register it with the SAME email as the resident account.')
  } else if (resident.account?.userId || resident.account) {
    console.log('Staff identity is on the same login as the resident. Sign in once, switch in the nav.')
  } else {
    console.log('No resident Account yet. Register the resident code, then this staff code, with one email.')
  }
  console.log(`Empty care seats filled: ${seatsFilled}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
