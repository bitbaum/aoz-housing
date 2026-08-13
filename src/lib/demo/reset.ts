/**
 * Demo reset — wipe drive-by edits, restore the pristine presentation state.
 *
 * Called daily by api/cron/reset-demo (systemd timer on the box) and by the
 * CLI seed (prisma/seed-demo.ts). Four steps:
 *
 *   1. Truncate every table EXCEPT the keep-list. Enumerating from pg_tables
 *      (rather than a hand-maintained deleteMany list) means a new model added
 *      to the schema is wiped automatically — the old seed's explicit list had
 *      already gone stale against the governance tables.
 *   2. Reseed the presentation narrative (seed-data.ts).
 *   3. Upsert the demo accounts, so a visitor who renamed or broke the demo
 *      staff user self-heals. Real staff accounts live in the kept User table
 *      and are never touched.
 *   4. Re-sync the AOZ rule catalog — the truncate wiped HouseRule, and the
 *      governance pages are inert without it. Idempotent by design.
 *
 * Relative-import-safe (no '@/' aliases): prisma/seed-demo.ts loads this
 * through ts-node, which does not resolve tsconfig path aliases.
 */

import type { PrismaClient } from '@prisma/client'
import { seedDemoData, type DemoSeedSummary } from './seed-data'
import { syncOrgRules } from '../governance/sync-org-rules'
import { getDemoStaffCode, DEMO_STAFF_NAME } from './config'
import { wipeAllExceptKeepList } from './wipe'

export interface DemoResetSummary extends DemoSeedSummary {
  tablesWiped: number
  demoStaffCode: string | null
  orgRulesSynced: boolean
}

export async function resetDemoData(prisma: PrismaClient): Promise<DemoResetSummary> {
  const tablesWiped = await wipeAllExceptKeepList(prisma)

  const seeded = await seedDemoData(prisma)

  const demoStaffCode = getDemoStaffCode()
  if (demoStaffCode) {
    await prisma.user.upsert({
      where: { code: demoStaffCode },
      update: { name: DEMO_STAFF_NAME, active: true },
      create: { code: demoStaffCode, name: DEMO_STAFF_NAME, role: 'ADMIN' },
    })
  }

  await syncOrgRules(prisma)

  return {
    ...seeded,
    tablesWiped,
    demoStaffCode,
    orgRulesSynced: true,
  }
}
