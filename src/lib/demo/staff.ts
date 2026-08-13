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

export async function upsertDemoStaff(prisma: PrismaClient): Promise<string | null> {
  const demoStaffCode = getDemoStaffCode()
  if (!demoStaffCode) return null

  // Also strip account credentials: a drive-by visitor may have claimed the
  // demo account with their own email + password (registration is open on
  // any unclaimed code). Without this, that claim would outlive every reset.
  await prisma.user.upsert({
    where: { code: demoStaffCode },
    update: {
      name: DEMO_STAFF_NAME,
      active: true,
      email: null,
      passwordHash: null,
      emailVerifiedAt: null,
    },
    create: { code: demoStaffCode, name: DEMO_STAFF_NAME, role: 'ADMIN' },
  })
  return demoStaffCode
}
