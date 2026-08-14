/**
 * The scoped demo reset — the demo world living ALONGSIDE real data.
 *
 * This is the "try it without an account" door into the real product: the
 * demo visitor gets the full AOZ presentation narrative (5 units, 15
 * residents, incidents, expenses — seed-data.ts), inside units and residents
 * whose codes carry the demo prefixes. The portal's unit scoping is the
 * isolation boundary; nothing here can see or touch a real apartment.
 *
 * Deletion targets PREFIXES, never tables: every unit whose code starts with
 * DEMO_UNIT_CODE_PREFIX and every resident on DEMO_RESIDENT_CODE_PREFIX (or
 * the configured login code). Restrict FKs go first (Incident and Placement
 * both restrict on HousingUnit); the unit delete then cascades spots,
 * expenses (+shares), settlements, tasks, rules, proposals and maintenance.
 * It can never truncate anything.
 *
 * Relative-import-safe (no '@/' aliases): loaded through ts-node.
 */

import type { PrismaClient } from '@prisma/client'
import {
  resolveDemoResidentCode,
  DEMO_RESIDENT_CODE_PREFIX,
  DEMO_UNIT_CODE_PREFIX,
} from './config'
import { seedDemoData, type DemoSeedSummary } from './seed-data'
import { upsertDemoStaff } from './staff'
import { syncOrgRules } from '../governance/sync-org-rules'

export interface DemoWorldResetSummary extends DemoSeedSummary {
  unitsDeleted: number
  residentsDeleted: number
  demoStaffCode: string | null
}

/** Delete every demo unit and demo resident. No-op when absent. */
export async function deleteDemoWorld(prisma: PrismaClient): Promise<{
  unitsDeleted: number
  residentsDeleted: number
}> {
  const demoUnitFilter = { code: { startsWith: DEMO_UNIT_CODE_PREFIX } }

  await prisma.incident.deleteMany({ where: { housingUnit: demoUnitFilter } })
  await prisma.placement.deleteMany({ where: { housingUnit: demoUnitFilter } })
  const units = await prisma.housingUnit.deleteMany({ where: demoUnitFilter })

  const residents = await prisma.resident.deleteMany({
    where: {
      OR: [
        { code: { startsWith: DEMO_RESIDENT_CODE_PREFIX } },
        { code: resolveDemoResidentCode() },
      ],
    },
  })

  return { unitsDeleted: units.count, residentsDeleted: residents.count }
}

/** Tear down and reseed the demo world; self-heal the demo staff account. */
export async function resetDemoWorld(prisma: PrismaClient): Promise<DemoWorldResetSummary> {
  const removed = await deleteDemoWorld(prisma)
  // The AOZ catalog is reference data, not demo data — it is never deleted
  // above. But the demo's adopted house rule points at an ORG rule by key, so
  // the catalog has to be present before seeding, not merely usually present.
  await syncOrgRules(prisma)
  const seeded = await seedDemoData(prisma)
  const demoStaffCode = await upsertDemoStaff(prisma)

  return { ...seeded, ...removed, demoStaffCode }
}
