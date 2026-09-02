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

const mockUserFindFirst = jest.fn()
jest.mock('@/lib/db', () => ({
  // Keep the real tables/enums/helpers; fake only the client.
  ...jest.requireActual<object>('@/lib/db'),
  db: {
    query: {
      user: { findFirst: (...args: unknown[]) => mockUserFindFirst(...args) },
      resident: { findFirst: jest.fn() },
    },
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
    // The mock is a ROW, so it carries what getCurrentUser selects. It used to
    // be `{ active: true }` alone, which passed only because the function read
    // nothing else off the row — every field added since is a fact this test
    // should be asserting travels.
    mockUserFindFirst.mockResolvedValue({
      active: true,
      scope: 'ALL_DOMAINS',
      isSystemAdmin: true,
      siteAccess: 'ALL_UNITS',
      unitAccess: [],
    })
    const user = await getCurrentUser()
    expect(user).toEqual({
      id: 'user-1',
      email: '',
      name: 'Demo-Zugang',
      role: 'ADMIN',
      scope: 'ALL_DOMAINS',
      isSystemAdmin: true,
      siteAccess: 'ALL_UNITS',
      assignedUnitIds: [],
    })
  })

  it('carries the assigned units for a site-restricted viewer', async () => {
    // The branch that actually reads the join. `siteAccess` and the unit ids
    // come from the ROW for the same reason `scope` does: a privilege in a JWT
    // goes stale, and with sliding refresh "stale" means indefinitely —
    // revoking somebody's reach has to take effect on the next request.
    mockUserFindFirst.mockResolvedValue({
      active: true,
      scope: 'OWN_DOMAIN',
      isSystemAdmin: false,
      siteAccess: 'ASSIGNED_UNITS',
      unitAccess: [{ housingUnitId: 'unit-a' }, { housingUnitId: 'unit-b' }],
    })

    const user = await getCurrentUser()
    expect(user?.siteAccess).toBe('ASSIGNED_UNITS')
    expect(user?.assignedUnitIds).toEqual(['unit-a', 'unit-b'])
  })

  it('does not throw when a caller forgot to select the join', async () => {
    // Impossible in production — the column is NOT NULL with a default — but
    // this is the auth path. An incomplete select must narrow someone's reach,
    // never take the request down.
    mockUserFindFirst.mockResolvedValue({
      active: true,
      scope: 'OWN_DOMAIN',
      isSystemAdmin: false,
      siteAccess: 'ASSIGNED_UNITS',
    })

    const user = await getCurrentUser()
    expect(user?.assignedUnitIds).toEqual([])
  })

  it('rejects a valid token whose account was deactivated', async () => {
    mockUserFindFirst.mockResolvedValue({ active: false })
    expect(await getCurrentUser()).toBeNull()
  })

  it('rejects a valid token whose account no longer exists', async () => {
    mockUserFindFirst.mockResolvedValue(null)
    expect(await getCurrentUser()).toBeNull()
  })

  it('returns null without a cookie', async () => {
    mockCookieGet.mockReturnValue(undefined)
    expect(await getCurrentUser()).toBeNull()
    expect(mockUserFindFirst).not.toHaveBeenCalled()
  })

  it('returns null for an invalid token without touching the database', async () => {
    mockVerifyToken.mockResolvedValue(null)
    expect(await getCurrentUser()).toBeNull()
    expect(mockUserFindFirst).not.toHaveBeenCalled()
  })
})
