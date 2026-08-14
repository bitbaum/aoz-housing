/**
 * Tests for the demo presentation narrative (lib/demo/seed-data.ts).
 *
 * The property that makes the scoped reset SAFE: every unit and resident the
 * seed creates must carry a demo code prefix (or be the configured login
 * code), because deletion targets prefixes — an unprefixed code would leak a
 * row that survives every reset and can never be cleaned up.
 */

import { seedDemoData } from '../seed-data'
import {
  DEMO_RESIDENT_CODE_PREFIX,
  DEMO_UNIT_CODE_PREFIX,
  resolveDemoResidentCode,
} from '../config'
import type { PrismaClient } from '@prisma/client'

interface Recorded {
  unitCodes: string[]
  residentCodes: string[]
  expenses: Array<{ amountRappen: number; shares: { create: Array<{ amountRappen: number }> } }>
  taskTitles: string[]
  proposalStatuses: string[]
  maintenanceStatuses: string[]
  unitRuleTitles: string[]
}

function createPrismaMock(): { prisma: PrismaClient; recorded: Recorded } {
  const recorded: Recorded = {
    unitCodes: [],
    residentCodes: [],
    expenses: [],
    taskTitles: [],
    proposalStatuses: [],
    maintenanceStatuses: [],
    unitRuleTitles: [],
  }
  let id = 0

  const model = (onCreate?: (data: Record<string, unknown>) => void) => ({
    create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
      onCreate?.(data)
      return Promise.resolve({ ...data, id: `id-${++id}` })
    }),
    createMany: jest.fn(() => Promise.resolve({ count: 0 })),
    count: jest.fn(() => Promise.resolve(0)),
  })

  const prisma = {
    housingUnit: model((d) => recorded.unitCodes.push(d.code as string)),
    resident: model((d) => recorded.residentCodes.push(d.code as string)),
    placementSpot: model(),
    placement: model(),
    incident: model(),
    incidentInvolvement: model(),
    expense: model((d) => recorded.expenses.push(d as Recorded['expenses'][number])),
    settlement: model(),
    // The living-together half of the demo world (seed-governance.ts).
    householdTask: model((d) => recorded.taskTitles.push(d.title as string)),
    taskCompletion: model(),
    taskAttentionFlag: model(),
    proposal: model((d) => recorded.proposalStatuses.push(d.status as string)),
    maintenanceRequest: model((d) => recorded.maintenanceStatuses.push(d.status as string)),
    houseRule: {
      ...model((d) => recorded.unitRuleTitles.push(d.title as string)),
      findUnique: jest.fn(() => Promise.resolve({ id: 'org-night-quiet' })),
    },
  }
  return { prisma: prisma as unknown as PrismaClient, recorded }
}

beforeEach(() => {
  delete process.env.DEMO_RESIDENT_CODE
})

describe('seedDemoData', () => {
  it('creates the full presentation narrative: 5 units, 15 residents', async () => {
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    expect(recorded.unitCodes).toHaveLength(5)
    expect(recorded.residentCodes).toHaveLength(15)
  })

  it('gives EVERY unit a demo-prefixed code, so the scoped reset can find it', async () => {
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    for (const code of recorded.unitCodes) {
      expect(code).toMatch(new RegExp(`^${DEMO_UNIT_CODE_PREFIX}`))
    }
  })

  it('gives EVERY resident a demo-prefixed code or the configured login code', async () => {
    process.env.DEMO_RESIDENT_CODE = 'RES-CUSTOM'
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    for (const code of recorded.residentCodes) {
      if (code === 'RES-CUSTOM') continue
      expect(code).toMatch(new RegExp(`^${DEMO_RESIDENT_CODE_PREFIX}`))
    }
    expect(recorded.residentCodes).toContain('RES-CUSTOM')
  })

  it('assigns the demo login code to a resident (the portal tour identity)', async () => {
    const { prisma, recorded } = createPrismaMock()
    const summary = await seedDemoData(prisma)
    expect(summary.demoResidentCode).toBe(resolveDemoResidentCode())
    expect(recorded.residentCodes).toContain(summary.demoResidentCode)
  })

  it('keeps every expense internally consistent: shares sum to the amount', async () => {
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    expect(recorded.expenses.length).toBeGreaterThan(0)
    for (const expense of recorded.expenses) {
      const sum = expense.shares.create.reduce((acc, s) => acc + s.amountRappen, 0)
      expect(sum).toBe(expense.amountRappen)
    }
  })

  // An empty page reads as a missing feature. These pin the surfaces that
  // shipped empty and made the tour look like less than the product is.
  it('fills the chore board, so the tour never shows "Noch keine Aufgaben"', async () => {
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    expect(recorded.taskTitles.length).toBeGreaterThan(0)
  })

  it('fills the maintenance board with both open and finished work', async () => {
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    expect(recorded.maintenanceStatuses).toContain('OPEN')
    expect(recorded.maintenanceStatuses).toContain('COMPLETED')
  })

  it('seeds a proposal ALREADY IN VOTING — a fresh one could never reach a vote', async () => {
    // Voting opens after a 3-day discussion window and the demo world is wiped
    // nightly, so an un-backdated proposal makes the ballot unreachable forever.
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    expect(recorded.proposalStatuses).toContain('VOTING')
  })

  it('seeds a decided proposal and one awaiting staff, so both queues have content', async () => {
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    expect(recorded.proposalStatuses).toContain('ACCEPTED')
    expect(recorded.proposalStatuses).toContain('NEEDS_STAFF_CONFIRMATION')
    expect(recorded.proposalStatuses).toContain('DISCUSSION')
  })

  it('adopts a house rule from the accepted proposal, so the two tiers are visible', async () => {
    const { prisma, recorded } = createPrismaMock()
    await seedDemoData(prisma)
    expect(recorded.unitRuleTitles.length).toBeGreaterThan(0)
  })
})
