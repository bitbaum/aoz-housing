/**
 * Tests for the account flows (lib/auth/account.ts): register-with-code,
 * email login, and password reset — including the anti-enumeration and
 * email-not-configured guarantees.
 */

const mockPrisma = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  resident: { findUnique: jest.fn(), update: jest.fn() },
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

import {
  registerAccount,
  loginWithEmail,
  requestPasswordReset,
  resetPassword,
} from '../account'
import { hashPassword } from '../passwords'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

beforeEach(() => {
  jest.clearAllMocks()
  mockEmailConfig.enabled = true
  mockPrisma.user.findUnique.mockResolvedValue(null)
  mockPrisma.resident.findUnique.mockResolvedValue(null)
  mockPrisma.user.update.mockResolvedValue({})
  mockPrisma.resident.update.mockResolvedValue({})
  mockCreateAuthToken.mockResolvedValue('raw-token')
  mockSendEmail.mockResolvedValue(true)
})

const STAFF = {
  id: 'user-1',
  code: 'AOZ-ADMIN1',
  name: 'Admin',
  email: null as string | null,
  role: 'ADMIN',
  active: true,
  passwordHash: null as string | null,
}

const RESIDENT = {
  id: 'res-1',
  code: 'RES-ABC123',
  passwordHash: null as string | null,
}

describe('registerAccount', () => {
  it('claims a staff code: stores email + bcrypt hash, sends verification', async () => {
    mockPrisma.user.findUnique.mockImplementation(({ where }: { where: Record<string, unknown> }) =>
      Promise.resolve(where.code === 'AOZ-ADMIN1' ? STAFF : null)
    )

    const result = await registerAccount({
      code: 'AOZ-ADMIN1',
      email: 'g@example.ch',
      password: 'secret-password',
    })

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.identity).toMatchObject({ type: 'staff', code: 'AOZ-ADMIN1' })

    const update = mockPrisma.user.update.mock.calls[0][0].data
    expect(update.email).toBe('g@example.ch')
    expect(update.passwordHash).toMatch(/^\$2[aby]\$/)
    expect(update.passwordHash).not.toBe('secret-password')

    expect(mockCreateAuthToken).toHaveBeenCalledWith({ userId: 'user-1' }, 'VERIFY_EMAIL')
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })

  it('claims a resident code and returns the resident identity', async () => {
    mockPrisma.resident.findUnique.mockImplementation(
      ({ where }: { where: Record<string, unknown> }) =>
        Promise.resolve(where.code === 'RES-ABC123' ? RESIDENT : null)
    )

    const result = await registerAccount({
      code: 'RES-ABC123',
      email: 'ihor@example.ch',
      password: 'secret-password',
    })

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.identity).toEqual({ type: 'resident', id: 'res-1', code: 'RES-ABC123' })
    expect(mockCreateAuthToken).toHaveBeenCalledWith({ residentId: 'res-1' }, 'VERIFY_EMAIL')
  })

  it('rejects an unknown code', async () => {
    const result = await registerAccount({
      code: 'RES-NOPE',
      email: 'x@example.ch',
      password: 'secret-password',
    })
    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.AUTH_CODE_UNKNOWN })
  })

  it('rejects a code that already carries credentials (use password reset)', async () => {
    mockPrisma.resident.findUnique.mockImplementation(
      ({ where }: { where: Record<string, unknown> }) =>
        Promise.resolve(where.code === 'RES-ABC123' ? { ...RESIDENT, passwordHash: 'x' } : null)
    )
    const result = await registerAccount({
      code: 'RES-ABC123',
      email: 'x@example.ch',
      password: 'secret-password',
    })
    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.AUTH_ALREADY_REGISTERED })
  })

  it('rejects an email already owned by ANOTHER identity (cross-table)', async () => {
    // Registering resident RES-ABC123 with an email that a staff account owns.
    mockPrisma.resident.findUnique.mockImplementation(
      ({ where }: { where: Record<string, unknown> }) =>
        Promise.resolve(where.code === 'RES-ABC123' ? RESIDENT : null)
    )
    mockPrisma.user.findUnique.mockImplementation(({ where }: { where: Record<string, unknown> }) =>
      Promise.resolve(where.email === 'taken@example.ch' ? { ...STAFF, email: 'taken@example.ch' } : null)
    )

    const result = await registerAccount({
      code: 'RES-ABC123',
      email: 'taken@example.ch',
      password: 'secret-password',
    })
    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.AUTH_EMAIL_TAKEN })
  })

  it('allows a staff account to register with its OWN pre-attached email', async () => {
    const staffWithEmail = { ...STAFF, email: 'g@example.ch' }
    mockPrisma.user.findUnique.mockImplementation(({ where }: { where: Record<string, unknown> }) =>
      Promise.resolve(
        where.code === 'AOZ-ADMIN1' || where.email === 'g@example.ch' ? staffWithEmail : null
      )
    )

    const result = await registerAccount({
      code: 'AOZ-ADMIN1',
      email: 'g@example.ch',
      password: 'secret-password',
    })
    expect(result.success).toBe(true)
  })

  it('still succeeds when the verification email fails to send', async () => {
    mockPrisma.user.findUnique.mockImplementation(({ where }: { where: Record<string, unknown> }) =>
      Promise.resolve(where.code === 'AOZ-ADMIN1' ? STAFF : null)
    )
    mockSendEmail.mockRejectedValue(new Error('smtp down'))

    const result = await registerAccount({
      code: 'AOZ-ADMIN1',
      email: 'g@example.ch',
      password: 'secret-password',
    })
    expect(result.success).toBe(true)
  })
})

describe('loginWithEmail', () => {
  it('logs a staff account in with the right password', async () => {
    const hash = await hashPassword('correct-password')
    mockPrisma.user.findUnique.mockResolvedValue({
      ...STAFF,
      email: 'g@example.ch',
      passwordHash: hash,
    })

    const result = await loginWithEmail({ email: 'g@example.ch', password: 'correct-password' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.identity.type).toBe('staff')
  })

  it('logs a resident in and yields the code for the portal cookie', async () => {
    const hash = await hashPassword('correct-password')
    mockPrisma.resident.findUnique.mockResolvedValue({ ...RESIDENT, passwordHash: hash })

    const result = await loginWithEmail({ email: 'ihor@example.ch', password: 'correct-password' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.identity).toEqual({ type: 'resident', id: 'res-1', code: 'RES-ABC123' })
  })

  it.each([
    ['unknown email', () => {}],
    [
      'wrong password',
      async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          ...STAFF,
          email: 'g@example.ch',
          passwordHash: await hashPassword('other-password'),
        })
      },
    ],
    [
      'account without a password',
      () => {
        mockPrisma.user.findUnique.mockResolvedValue({ ...STAFF, email: 'g@example.ch' })
      },
    ],
    [
      'deactivated staff account',
      async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          ...STAFF,
          email: 'g@example.ch',
          active: false,
          passwordHash: await hashPassword('correct-password'),
        })
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
    mockPrisma.user.findUnique.mockResolvedValue({ ...STAFF, email: 'g@example.ch' })
    const result = await requestPasswordReset('g@example.ch')
    expect(result).toEqual({ success: true })
    expect(mockCreateAuthToken).toHaveBeenCalledWith({ userId: 'user-1' }, 'RESET_PASSWORD')
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
    mockConsumeAuthToken.mockResolvedValue({ userId: 'user-1' })
    const result = await resetPassword('raw-token', 'new-password-123')
    expect(result).toEqual({ success: true })

    const update = mockPrisma.user.update.mock.calls[0][0]
    expect(update.where).toEqual({ id: 'user-1' })
    expect(update.data.passwordHash).toMatch(/^\$2[aby]\$/)
    expect(update.data.emailVerifiedAt).toBeInstanceOf(Date)
  })

  it('resets resident passwords through the same flow', async () => {
    mockConsumeAuthToken.mockResolvedValue({ residentId: 'res-1' })
    const result = await resetPassword('raw-token', 'new-password-123')
    expect(result).toEqual({ success: true })
    expect(mockPrisma.resident.update).toHaveBeenCalled()
  })

  it('rejects an invalid or expired token', async () => {
    mockConsumeAuthToken.mockResolvedValue(null)
    const result = await resetPassword('raw-token', 'new-password-123')
    expect(result).toEqual({ success: false, error: ERROR_MESSAGES.AUTH_RESET_TOKEN_INVALID })
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })
})
