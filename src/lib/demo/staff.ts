/**
 * The demo staff account — shared by both reset scopes.
 *
 * Self-heals on every reset: a visitor renaming or breaking the account is
 * undone by the next run. Returns the code, or null when this deployment
 * offers no staff door.
 *
 * Relative-import-safe (no '@/' aliases): loaded through ts-node.
 */

import type { PrismaClient } from '@prisma/client'
import { getDemoStaffCode, DEMO_STAFF_NAME } from './config'
import { demoStaffDoors } from './roles'

export interface DemoStaffAccount {
  id: string
  code: string
}

/**
 * One demo account per staff role, so a visitor can see the product as each of
 * them without an account.
 *
 * This is the whole point of the exercise: the app a Jobcoach uses and the app
 * Leitung uses are not the same app — different nav, different boards,
 * different permissions — and a demo with one staff door shows a fifth of the
 * product while implying it is all of it.
 *
 * Every account is upserted `active: true` and stripped of any claimed
 * credentials, exactly like the Leitung one: registration is open on any
 * unclaimed code, so a drive-by visitor could otherwise attach their own email
 * and password to a demo door and lock out everyone after them.
 */
export async function upsertDemoStaffRoles(prisma: PrismaClient): Promise<DemoStaffAccount[]> {
  const accounts: DemoStaffAccount[] = []

  for (const door of demoStaffDoors()) {
    const user = await prisma.user.upsert({
      where: { code: door.code },
      update: { name: door.name, role: door.role, active: true },
      create: { code: door.code, name: door.name, role: door.role },
      select: { id: true },
    })

    await prisma.account.deleteMany({ where: { userId: user.id } })
    accounts.push({ id: user.id, code: door.code })
  }

  return accounts
}

/**
 * Returns the id as well as the code: the care seats on every demo resident
 * point at this account, and they are what makes the boards' default
 * "Meine Klient*innen" view show anything for a non-Leitung role.
 */
export async function upsertDemoStaff(prisma: PrismaClient): Promise<DemoStaffAccount | null> {
  const demoStaffCode = getDemoStaffCode()
  if (!demoStaffCode) return null

  const user = await prisma.user.upsert({
    where: { code: demoStaffCode },
    update: { name: DEMO_STAFF_NAME, active: true },
    create: { code: demoStaffCode, name: DEMO_STAFF_NAME, role: 'ADMIN' },
    select: { id: true },
  })

  // Also drop any account claimed on the demo code: a drive-by visitor may
  // have registered their own email + password on it (registration is open on
  // any unclaimed code). Without this, that claim would outlive every reset
  // and lock the next visitor out of the demo door.
  await prisma.account.deleteMany({ where: { userId: user.id } })

  return { id: user.id, code: demoStaffCode }
}
