/**
 * Tests for the demo reset (lib/demo/reset.ts).
 *
 * The critical property: the wipe must NEVER touch the keep-list — User holds
 * real staff accounts, AlgorithmWeight and SystemConfig hold operator config.
 * Everything else discovered in pg_tables must be truncated, so new schema
 * models are wiped automatically without editing the reset.
 */

const mockSeedDemoData = jest.fn()
jest.mock('../seed-data', () => ({
  seedDemoData: (...args: unknown[]) => mockSeedDemoData(...args),
}))

const mockSyncOrgRules = jest.fn()
jest.mock('../../governance/sync-org-rules', () => ({
  syncOrgRules: (...args: unknown[]) => mockSyncOrgRules(...args),
}))

import { resetDemoData } from '../reset'
import type { PrismaClient } from '@prisma/client'

const SEED_SUMMARY = {
  residents: 15,
  housingUnits: 5,
  placements: 13,
  incidents: 8,
  demoResidentCode: 'RES-001',
}

function createPrismaMock(tables: string[]) {
  return {
    $queryRaw: jest.fn().mockResolvedValue(tables.map((tablename) => ({ tablename }))),
    $executeRawUnsafe: jest.fn().mockResolvedValue(0),
    user: { upsert: jest.fn().mockResolvedValue({ id: 'demo-user' }) },
    account: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
  } as unknown as PrismaClient & {
    $executeRawUnsafe: jest.Mock
    user: { upsert: jest.Mock }
    account: { deleteMany: jest.Mock }
  }
}

describe('resetDemoData', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.DEMO_STAFF_CODE = 'AOZH-DEMO01'
    mockSeedDemoData.mockResolvedValue(SEED_SUMMARY)
    mockSyncOrgRules.mockResolvedValue({ created: 0, amended: 0 })
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('truncates every discovered table except the keep-list', async () => {
    const prisma = createPrismaMock([
      '_prisma_migrations',
      'User',
      'AlgorithmWeight',
      'SystemConfig',
      'Resident',
      'HousingUnit',
      'HouseRule',
      'BrandNewFutureModel', // schema growth: wiped without editing the reset
    ])

    await resetDemoData(prisma)

    expect(prisma.$executeRawUnsafe).toHaveBeenCalledTimes(1)
    const sql = prisma.$executeRawUnsafe.mock.calls[0][0] as string
    expect(sql).toContain('"Resident"')
    expect(sql).toContain('"HousingUnit"')
    expect(sql).toContain('"HouseRule"')
    expect(sql).toContain('"BrandNewFutureModel"')
    // Real accounts and operator config must survive every reset.
    expect(sql).not.toContain('"User"')
    expect(sql).not.toContain('"AlgorithmWeight"')
    expect(sql).not.toContain('"SystemConfig"')
    expect(sql).not.toContain('_prisma_migrations')
  })

  it('reseeds, self-heals the demo staff account, and re-syncs the rule catalog', async () => {
    const prisma = createPrismaMock(['Resident'])

    const summary = await resetDemoData(prisma)

    expect(mockSeedDemoData).toHaveBeenCalledWith(prisma)
    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { code: 'AOZH-DEMO01' },
      update: { name: 'Demo-Zugang', active: true },
      create: { code: 'AOZH-DEMO01', name: 'Demo-Zugang', role: 'ADMIN' },
      select: { id: true },
    })
    // A visitor-claimed account on the demo code must not outlive the reset.
    expect(prisma.account.deleteMany).toHaveBeenCalledWith({ where: { userId: 'demo-user' } })
    expect(mockSyncOrgRules).toHaveBeenCalledWith(prisma)
    expect(summary).toEqual({
      ...SEED_SUMMARY,
      tablesWiped: 1,
      demoStaffCode: 'AOZH-DEMO01',
      orgRulesSynced: true,
    })
  })

  it('skips the staff upsert when no demo staff code is configured', async () => {
    delete process.env.DEMO_STAFF_CODE
    const prisma = createPrismaMock(['Resident'])

    const summary = await resetDemoData(prisma)

    expect(prisma.user.upsert).not.toHaveBeenCalled()
    expect(summary.demoStaffCode).toBeNull()
  })
})
