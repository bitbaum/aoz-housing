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
import { upsertDemoStaff } from './staff'
import { wipeAllExceptKeepList } from './wipe'

export interface DemoResetSummary extends DemoSeedSummary {
  tablesWiped: number
  demoStaffCode: string | null
  orgRulesSynced: boolean
}

export async function resetDemoData(prisma: PrismaClient): Promise<DemoResetSummary> {
  const tablesWiped = await wipeAllExceptKeepList(prisma)

  // BEFORE the seed, not after: the seed hands this account the care seats on
  // every demo resident, and an assignment cannot point at a row that does not
  // exist yet. (The wipe keeps User, so this is an update on a repeat run.)
  const demoStaff = await upsertDemoStaff(prisma)

  const seeded = await seedDemoData(prisma, { careStaffId: demoStaff?.id ?? null })

  await syncOrgRules(prisma)

  return {
    ...seeded,
    tablesWiped,
    demoStaffCode: demoStaff?.code ?? null,
    orgRulesSynced: true,
  }
}
