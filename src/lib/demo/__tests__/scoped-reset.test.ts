/**
 * Tests for the scoped demo reset (lib/demo/scoped-reset.ts).
 *
 * The critical property: the reset touches ONLY prefix-scoped demo entities —
 * it must never truncate, and its deletes must follow the Restrict-FK order
 * (incidents → placements → units → demo residents).
 */

const mockSeedDemoData = jest.fn()
jest.mock('../seed-data', () => ({
  seedDemoData: (...args: unknown[]) => mockSeedDemoData(...args),
}))

// The catalog sync is reference-data plumbing with its own tests; stubbing it
// keeps the assertion below about the one thing that matters here — the order
// demo rows are deleted in.
const mockSyncOrgRules = jest.fn()
jest.mock('../../governance/sync-org-rules', () => ({
  syncOrgRules: (...args: unknown[]) => mockSyncOrgRules(...args),
}))

import { getTableName, eq, inArray, like, or, type SQL } from 'drizzle-orm'
import { deleteDemoWorld, resetDemoWorld } from '../scoped-reset'
import { upsertDemoStaff } from '../staff'
import {
  ALL_DEMO_RESIDENT_CODE_PREFIXES,
  DEMO_RESIDENT_CODE_PREFIX,
  DEMO_UNIT_CODE_PREFIX,
} from '../config'
import {
  escapeLike,
  account,
  housingUnit,
  incident,
  message,
  messageThread,
  placement,
  resident,
  user,
  type db,
} from '@/lib/db'

/**
 * A drizzle-client stand-in for the scoped reset's surface: prefix-filtered
 * `select` subqueries, ordered `delete(table).where(...)` calls, and the
 * demo-staff upsert. `select(...).from(...).where(f)` returns a marker object
 * carrying the filter, so a delete's `inArray(col, subquery)` tree can be
 * compared against one built with the same marker.
 */
function createDbMock() {
  const calls: string[] = []
  const deletes: Record<string, unknown[]> = {}
  const rowCounts: Record<string, number> = {
    Incident: 7,
    Placement: 13,
    HousingUnit: 5,
    Message: 4,
    MessageThread: 2,
    Resident: 15,
    Account: 0,
  }
  const userUpsert = jest.fn((call: unknown) => {
    void call
    calls.push('user.upsert')
    return [{ id: 'demo-user' }]
  })

  const dbMock = {
    select: () => ({
      from: () => ({ where: (filter: unknown) => ({ __subquery: filter }) }),
    }),
    delete: (table: unknown) => ({
      where: (w: unknown) => {
        const name = getTableName(table as Parameters<typeof getTableName>[0])
        calls.push(`${name === 'Account' ? 'account' : name}.delete`)
        ;(deletes[name] ??= []).push(w)
        return Promise.resolve({ rowCount: rowCounts[name] ?? 0 })
      },
    }),
    insert: () => ({
      values: (values: unknown) => ({
        onConflictDoUpdate: ({ target, set }: { target: unknown; set: unknown }) => ({
          returning: () => Promise.resolve(userUpsert({ values, target, set })),
        }),
      }),
    }),
  }

  return { db: dbMock as unknown as typeof db, calls, deletes, userUpsert }
}

/**
 * The subquery marker the mock's `select` hands back for a given filter.
 * Cast to SQL so it can sit where `inArray` expects a subquery — the
 * comparison is structural (toEqual), so only the shape matters.
 */
function subqueryOf(filter: unknown): SQL {
  return { __subquery: filter } as unknown as SQL
}

const SEED_SUMMARY = {
  residents: 15,
  housingUnits: 5,
  placements: 13,
  incidents: 7,
  demoResidentCode: `${DEMO_RESIDENT_CODE_PREFIX}1`,
}

const unitFilter = () => like(housingUnit.code, `${escapeLike(DEMO_UNIT_CODE_PREFIX)}%`)
const residentFilter = (configuredCode: string) =>
  or(
    ...ALL_DEMO_RESIDENT_CODE_PREFIXES.map((prefix) =>
      like(resident.code, `${escapeLike(prefix)}%`),
    ),
    eq(resident.code, configuredCode),
  )

beforeEach(() => {
  jest.clearAllMocks()
  delete process.env.DEMO_RESIDENT_CODE
  delete process.env.DEMO_STAFF_CODE
  mockSeedDemoData.mockResolvedValue(SEED_SUMMARY)
})

describe('deleteDemoWorld', () => {
  it('deletes in Restrict-FK order, messages before their authors', async () => {
    // A message a demo resident WROTE holds a Restrict foreign key on them, so
    // it vetoes the resident delete. Postgres reports only the FIRST blocking
    // key, so getting this wrong does not surface as "you forgot messages" —
    // it surfaces as the whole nightly reset failing and the demo rotting from
    // that day on.
    const { db, calls } = createDbMock()
    await deleteDemoWorld(db)

    expect(calls).toEqual([
      'Incident.delete',
      'Placement.delete',
      'HousingUnit.delete',
      'Message.delete',
      'MessageThread.delete',
      'Resident.delete',
    ])
  })

  it('scopes message deletion to demo residents, never the whole table', async () => {
    // The demo world lives ALONGSIDE a real flat on this deployment. A delete
    // without this filter would erase real conversations.
    const { db, deletes } = createDbMock()
    await deleteDemoWorld(db)

    // EVERY demo prefix the product has ever issued, not just today's — a demo
    // resident seeded under an earlier client prefix must still be reachable
    // by the reset, or it survives forever beside the real flat.
    const demoResidents = subqueryOf(residentFilter(`${DEMO_RESIDENT_CODE_PREFIX}1`))

    expect(deletes.Message[0]).toEqual(inArray(message.authorResidentId, demoResidents))
    expect(deletes.MessageThread[0]).toEqual(inArray(messageThread.residentId, demoResidents))
  })

  it('targets units only by the demo code prefix — never a whole table', async () => {
    const { db, deletes } = createDbMock()
    await deleteDemoWorld(db)
    const demoUnits = subqueryOf(unitFilter())
    expect(deletes.HousingUnit[0]).toEqual(unitFilter())
    expect(deletes.Incident[0]).toEqual(inArray(incident.housingUnitId, demoUnits))
    expect(deletes.Placement[0]).toEqual(inArray(placement.housingUnitId, demoUnits))
  })

  it('only ever targets demo residents (prefix or configured login code)', async () => {
    process.env.DEMO_RESIDENT_CODE = 'RES-SPECIAL'
    const { db, deletes } = createDbMock()
    await deleteDemoWorld(db)
    expect(deletes.Resident[0]).toEqual(residentFilter('RES-SPECIAL'))
  })

  it('reports what it removed', async () => {
    const { db } = createDbMock()
    expect(await deleteDemoWorld(db)).toEqual({ unitsDeleted: 5, residentsDeleted: 15 })
  })
})

describe('resetDemoWorld', () => {
  it('tears down before seeding, then self-heals the staff account', async () => {
    process.env.DEMO_STAFF_CODE = 'WG-DEMO01'
    const { db, calls } = createDbMock()
    const summary = await resetDemoWorld(db)

    expect(calls).toEqual([
      'Incident.delete',
      'Placement.delete',
      'HousingUnit.delete',
      'Message.delete',
      'MessageThread.delete',
      'Resident.delete',
      'user.upsert',
      'account.delete',
    ])
    expect(mockSeedDemoData).toHaveBeenCalledTimes(1)
    // The other end of the safety property the full reset test pins. This
    // scope may share a database with a real flat, and it deletes by demo
    // PREFIX — so anything it seeds without a prefix survives forever. An
    // Activity has no unit and no code, which is exactly that.
    expect(mockSeedDemoData).toHaveBeenCalledWith(
      expect.anything(),
      expect.not.objectContaining({ siteWideContent: true }),
    )
    expect(summary).toEqual({
      ...SEED_SUMMARY,
      unitsDeleted: 5,
      residentsDeleted: 15,
      demoStaffCode: 'WG-DEMO01',
    })
  })

  it('touches no staff account when no staff door is configured', async () => {
    const { db, userUpsert } = createDbMock()
    const summary = await resetDemoWorld(db)
    expect(summary.demoStaffCode).toBeNull()
    expect(userUpsert).not.toHaveBeenCalled()
  })
})

describe('upsertDemoStaff', () => {
  it('upserts the dedicated demo admin under the configured code', async () => {
    process.env.DEMO_STAFF_CODE = 'WG-DEMO01'
    const { db, userUpsert } = createDbMock()
    expect(await upsertDemoStaff(db)).toEqual({ id: 'demo-user', code: 'WG-DEMO01' })
    expect(userUpsert.mock.calls[0][0]).toEqual({
      values: {
        code: 'WG-DEMO01',
        name: 'Demo-Zugang',
        role: 'ADMIN',
        scope: 'ALL_DOMAINS',
        isSystemAdmin: true,
      },
      target: user.code,
      set: { name: 'Demo-Zugang', active: true, scope: 'ALL_DOMAINS', isSystemAdmin: true },
    })
  })

  it('drops any account a visitor claimed on the demo code', async () => {
    process.env.DEMO_STAFF_CODE = 'WG-DEMO01'
    const { db, deletes } = createDbMock()
    await upsertDemoStaff(db)
    // A visitor-claimed email/password on the demo door must not outlive the
    // reset — otherwise the next tester cannot get in.
    expect(deletes.Account[0]).toEqual(eq(account.userId, 'demo-user'))
  })
})
