/**
 * Tests for the email-flow tokens (lib/auth/tokens.ts): hashing at rest,
 * invalidation of earlier tokens, and every consume failure mode.
 */

const mockAuthTokenFindFirst = jest.fn()
const mockInsertValues = jest.fn()
// (whereParts) — the delete that invalidates earlier tokens
const mockDeleteWhere = jest.fn()
// (data, whereParts)
const mockUpdate = jest.fn()

jest.mock('@/lib/db', () => ({
  ...jest.requireActual<object>('@/lib/db'),
  db: {
    query: {
      authToken: { findFirst: (...a: unknown[]) => mockAuthTokenFindFirst(...a) },
    },
    insert: () => ({ values: (v: unknown) => Promise.resolve(mockInsertValues(v)) }),
    delete: () => ({
      where: (w: unknown) => Promise.resolve(mockDeleteWhere(mockWhereParts(w))),
    }),
    update: () => ({
      set: (data: unknown) => ({
        where: (w: unknown) => Promise.resolve(mockUpdate(data, mockWhereParts(w))),
      }),
    }),
  },
}))

import { createAuthToken, consumeAuthToken, hashAuthToken } from '../tokens'
import { whereParts as mockWhereParts } from '@/test-utils/drizzle-where'

beforeEach(() => {
  jest.clearAllMocks()
  mockInsertValues.mockResolvedValue(undefined)
  mockDeleteWhere.mockResolvedValue(undefined)
  mockUpdate.mockResolvedValue(undefined)
})

function validTokenRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tok-1',
    purpose: 'RESET_PASSWORD',
    expiresAt: new Date(Date.now() + 60_000),
    usedAt: null,
    accountId: 'acc-1',
    ...overrides,
  }
}

describe('createAuthToken', () => {
  it('stores only the SHA-256 hash, never the raw token', async () => {
    const raw = await createAuthToken('acc-1', 'RESET_PASSWORD')
    const stored = mockInsertValues.mock.calls[0][0]
    expect(stored.tokenHash).toBe(hashAuthToken(raw))
    expect(stored.tokenHash).not.toBe(raw)
    expect(JSON.stringify(stored)).not.toContain(raw)
  })

  it('invalidates earlier tokens for the same account + purpose', async () => {
    await createAuthToken('acc-2', 'VERIFY_EMAIL')
    expect(mockDeleteWhere).toHaveBeenCalledWith({
      accountId: 'acc-2',
      purpose: 'VERIFY_EMAIL',
    })
  })

  it('gives reset tokens a 1-hour expiry', async () => {
    const before = Date.now()
    await createAuthToken('acc-1', 'RESET_PASSWORD')
    const stored = mockInsertValues.mock.calls[0][0]
    const ttl = stored.expiresAt.getTime() - before
    expect(ttl).toBeGreaterThan(59 * 60 * 1000)
    expect(ttl).toBeLessThanOrEqual(60 * 60 * 1000 + 1000)
  })
})

describe('consumeAuthToken', () => {
  it('marks a valid token used and returns its account', async () => {
    mockAuthTokenFindFirst.mockResolvedValue(validTokenRow())
    expect(await consumeAuthToken('raw', 'RESET_PASSWORD')).toBe('acc-1')
    expect(mockUpdate).toHaveBeenCalledWith({ usedAt: expect.any(Date) }, { id: 'tok-1' })
  })

  it('rejects an unknown token', async () => {
    mockAuthTokenFindFirst.mockResolvedValue(null)
    expect(await consumeAuthToken('raw', 'RESET_PASSWORD')).toBeNull()
  })

  it('rejects a token issued for a DIFFERENT purpose', async () => {
    mockAuthTokenFindFirst.mockResolvedValue(validTokenRow({ purpose: 'VERIFY_EMAIL' }))
    expect(await consumeAuthToken('raw', 'RESET_PASSWORD')).toBeNull()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('rejects an expired token', async () => {
    mockAuthTokenFindFirst.mockResolvedValue(
      validTokenRow({ expiresAt: new Date(Date.now() - 1000) }),
    )
    expect(await consumeAuthToken('raw', 'RESET_PASSWORD')).toBeNull()
  })

  it('rejects an already-used token (single use)', async () => {
    mockAuthTokenFindFirst.mockResolvedValue(validTokenRow({ usedAt: new Date() }))
    expect(await consumeAuthToken('raw', 'RESET_PASSWORD')).toBeNull()
  })

  it('returns whichever account the token belongs to', async () => {
    mockAuthTokenFindFirst.mockResolvedValue(validTokenRow({ accountId: 'acc-9' }))
    expect(await consumeAuthToken('raw', 'RESET_PASSWORD')).toBe('acc-9')
  })
})
