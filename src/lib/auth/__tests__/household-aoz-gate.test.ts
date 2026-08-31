/**
 * The safeguarding gate, asserted against the REAL brand config.
 *
 * This file deliberately mocks NOTHING about brands. The sibling suite
 * (household.test.ts) has to force `selfServeHousehold` on to exercise the
 * happy path, and a gate proven through the same mock that enables it proves
 * only that the mock works. Here the default test brand IS AOZ, so what runs is
 * the configuration a real AOZ deployment ships.
 *
 * What it protects: AOZ provisions every identity through intake or a staff
 * invite, and its database holds asylum seekers' records. A public endpoint
 * that mints identities into it must not exist — not "must be hard to reach".
 */

jest.mock('@/lib/db', () => ({
  prisma: {
    account: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}))

import { prisma } from '@/lib/db'
import { BRAND } from '@/lib/config/brand'
import { registerWithNewHousehold } from '@/lib/auth/household'

const mockPrisma = prisma as unknown as {
  account: { findUnique: jest.Mock }
  $transaction: jest.Mock
}

describe('self-serve household on an AOZ deployment', () => {
  it('is off in the shipped AOZ configuration', () => {
    // If this ever flips, the assertions below stop meaning anything — so it
    // is stated first, as a fact about config rather than about behaviour.
    expect({ brand: BRAND.id, selfServe: BRAND.features.selfServeHousehold }).toEqual({
      brand: 'aoz',
      selfServe: false,
    })
  })

  it('refuses, and never opens a transaction', async () => {
    const result = await registerWithNewHousehold({
      email: 'stranger@example.ch',
      password: 'a-good-password',
      householdName: 'Fremde Wohnung',
    })

    expect(result.success).toBe(false)
    // The point is not just the return value: nothing may be written, and the
    // refusal must land before any database work is attempted at all.
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    expect(mockPrisma.account.findUnique).not.toHaveBeenCalled()
  })
})
