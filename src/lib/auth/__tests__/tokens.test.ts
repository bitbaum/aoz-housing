/**
 * Tests for the email-flow tokens (lib/auth/tokens.ts): hashing at rest,
 * invalidation of earlier tokens, and every consume failure mode.
 */

const mockPrisma = vi.hoisted(() => ({
  authToken: {
    deleteMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}))
vi.mock('@/lib/db', () => ({ prisma: mockPrisma }))

import { createAuthToken, consumeAuthToken, hashAuthToken } from '../tokens'

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma.authToken.create.mockResolvedValue({})
  mockPrisma.authToken.deleteMany.mockResolvedValue({ count: 0 })
  mockPrisma.authToken.update.mockResolvedValue({})
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
    const stored = mockPrisma.authToken.create.mock.calls[0][0].data
    expect(stored.tokenHash).toBe(hashAuthToken(raw))
    expect(stored.tokenHash).not.toBe(raw)
    expect(JSON.stringify(stored)).not.toContain(raw)
  })

  it('invalidates earlier tokens for the same account + purpose', async () => {
    await createAuthToken('acc-2', 'VERIFY_EMAIL')
    expect(mockPrisma.authToken.deleteMany).toHaveBeenCalledWith({
      where: { accountId: 'acc-2', purpose: 'VERIFY_EMAIL' },
    })
  })

  it('gives reset tokens a 1-hour expiry', async () => {
    const before = Date.now()
    await createAuthToken('acc-1', 'RESET_PASSWORD')
    const stored = mockPrisma.authToken.create.mock.calls[0][0].data
    const ttl = stored.expiresAt.getTime() - before
    expect(ttl).toBeGreaterThan(59 * 60 * 1000)
    expect(ttl).toBeLessThanOrEqual(60 * 60 * 1000 + 1000)
  })
})

describe('consumeAuthToken', () => {
  it('marks a valid token used and returns its account', async () => {
    mockPrisma.authToken.findUnique.mockResolvedValue(validTokenRow())
    expect(await consumeAuthToken('raw', 'RESET_PASSWORD')).toBe('acc-1')
    expect(mockPrisma.authToken.update).toHaveBeenCalledWith({
      where: { id: 'tok-1' },
      data: { usedAt: expect.any(Date) },
    })
  })

  it('rejects an unknown token', async () => {
    mockPrisma.authToken.findUnique.mockResolvedValue(null)
    expect(await consumeAuthToken('raw', 'RESET_PASSWORD')).toBeNull()
  })

  it('rejects a token issued for a DIFFERENT purpose', async () => {
    mockPrisma.authToken.findUnique.mockResolvedValue(validTokenRow({ purpose: 'VERIFY_EMAIL' }))
    expect(await consumeAuthToken('raw', 'RESET_PASSWORD')).toBeNull()
    expect(mockPrisma.authToken.update).not.toHaveBeenCalled()
  })

  it('rejects an expired token', async () => {
    mockPrisma.authToken.findUnique.mockResolvedValue(
      validTokenRow({ expiresAt: new Date(Date.now() - 1000) }),
    )
    expect(await consumeAuthToken('raw', 'RESET_PASSWORD')).toBeNull()
  })

  it('rejects an already-used token (single use)', async () => {
    mockPrisma.authToken.findUnique.mockResolvedValue(validTokenRow({ usedAt: new Date() }))
    expect(await consumeAuthToken('raw', 'RESET_PASSWORD')).toBeNull()
  })

  it('returns whichever account the token belongs to', async () => {
    mockPrisma.authToken.findUnique.mockResolvedValue(validTokenRow({ accountId: 'acc-9' }))
    expect(await consumeAuthToken('raw', 'RESET_PASSWORD')).toBe('acc-9')
  })
})
