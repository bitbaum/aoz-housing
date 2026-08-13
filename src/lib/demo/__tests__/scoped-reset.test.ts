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
    resident: { deleteMany: track('resident.deleteMany', { count: 15 }) },
    user: { upsert: track('user.upsert', {}) },
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
  it('deletes in Restrict-FK order: incidents, placements, units, residents', async () => {
    const { prisma, calls } = createPrismaMock()
    await deleteDemoWorld(prisma)
    expect(calls).toEqual([
      'incident.deleteMany',
      'placement.deleteMany',
      'unit.deleteMany',
      'resident.deleteMany',
    ])
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
      'resident.deleteMany',
      'user.upsert',
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
    })
  })
})
