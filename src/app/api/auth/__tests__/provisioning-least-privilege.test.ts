/**
 * Provisioning must never hand out Leitung by omission.
 *
 * `/api/auth/register` checked only that the caller was signed in — its own
 * docstring said "admin-only" — and then hardcoded `role: 'ADMIN'` on the row
 * it created. Two consequences, neither of which shows up as a failure:
 *
 *   1. Any authenticated staff member could mint themselves a Leitung account.
 *      A Jobcoach calling this endpoint got every permission in the product.
 *   2. Every account it ever created was Leitung. In production all 23 staff
 *      accounts are ADMIN, which is why role-based access had no subjects to
 *      differentiate — each boundary was correct and applied to nobody.
 *
 * `/api/auth/invite` had always done both correctly. The two provisioning
 * paths simply disagreed, and nothing compared them. This gate compares them.
 */

import { NextRequest } from 'next/server'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

const mockGetCurrentUser = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth', () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}))

vi.mock('@/lib/auth/code-generation', () => ({
  generateStaffCode: vi.fn(() => 'AOZ-GEN001'),
}))

const mockUserFindUnique = vi.hoisted(() => vi.fn())
const mockUserCreate = vi.hoisted(() => vi.fn())
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      create: (...args: unknown[]) => mockUserCreate(...args),
    },
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), errorWithCause: vi.fn() },
}))

import { POST } from '../register/route'

function post(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUserFindUnique.mockResolvedValue(null)
  mockUserCreate.mockResolvedValue({
    id: 'u1',
    code: 'AOZ-GEN001',
    name: 'Neue Person',
    role: 'BETREUUNG',
  })
})

describe('staff provisioning', () => {
  it('refuses a caller who may not manage users', async () => {
    // The narrowest role, which is exactly who this used to let through.
    mockGetCurrentUser.mockResolvedValue({
      id: 'u9',
      role: 'JOBCOACH',
      scope: 'OWN_DOMAIN',
      isSystemAdmin: false,
    })

    const response = await POST(post({ name: 'Neue Person' }))

    expect(response.status).toBe(403)
    expect(mockUserCreate).not.toHaveBeenCalled()
  })

  it('refuses an unauthenticated caller', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const response = await POST(post({ name: 'Neue Person' }))

    expect(response.status).toBe(401)
    expect(mockUserCreate).not.toHaveBeenCalled()
  })

  it('gives an unspecified role the NARROWEST role, never Leitung', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'u1',
      role: 'ADMIN',
      scope: 'ALL_DOMAINS',
      isSystemAdmin: true,
    })

    await POST(post({ name: 'Neue Person' }))

    expect(mockUserCreate).toHaveBeenCalledTimes(1)
    const [args] = mockUserCreate.mock.calls[0]
    expect(args.data.role).toBe('BETREUUNG')
    expect(args.data.role).not.toBe('ADMIN')
  })

  it('refuses the retired all-in-one role even when asked for explicitly', async () => {
    // ADMIN is still a valid enum value so existing rows and live JWTs resolve,
    // but nothing may mint a new one: what it granted is now `scope` and
    // `isSystemAdmin`, which can be given to any role.
    mockGetCurrentUser.mockResolvedValue({
      id: 'u1',
      role: 'ADMIN',
      scope: 'ALL_DOMAINS',
      isSystemAdmin: true,
    })

    const response = await POST(post({ name: 'Neue Person', role: 'ADMIN' }))

    expect(response.status).toBe(400)
    expect(mockUserCreate).not.toHaveBeenCalled()
  })

  it('defaults BOTH new axes to the narrow answer', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'u1',
      role: 'ADMIN',
      scope: 'ALL_DOMAINS',
      isSystemAdmin: true,
    })

    await POST(post({ name: 'Neue Person' }))

    const [args] = mockUserCreate.mock.calls[0]
    expect(args.data.scope).toBe('OWN_DOMAIN')
    expect(args.data.isSystemAdmin).toBe(false)
  })

  it('can describe Franziska: a Betreuerin who also sees everything', async () => {
    // The shape that was unexpressible before — her domain is housing AND she
    // sees every client, without being handed the settings page.
    mockGetCurrentUser.mockResolvedValue({
      id: 'u1',
      role: 'ADMIN',
      scope: 'ALL_DOMAINS',
      isSystemAdmin: true,
    })

    await POST(post({ name: 'Franziska Heimhuber', role: 'BETREUUNG', scope: 'ALL_DOMAINS' }))

    const [args] = mockUserCreate.mock.calls[0]
    expect(args.data.role).toBe('BETREUUNG')
    expect(args.data.scope).toBe('ALL_DOMAINS')
    expect(args.data.isSystemAdmin).toBe(false)
  })

  it('ignores a non-boolean isSystemAdmin rather than coercing it true', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'u1',
      role: 'ADMIN',
      scope: 'ALL_DOMAINS',
      isSystemAdmin: true,
    })

    await POST(post({ name: 'Neue Person', isSystemAdmin: 'yes' }))

    const [args] = mockUserCreate.mock.calls[0]
    expect(args.data.isSystemAdmin).toBe(false)
  })

  it('rejects a role it does not recognise rather than falling back', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'u1',
      role: 'ADMIN',
      scope: 'ALL_DOMAINS',
      isSystemAdmin: true,
    })

    const response = await POST(post({ name: 'Neue Person', role: 'SUPERUSER' }))

    expect(response.status).toBe(400)
    expect(mockUserCreate).not.toHaveBeenCalled()
  })

  it('keeps the error generic enough not to confirm anything', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'u9',
      role: 'SOZIALARBEIT',
      scope: 'ALL_DOMAINS',
      isSystemAdmin: false,
    })

    const response = await POST(post({ name: 'Neue Person' }))
    const body = await response.json()

    expect(body.error).toBe(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS)
  })
})
