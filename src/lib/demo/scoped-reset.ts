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

import { eq, inArray, like, or } from 'drizzle-orm'
import {
  escapeLike,
  housingUnit,
  incident,
  message,
  messageThread,
  placement,
  resident,
  type db,
} from '../db'
import {
  resolveDemoResidentCode,
  ALL_DEMO_RESIDENT_CODE_PREFIXES,
  DEMO_UNIT_CODE_PREFIX,
} from './config'
import { seedDemoData, type DemoSeedSummary } from './seed-data'
import { upsertDemoStaff, upsertDemoStaffRoles } from './staff'
import { syncOrgRules } from '../governance/sync-org-rules'

export interface DemoWorldResetSummary extends DemoSeedSummary {
  unitsDeleted: number
  residentsDeleted: number
  demoStaffCode: string | null
}

/** Delete every demo unit and demo resident. No-op when absent. */
export async function deleteDemoWorld(dbClient: typeof db): Promise<{
  unitsDeleted: number
  residentsDeleted: number
}> {
  const demoUnitFilter = like(housingUnit.code, `${escapeLike(DEMO_UNIT_CODE_PREFIX)}%`)
  // Every demo prefix ever issued, not just this brand's: a demo resident
  // seeded under a previous client prefix would otherwise survive every reset,
  // uncleanable and — on a `unit`-scope instance — parked next to real data.
  const demoResidentFilter = or(
    ...ALL_DEMO_RESIDENT_CODE_PREFIXES.map((prefix) =>
      like(resident.code, `${escapeLike(prefix)}%`),
    ),
    eq(resident.code, resolveDemoResidentCode()),
  )
  const demoUnitIds = dbClient
    .select({ id: housingUnit.id })
    .from(housingUnit)
    .where(demoUnitFilter)
  const demoResidentIds = dbClient
    .select({ id: resident.id })
    .from(resident)
    .where(demoResidentFilter)

  await dbClient.delete(incident).where(inArray(incident.housingUnitId, demoUnitIds))
  await dbClient.delete(placement).where(inArray(placement.housingUnitId, demoUnitIds))
  const units = await dbClient.delete(housingUnit).where(demoUnitFilter)

  // Messages a demo resident WROTE hold a Restrict foreign key, so they veto
  // the resident delete below. Restrict is right for real data — nobody should
  // be erased out from under a conversation staff may have to account for — but
  // the demo world is explicitly allowed to disappear, so the reset removes the
  // messages itself rather than weakening the constraint for everyone.
  //
  // Postgres reports only the FIRST blocking foreign key, so a missing delete
  // here does not surface as "you forgot messages"; it surfaces as the whole
  // nightly reset failing, and the demo silently rotting from that day on.
  await dbClient.delete(message).where(inArray(message.authorResidentId, demoResidentIds))
  await dbClient.delete(messageThread).where(inArray(messageThread.residentId, demoResidentIds))

  const residents = await dbClient.delete(resident).where(demoResidentFilter)

  return { unitsDeleted: units.rowCount ?? 0, residentsDeleted: residents.rowCount ?? 0 }
}

/** Tear down and reseed the demo world; self-heal the demo staff account. */
export async function resetDemoWorld(dbClient: typeof db): Promise<DemoWorldResetSummary> {
  const removed = await deleteDemoWorld(dbClient)
  // The AOZ catalog is reference data, not demo data — it is never deleted
  // above. But the demo's adopted house rule points at an ORG rule by key, so
  // the catalog has to be present before seeding, not merely usually present.
  await syncOrgRules(dbClient)
  // Before the seed: it assigns this account the care seats on every demo
  // resident, so the account has to exist first.
  // Deliberately the SINGLE configured door, not the per-role set. This scope
  // exists for instances where the demo world lives alongside a real flat, and
  // minting five staff accounts there would hand anonymous visitors four more
  // ways into real residents' records. The per-role doors are a dedicated-demo
  // feature and are created only by the full reset.
  const demoStaff = await upsertDemoStaff(dbClient)
  const seeded = await seedDemoData(dbClient, { careStaffId: demoStaff?.id ?? null })

  return { ...seeded, ...removed, demoStaffCode: demoStaff?.code ?? null }
}
