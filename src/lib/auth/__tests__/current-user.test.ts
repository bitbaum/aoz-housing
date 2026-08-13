/**
 * getCurrentUser must validate the ACCOUNT, not just the token.
 *
 * Regression: a deactivated user's JWT kept working until expiry — and with
 * sliding refresh, indefinitely. Observed live: the retired demo account
 * ("Demo-Zugang") stayed signed in after being set active=false.
 */

const mockCookieGet = jest.fn()
jest.mock('next/headers', () => ({
  cookies: async () => ({ get: (...args: unknown[]) => mockCookieGet(...args) }),
}))

const mockVerifyToken = jest.fn()
jest.mock('../jwt', () => ({
  createToken: jest.fn(),
  verifyToken: (...args: unknown[]) => mockVerifyToken(...args),
  shouldRefreshToken: jest.fn(),
  refreshToken: jest.fn(),
}))

const mockUserFindUnique = jest.fn()
jest.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => mockUserFindUnique(...args) },
    resident: { findUnique: jest.fn() },
  },
}))

import { getCurrentUser } from '../index'

const PAYLOAD = { sub: 'user-1', email: '', name: 'Demo-Zugang', role: 'ADMIN' }

beforeEach(() => {
  jest.clearAllMocks()
  mockCookieGet.mockReturnValue({ value: 'a-valid-token' })
  mockVerifyToken.mockResolvedValue(PAYLOAD)
})

describe('getCurrentUser', () => {
  it('returns the user for a valid token and an active account', async () => {
    mockUserFindUnique.mockResolvedValue({ active: true })
    const user = await getCurrentUser()
    expect(user).toEqual({ id: 'user-1', email: '', name: 'Demo-Zugang', role: 'ADMIN' })
  })

  it('rejects a valid token whose account was deactivated', async () => {
    mockUserFindUnique.mockResolvedValue({ active: false })
    expect(await getCurrentUser()).toBeNull()
  })

  it('rejects a valid token whose account no longer exists', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    expect(await getCurrentUser()).toBeNull()
  })

  it('returns null without a cookie', async () => {
    mockCookieGet.mockReturnValue(undefined)
    expect(await getCurrentUser()).toBeNull()
    expect(mockUserFindUnique).not.toHaveBeenCalled()
  })

  it('returns null for an invalid token without touching the database', async () => {
    mockVerifyToken.mockResolvedValue(null)
    expect(await getCurrentUser()).toBeNull()
    expect(mockUserFindUnique).not.toHaveBeenCalled()
  })
})
