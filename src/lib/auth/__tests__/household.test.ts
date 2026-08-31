/**
 * Self-serve household onboarding.
 *
 * The load-bearing test here is not "does it create a flat" — it is that the
 * flow can NEVER mint a staff identity. Staff permissions are global, so a
 * self-serve staff account would read every resident in the database. That is
 * the whole reason the feature is shaped the way it is, and it is exactly the
 * kind of property that a later refactor could quietly undo.
 */

jest.mock('@/lib/db', () => ({
  prisma: {
    account: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/auth/passwords', () => ({
  hashPassword: jest.fn(async () => 'hashed'),
  PASSWORD_MIN_LENGTH: 8,
}))

const sendVerificationEmail = jest.fn(async () => {})
jest.mock('@/lib/auth/account', () => ({
  sendVerificationEmail: (...args: unknown[]) => sendVerificationEmail(...(args as [])),
}))

/**
 * Two things this mock has to get right, both learned the hard way.
 *
 * 1. Keep the REAL module and override only the flag. A hand-written BRAND stub
 *    broke the suite for an unrelated reason: `logger.ts` imports
 *    ALL_CODE_PREFIXES from here to redact staff codes out of log lines, so
 *    replacing the module wholesale removed the redactor's input entirely.
 *
 * 2. The switch lives on `globalThis`, not in a module-scope `const`. Jest
 *    hoists `jest.mock` factories above the file's own declarations, so a
 *    factory closing over a local `const` reads a DIFFERENT binding than the
 *    test body mutates — the override applies (tests that need `true` pass) and
 *    the mutation to `false` is silently ignored. That failure mode is
 *    especially nasty here, because the test it breaks is the one asserting the
 *    feature is OFF: it would have reported the safeguarding gate as working
 *    while never actually exercising it.
 */
declare global {
  var __selfServeHousehold: boolean
}
globalThis.__selfServeHousehold = true

jest.mock('@/lib/config/brand', () => {
  const actual = jest.requireActual('@/lib/config/brand')
  return {
    ...actual,
    BRAND: {
      ...actual.BRAND,
      get features() {
        return {
          ...actual.BRAND.features,
          selfServeHousehold: globalThis.__selfServeHousehold,
        }
      },
    },
  }
})

jest.mock('@/lib/auth/code-generation', () => ({
  generateResidentCode: () => 'MB-TEST01',
}))

import { prisma } from '@/lib/db'
import { registerWithNewHousehold } from '@/lib/auth/household'

const mockPrisma = prisma as unknown as {
  account: { findUnique: jest.Mock }
  $transaction: jest.Mock
}

/** Captures every table the transaction wrote, so we can assert on absence. */
function transactionSpy() {
  const created: Record<string, unknown[]> = {
    housingUnit: [],
    resident: [],
    placement: [],
    account: [],
    user: [],
  }

  const tx = {
    housingUnit: {
      create: jest.fn(async ({ data }: { data: unknown }) => {
        created.housingUnit.push(data)
        return { id: 'unit-1' }
      }),
    },
    resident: {
      create: jest.fn(async ({ data }: { data: unknown }) => {
        created.resident.push(data)
        return { id: 'res-1', code: 'MB-TEST01' }
      }),
    },
    placement: {
      create: jest.fn(async ({ data }: { data: unknown }) => {
        created.placement.push(data)
        return { id: 'pl-1' }
      }),
    },
    account: {
      create: jest.fn(async ({ data }: { data: unknown }) => {
        created.account.push(data)
        return { id: 'acc-1' }
      }),
    },
    // Present but must never be called.
    user: {
      create: jest.fn(async ({ data }: { data: unknown }) => {
        created.user.push(data)
        return { id: 'user-1' }
      }),
    },
  }

  mockPrisma.$transaction.mockImplementation(async (fn: (t: typeof tx) => unknown) => fn(tx))
  return { tx, created }
}

beforeEach(() => {
  jest.clearAllMocks()
  globalThis.__selfServeHousehold = true
  mockPrisma.account.findUnique.mockResolvedValue(null)
})

const INPUT = {
  email: 'neu@example.ch',
  password: 'a-good-password',
  householdName: 'Singapur',
  displayName: 'Georgy',
}

describe('registerWithNewHousehold', () => {
  it('creates a household, a resident and a placement in one transaction', async () => {
    const { created } = transactionSpy()

    const result = await registerWithNewHousehold(INPUT)

    expect(result.success).toBe(true)
    expect(created.housingUnit).toHaveLength(1)
    expect(created.resident).toHaveLength(1)
    expect(created.placement).toHaveLength(1)
    expect(created.account).toHaveLength(1)
  })

  it('NEVER creates a staff user — staff permissions are global', async () => {
    const { tx, created } = transactionSpy()

    const result = await registerWithNewHousehold(INPUT)

    expect(tx.user.create).not.toHaveBeenCalled()
    expect(created.user).toHaveLength(0)
    // And the session it asks for carries no staff side at all.
    expect(result.success && 'staff' in result.identities).toBe(false)
  })

  it('links the account to the resident, not to a user', async () => {
    const { created } = transactionSpy()

    await registerWithNewHousehold(INPUT)

    const account = created.account[0] as Record<string, unknown>
    expect(account.residentId).toBe('res-1')
    expect(account.userId).toBeUndefined()
  })

  it('records no answers the person was never asked for', async () => {
    const { created } = transactionSpy()

    await registerWithNewHousehold(INPUT)

    const resident = created.resident[0] as Record<string, unknown>
    // Onboarding asks for a household name and a display name. Gender was not
    // asked, so the stored value must be the refusal, not a guess.
    expect(resident.gender).toBe('PREFER_NOT_SAY')
    expect(resident.preferencesCompletedAt).toBeUndefined()
    expect(resident.displayName).toBe('Georgy')
  })

  it('keeps the resident nameless when no display name is given', async () => {
    const { created } = transactionSpy()

    await registerWithNewHousehold({ ...INPUT, displayName: undefined })

    const resident = created.resident[0] as Record<string, unknown>
    expect(resident.displayName).toBeNull()
  })

  // The "brand does not offer this" case lives in household-aoz-gate.test.ts,
  // against the REAL AOZ brand rather than a mocked flag. Asserting a
  // safeguarding gate through a mock only proves the mock works.

  it('refuses an email that already has an account', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ id: 'existing' })
    const { tx } = transactionSpy()

    const result = await registerWithNewHousehold(INPUT)

    expect(result.success).toBe(false)
    expect(tx.housingUnit.create).not.toHaveBeenCalled()
  })

  it('still succeeds when the verification email cannot be sent', async () => {
    const { created } = transactionSpy()
    sendVerificationEmail.mockRejectedValueOnce(new Error('smtp down'))

    // The household is already committed by this point. Failing the call would
    // tell the person their signup broke while leaving their email taken — so
    // they could neither get in nor retry. Verification does not gate login.
    const result = await registerWithNewHousehold(INPUT)

    expect(result.success).toBe(true)
    expect(created.housingUnit).toHaveLength(1)
  })
})
