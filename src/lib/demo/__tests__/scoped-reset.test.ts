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

import { deleteDemoWorld, resetDemoWorld } from '../scoped-reset'
import { upsertDemoStaff } from '../staff'
import { DEMO_RESIDENT_CODE_PREFIX, DEMO_UNIT_CODE_PREFIX } from '../config'
import type { PrismaClient } from '@prisma/client'

function createPrismaMock() {
  const calls: string[] = []
  const track = (name: string, result: unknown) =>
    jest.fn(() => {
      calls.push(name)
      return Promise.resolve(result)
    })

  const prisma = {
    incident: { deleteMany: track('incident.deleteMany', { count: 7 }) },
    placement: { deleteMany: track('placement.deleteMany', { count: 13 }) },
    housingUnit: { deleteMany: track('unit.deleteMany', { count: 5 }) },
    message: { deleteMany: track('message.deleteMany', { count: 4 }) },
    messageThread: { deleteMany: track('messageThread.deleteMany', { count: 2 }) },
    resident: { deleteMany: track('resident.deleteMany', { count: 15 }) },
    user: { upsert: track('user.upsert', { id: 'demo-user' }) },
    account: { deleteMany: track('account.deleteMany', { count: 0 }) },
  }
  return { prisma: prisma as unknown as PrismaClient, calls, raw: prisma }
}

const SEED_SUMMARY = {
  residents: 15,
  housingUnits: 5,
  placements: 13,
  incidents: 7,
  demoResidentCode: `${DEMO_RESIDENT_CODE_PREFIX}1`,
}

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
    const { prisma, calls } = createPrismaMock()
    await deleteDemoWorld(prisma)

    expect(calls).toEqual([
      'incident.deleteMany',
      'placement.deleteMany',
      'unit.deleteMany',
      'message.deleteMany',
      'messageThread.deleteMany',
      'resident.deleteMany',
    ])
  })

  it('scopes message deletion to demo residents, never the whole table', async () => {
    // The demo world lives ALONGSIDE a real flat on this deployment. A delete
    // without this filter would erase real conversations.
    const { prisma, raw } = createPrismaMock()
    await deleteDemoWorld(prisma)

    const demoResidentFilter = {
      OR: [
        { code: { startsWith: DEMO_RESIDENT_CODE_PREFIX } },
        { code: `${DEMO_RESIDENT_CODE_PREFIX}1` },
      ],
    }

    expect((raw.message.deleteMany as jest.Mock).mock.calls[0][0]).toEqual({
      where: { authorResident: demoResidentFilter },
    })
    expect((raw.messageThread.deleteMany as jest.Mock).mock.calls[0][0]).toEqual({
      where: { resident: demoResidentFilter },
    })
  })

  it('targets units only by the demo code prefix — never a whole table', async () => {
    const { prisma, raw } = createPrismaMock()
    await deleteDemoWorld(prisma)
    const unitFilter = { code: { startsWith: DEMO_UNIT_CODE_PREFIX } }
    expect((raw.housingUnit.deleteMany as jest.Mock).mock.calls[0][0]).toEqual({
      where: unitFilter,
    })
    expect((raw.incident.deleteMany as jest.Mock).mock.calls[0][0]).toEqual({
      where: { housingUnit: unitFilter },
    })
    expect((raw.placement.deleteMany as jest.Mock).mock.calls[0][0]).toEqual({
      where: { housingUnit: unitFilter },
    })
  })

  it('only ever targets demo residents (prefix or configured login code)', async () => {
    process.env.DEMO_RESIDENT_CODE = 'RES-SPECIAL'
    const { prisma, raw } = createPrismaMock()
    await deleteDemoWorld(prisma)
    expect((raw.resident.deleteMany as jest.Mock).mock.calls[0][0].where).toEqual({
      OR: [{ code: { startsWith: DEMO_RESIDENT_CODE_PREFIX } }, { code: 'RES-SPECIAL' }],
    })
  })

  it('reports what it removed', async () => {
    const { prisma } = createPrismaMock()
    expect(await deleteDemoWorld(prisma)).toEqual({ unitsDeleted: 5, residentsDeleted: 15 })
  })
})

describe('resetDemoWorld', () => {
  it('tears down before seeding, then self-heals the staff account', async () => {
    process.env.DEMO_STAFF_CODE = 'WG-DEMO01'
    const { prisma, calls } = createPrismaMock()
    const summary = await resetDemoWorld(prisma)

    expect(calls).toEqual([
      'incident.deleteMany',
      'placement.deleteMany',
      'unit.deleteMany',
      'message.deleteMany',
      'messageThread.deleteMany',
      'resident.deleteMany',
      'user.upsert',
      'account.deleteMany',
    ])
    expect(mockSeedDemoData).toHaveBeenCalledTimes(1)
    expect(summary).toEqual({
      ...SEED_SUMMARY,
      unitsDeleted: 5,
      residentsDeleted: 15,
      demoStaffCode: 'WG-DEMO01',
    })
  })

  it('touches no staff account when no staff door is configured', async () => {
    const { prisma, raw } = createPrismaMock()
    const summary = await resetDemoWorld(prisma)
    expect(summary.demoStaffCode).toBeNull()
    expect(raw.user.upsert as jest.Mock).not.toHaveBeenCalled()
  })
})

describe('upsertDemoStaff', () => {
  it('upserts the dedicated demo admin under the configured code', async () => {
    process.env.DEMO_STAFF_CODE = 'WG-DEMO01'
    const { prisma, raw } = createPrismaMock()
    expect(await upsertDemoStaff(prisma)).toBe('WG-DEMO01')
    expect((raw.user.upsert as jest.Mock).mock.calls[0][0]).toEqual({
      where: { code: 'WG-DEMO01' },
      update: { name: 'Demo-Zugang', active: true },
      create: { code: 'WG-DEMO01', name: 'Demo-Zugang', role: 'ADMIN' },
      select: { id: true },
    })
  })

  it('drops any account a visitor claimed on the demo code', async () => {
    process.env.DEMO_STAFF_CODE = 'WG-DEMO01'
    const { prisma, raw } = createPrismaMock()
    await upsertDemoStaff(prisma)
    // A visitor-claimed email/password on the demo door must not outlive the
    // reset — otherwise the next tester cannot get in.
    expect((raw.account.deleteMany as jest.Mock)).toHaveBeenCalledWith({
      where: { userId: 'demo-user' },
    })
  })
})
