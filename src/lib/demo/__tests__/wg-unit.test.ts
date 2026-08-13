/**
 * Tests for the scoped demo apartment (lib/demo/wg-unit.ts).
 *
 * The critical property: the reset touches ONLY the demo unit and the
 * fictional residents — it must never truncate, and its deletes must follow
 * the Restrict-FK order (incidents → placements → unit → demo residents).
 */

import { seedDemoWgUnit, deleteDemoWgUnit, DEMO_WG_UNIT_CODE } from '../wg-unit'
import { DEMO_WG_RESIDENT_CODE_PREFIX } from '../config'
import type { PrismaClient } from '@prisma/client'

function createPrismaMock(existingUnit: { id: string } | null) {
  const calls: string[] = []
  let residentCounter = 0
  const track = (name: string, result: unknown | ((args: unknown) => unknown)) =>
    jest.fn((...args: unknown[]) => {
      calls.push(name)
      return Promise.resolve(
        typeof result === 'function' ? (result as (a: unknown) => unknown)(args[0]) : result
      )
    })

  const prisma = {
    housingUnit: {
      findUnique: track('unit.findUnique', existingUnit),
      delete: track('unit.delete', {}),
      create: track('unit.create', { id: 'unit-demo' }),
    },
    incident: { deleteMany: track('incident.deleteMany', { count: 0 }) },
    placement: {
      deleteMany: track('placement.deleteMany', { count: 3 }),
      create: track('placement.create', {}),
    },
    resident: {
      deleteMany: track('resident.deleteMany', { count: 3 }),
      create: track('resident.create', () => ({ id: `resident-${++residentCounter}` })),
    },
    placementSpot: {
      create: track('spot.create', (args: unknown) => ({
        id: `spot-${(args as { data: { code: string } }).data.code}`,
      })),
    },
    expense: {
      create: track('expense.create', (args: unknown) => ({
        id: 'expense',
        ...(args as { data: object }).data,
      })),
    },
    settlement: { create: track('settlement.create', {}) },
  }
  return { prisma: prisma as unknown as PrismaClient, calls, raw: prisma }
}

beforeEach(() => {
  delete process.env.DEMO_RESIDENT_CODE
  delete process.env.DEMO_RESET_SCOPE
})

describe('deleteDemoWgUnit', () => {
  it('deletes in Restrict-FK order: incidents, placements, unit, residents', async () => {
    const { prisma, calls } = createPrismaMock({ id: 'unit-1' })
    await deleteDemoWgUnit(prisma)
    expect(calls).toEqual([
      'unit.findUnique',
      'incident.deleteMany',
      'placement.deleteMany',
      'unit.delete',
      'resident.deleteMany',
    ])
  })

  it('skips unit deletion when the demo unit does not exist, but still sweeps residents', async () => {
    const { prisma, calls } = createPrismaMock(null)
    const result = await deleteDemoWgUnit(prisma)
    expect(result.unitDeleted).toBe(false)
    expect(calls).toEqual(['unit.findUnique', 'resident.deleteMany'])
  })

  it('only ever targets demo residents (prefix or configured login code)', async () => {
    const { prisma, raw } = createPrismaMock(null)
    await deleteDemoWgUnit(prisma)
    const where = (raw.resident.deleteMany as jest.Mock).mock.calls[0][0].where
    expect(where).toEqual({
      OR: [
        { code: { startsWith: DEMO_WG_RESIDENT_CODE_PREFIX } },
        { code: `${DEMO_WG_RESIDENT_CODE_PREFIX}1` },
      ],
    })
  })
})

describe('seedDemoWgUnit', () => {
  it('recreates the demo flat: unit, 3 flatmates, 3 placements, 2 expenses, 1 settlement', async () => {
    const { prisma, calls } = createPrismaMock(null)
    const summary = await seedDemoWgUnit(prisma)

    expect(calls.filter((c) => c === 'resident.create')).toHaveLength(3)
    expect(calls.filter((c) => c === 'placement.create')).toHaveLength(3)
    expect(calls.filter((c) => c === 'expense.create')).toHaveLength(2)
    expect(calls.filter((c) => c === 'settlement.create')).toHaveLength(1)
    expect(summary.demoResidentCode).toBe(`${DEMO_WG_RESIDENT_CODE_PREFIX}1`)
  })

  it('creates the unit under the fixed demo code', async () => {
    const { prisma, raw } = createPrismaMock(null)
    await seedDemoWgUnit(prisma)
    const created = (raw.housingUnit.create as jest.Mock).mock.calls[0][0].data
    expect(created.code).toBe(DEMO_WG_UNIT_CODE)
  })

  it('keeps every expense internally consistent: shares sum to the amount', async () => {
    const { prisma, raw } = createPrismaMock(null)
    await seedDemoWgUnit(prisma)
    for (const call of (raw.expense.create as jest.Mock).mock.calls) {
      const data = call[0].data
      const sum = data.shares.create.reduce(
        (acc: number, s: { amountRappen: number }) => acc + s.amountRappen,
        0
      )
      expect(sum).toBe(data.amountRappen)
    }
  })

  it('honours a configured DEMO_RESIDENT_CODE for the login flatmate', async () => {
    process.env.DEMO_RESIDENT_CODE = 'RES-DEMOX'
    const { prisma, raw } = createPrismaMock(null)
    const summary = await seedDemoWgUnit(prisma)
    expect(summary.demoResidentCode).toBe('RES-DEMOX')
    const firstResident = (raw.resident.create as jest.Mock).mock.calls[0][0].data
    expect(firstResident.code).toBe('RES-DEMOX')
  })
})
