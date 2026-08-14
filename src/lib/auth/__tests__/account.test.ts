/**
 * Tests for the account flows (lib/auth/account.ts): claiming a code, LINKING a
 * second code to an existing login (the one-human-two-roles case), email login,
 * and password reset — including the anti-enumeration and email-not-configured
 * guarantees.
 */

const mockPrisma = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  resident: { findUnique: jest.fn() },
  account: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}
jest.mock('@/lib/db', () => ({ prisma: mockPrisma }))

const mockSendEmail = jest.fn()
jest.mock('@/lib/email/service', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

const mockEmailConfig = { enabled: true }
jest.mock('@/lib/email/config', () => ({ EMAIL_CONFIG: mockEmailConfig }))

const mockCreateAuthToken = jest.fn()
const mockConsumeAuthToken = jest.fn()
jest.mock('../tokens', () => ({
  createAuthToken: (...args: unknown[]) => mockCreateAuthToken(...args),
  consumeAuthToken: (...args: unknown[]) => mockConsumeAuthToken(...args),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), errorWithCause: jest.fn() },
}))

import { registerAccount, loginWithEmail, requestPasswordReset, resetPassword } from '../account'
import { hashPassword } from '../passwords'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

const STAFF = { id: 'user-1', code: 'AOZ-ADMIN1', name: 'Admin', role: 'ADMIN' as const, active: true }
const RESIDENT = { id: 'res-1', code: 'RES-ABC123' }

// bcrypt at 12 rounds is deliberately slow, and slower still when the whole
// suite runs in parallel — the cost is the security property, so these tests
// get a real budget rather than a weakened hash.
jest.setTimeout(60_000)

// Hash the one password these tests verify against exactly once; otherwise
// every case pays for it twice.
const ACCOUNT_PASSWORD = 'my-password'
let ACCOUNT_HASH: string
beforeAll(async () => {
  ACCOUNT_HASH = await hashPassword(ACCOUNT_PASSWORD)
})

/** An Account row as ACCOUNT_WITH_IDENTITIES selects it. */
function account(overrides: Partial<{
  id: string
  email: string
  passwordHash: string | null
  user: typeof STAFF | null
  resident: typeof RESIDENT | null
}> = {}) {
  return {
    id: 'acc-1',
    email: 'g@example.ch',
    passwordHash: null,
    user: null,
    resident: null,
    ...overrides,
  }
}

/** Code lookups resolve; nothing else exists unless a test says so. */
function codeExists({ staff = false, resident = false } = {}) {
  mockPrisma.user.findUnique.mockImplementation(({ where }: { where: { code?: string } }) =>
    Promise.resolve(staff && where.code === STAFF.code ? { id: STAFF.id, active: true } : null)
  )
  mockPrisma.resident.findUnique.mockImplementation(({ where }: { where: { code?: string } }) =>
    Promise.resolve(resident && where.code === RESIDENT.code ? { id: RESIDENT.id } : null)
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  mockEmailConfig.enabled = true
  codeExists()
  mockPrisma.user.update.mockResolvedValue({})
  mockPrisma.account.findFirst.mockResolvedValue(null)
  mockPrisma.account.findUnique.mockResolvedValue(null)
  mockPrisma.account.create.mockResolvedValue({ id: 'acc-new' })
  mockPrisma.account.update.mockResolvedValue({ id: 'acc-1' })
  mockPrisma.account.findUniqueOrThrow.mockResolvedValue(account())
  mockCreateAuthToken.mockResolvedValue('raw-token')
  mockSendEmail.mockResolvedValue(true)
})

describe('registerAccount', () => {
  it('claims a staff code: creates the account with a bcrypt hash, sends verification', async () => {
    codeExists({ staff: true })
    mockPrisma.account.findUniqueOrThrow.mockResolvedValue(account({ id: 'acc-new', user: STAFF }))

    const result = await registerAccount({
      code: 'AOZ-ADMIN1',
      email: 'g@example.ch',
      password: 'secret-password',
    })

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.identities.staff).toMatchObject({ code: 'AOZ-ADMIN1', email: 'g@example.ch' })
    expect(result.identities.resident).toBeUndefined()

    const created = mockPrisma.account.create.mock.calls[0][0].data
    expect(created).toMatchObject({ email: 'g@example.ch', userId: 'user-1' })
    expect(created.passwordHash).toMatch(/^\$2[aby]\$/)
    expect(created.passwordHash).not.toBe('secret-password')

    expect(mockCreateAuthToken).toHaveBeenCalledWith('acc-new', 'VERIFY_EMAIL')
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })

  it('claims a resident code and returns the resident identity', async () => {
    codeExists({ resident: true })
    mockPrisma.account.findUniqueOrThrow.mockResolvedValue(
      account({ id: 'acc-new', email: 'ihor@example.ch', resident: RESIDENT })
    )

    const result = await registerAccount({
      code: 'RES-ABC123',
      email: 'ihor@example.ch',
      password: 'secret-password',
    })

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.identities.resident).toEqual({ id: 'res-1', code: 'RES-ABC123' })
    expect(mockPrisma.account.create.mock.calls[0][0].data).toMatchObject({ residentId: 'res-1' })
  })

  it('rejects an unknown code', async () => {
    const result = await registerAccount({
      code: 'RES-NOPE',
      email: 'x@example.ch',
      password: 'secret-password',
    })
    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.AUTH_CODE_UNKNOWN })
  })

  it('rejects a DEACTIVATED staff code with the same message as an unknown one', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: STAFF.id, active: false })
    const result = await registerAccount({
      code: 'AOZ-ADMIN1',
      email: 'x@example.ch',
      password: 'secret-password',
    })
    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.AUTH_CODE_UNKNOWN })
  })

  it('rejects a code that already carries credentials (use password reset)', async () => {
    codeExists({ resident: true })
    mockPrisma.account.findFirst.mockResolvedValue(
      account({ passwordHash: 'already-set', resident: RESIDENT })
    )
    const result = await registerAccount({
      code: 'RES-ABC123',
      email: 'x@example.ch',
      password: 'secret-password',
    })
    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.AUTH_ALREADY_REGISTERED })
  })

  it('rejects an email owned by a DIFFERENT account than the code is on', async () => {
    codeExists({ resident: true })
    mockPrisma.account.findFirst.mockResolvedValue(account({ id: 'acc-res', resident: RESIDENT }))
    mockPrisma.account.findUnique.mockResolvedValue(account({ id: 'acc-other' }))

    const result = await registerAccount({
      code: 'RES-ABC123',
      email: 'taken@example.ch',
      password: 'secret-password',
    })
    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.AUTH_EMAIL_TAKEN })
  })

  it('completes an unclaimed account that already knows the email (invited staff)', async () => {
    codeExists({ staff: true })
    const unclaimed = account({ user: STAFF })
    mockPrisma.account.findFirst.mockResolvedValue(unclaimed)
    mockPrisma.account.findUnique.mockResolvedValue(unclaimed)
    mockPrisma.account.findUniqueOrThrow.mockResolvedValue(account({ user: STAFF }))

    const result = await registerAccount({
      code: 'AOZ-ADMIN1',
      email: 'g@example.ch',
      password: 'secret-password',
    })

    expect(result.success).toBe(true)
    expect(mockPrisma.account.create).not.toHaveBeenCalled()
    expect(mockPrisma.account.update.mock.calls[0][0].where).toEqual({ id: 'acc-1' })
  })

  it('still succeeds when the verification email fails to send', async () => {
    codeExists({ staff: true })
    mockSendEmail.mockRejectedValue(new Error('smtp down'))

    const result = await registerAccount({
      code: 'AOZ-ADMIN1',
      email: 'g@example.ch',
      password: 'secret-password',
    })
    expect(result.success).toBe(true)
  })
})

describe('registerAccount — linking a SECOND role to one login', () => {
  /** An admin account with a password, claiming their own resident code. */
  async function linkResidentToStaffAccount(password: string) {
    codeExists({ resident: true })
    const staffAccount = account({ id: 'acc-staff', passwordHash: ACCOUNT_HASH, user: STAFF })
    mockPrisma.account.findFirst.mockResolvedValue(null)
    mockPrisma.account.findUnique.mockResolvedValue(staffAccount)
    mockPrisma.account.findUniqueOrThrow.mockResolvedValue({
      ...staffAccount,
      resident: RESIDENT,
    })

    return registerAccount({ code: 'RES-ABC123', email: 'g@example.ch', password })
  }

  it('links the code and returns BOTH identities in one login', async () => {
    const result = await linkResidentToStaffAccount(ACCOUNT_PASSWORD)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.identities.staff).toMatchObject({ code: 'AOZ-ADMIN1' })
    expect(result.identities.resident).toEqual({ id: 'res-1', code: 'RES-ABC123' })

    expect(mockPrisma.account.update).toHaveBeenCalledWith({
      where: { id: 'acc-staff' },
      data: { residentId: 'res-1' },
    })
    // Linking must not touch the existing password.
    expect(mockPrisma.account.update.mock.calls[0][0].data.passwordHash).toBeUndefined()
  })

  it('refuses to link without the account password (a stray code is not enough)', async () => {
    const result = await linkResidentToStaffAccount('not-my-password')
    expect(result).toEqual({
      success: false,
      error: ERROR_MESSAGES.AUTH_LINK_PASSWORD_MISMATCH,
    })
    expect(mockPrisma.account.update).not.toHaveBeenCalled()
  })

  it('refuses a second code for a role slot that is already filled', async () => {
    codeExists({ resident: true })
    mockPrisma.account.findUnique.mockResolvedValue(
      account({
        id: 'acc-other',
        passwordHash: 'x',
        resident: { id: 'res-9', code: 'RES-OTHER9' },
      })
    )

    const result = await registerAccount({
      code: 'RES-ABC123',
      email: 'g@example.ch',
      password: 'my-password',
    })
    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.AUTH_ROLE_ALREADY_LINKED })
  })
})

describe('loginWithEmail', () => {
  it('returns EVERY identity the account carries', async () => {
    mockPrisma.account.findUnique.mockResolvedValue(
      account({
        passwordHash: ACCOUNT_HASH,
        user: STAFF,
        resident: RESIDENT,
      })
    )

    const result = await loginWithEmail({ email: 'g@example.ch', password: ACCOUNT_PASSWORD })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.identities.staff).toMatchObject({ id: 'user-1', role: 'ADMIN' })
    expect(result.identities.resident).toEqual({ id: 'res-1', code: 'RES-ABC123' })
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { lastLoginAt: expect.any(Date) },
    })
  })

  it('keeps resident access when the staff identity is deactivated', async () => {
    mockPrisma.account.findUnique.mockResolvedValue(
      account({
        passwordHash: ACCOUNT_HASH,
        user: { ...STAFF, active: false },
        resident: RESIDENT,
      })
    )

    const result = await loginWithEmail({ email: 'g@example.ch', password: ACCOUNT_PASSWORD })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.identities.staff).toBeUndefined()
    expect(result.identities.resident).toEqual({ id: 'res-1', code: 'RES-ABC123' })
  })

  it.each([
    ['unknown email', () => {}],
    [
      'wrong password',
      async () => {
        mockPrisma.account.findUnique.mockResolvedValue(
          account({ passwordHash: ACCOUNT_HASH, user: STAFF })
        )
      },
    ],
    [
      'account without a password',
      () => {
        mockPrisma.account.findUnique.mockResolvedValue(account({ user: STAFF }))
      },
    ],
    [
      'every identity deactivated',
      async () => {
        mockPrisma.account.findUnique.mockResolvedValue(
          account({ passwordHash: ACCOUNT_HASH, user: { ...STAFF, active: false } })
        )
      },
    ],
  ])('fails with ONE generic message for %s (no enumeration)', async (_case, setup) => {
    await setup()
    const result = await loginWithEmail({ email: 'g@example.ch', password: 'correct-password' })
    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.INVALID_CREDENTIALS })
  })
})

describe('requestPasswordReset', () => {
  it('REFUSES loudly when the deployment cannot send email (no silent lockout)', async () => {
    mockEmailConfig.enabled = false
    const result = await requestPasswordReset('g@example.ch')
    expect(result).toEqual({
      success: false,
      error: ERROR_MESSAGES.AUTH_EMAIL_NOT_CONFIGURED,
    })
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('sends a reset link to an existing account', async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ id: 'acc-1' })
    const result = await requestPasswordReset('g@example.ch')
    expect(result).toEqual({ success: true })
    expect(mockCreateAuthToken).toHaveBeenCalledWith('acc-1', 'RESET_PASSWORD')
    const [to, , html] = mockSendEmail.mock.calls[0]
    expect(to).toEqual(['g@example.ch'])
    expect(html).toContain('/reset-password?token=raw-token')
  })

  it('returns the SAME success for an unknown email, without sending', async () => {
    const result = await requestPasswordReset('nobody@example.ch')
    expect(result).toEqual({ success: true })
    expect(mockSendEmail).not.toHaveBeenCalled()
  })
})

describe('resetPassword', () => {
  it('sets a new hash and marks the email verified (mailbox control proven)', async () => {
    mockConsumeAuthToken.mockResolvedValue('acc-1')
    const result = await resetPassword('raw-token', 'new-password-123')
    expect(result).toEqual({ success: true })

    const update = mockPrisma.account.update.mock.calls[0][0]
    expect(update.where).toEqual({ id: 'acc-1' })
    expect(update.data.passwordHash).toMatch(/^\$2[aby]\$/)
    expect(update.data.emailVerifiedAt).toBeInstanceOf(Date)
  })

  it('rejects an invalid or expired token', async () => {
    mockConsumeAuthToken.mockResolvedValue(null)
    const result = await resetPassword('raw-token', 'new-password-123')
    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.AUTH_RESET_TOKEN_INVALID })
    expect(mockPrisma.account.update).not.toHaveBeenCalled()
  })
})
