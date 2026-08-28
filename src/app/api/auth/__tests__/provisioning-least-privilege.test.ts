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

const mockGetCurrentUser = jest.fn()
jest.mock('@/lib/auth', () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}))

jest.mock('@/lib/auth/code-generation', () => ({
  generateStaffCode: jest.fn(() => 'AOZ-GEN001'),
}))

const mockUserFindUnique = jest.fn()
const mockUserCreate = jest.fn()
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      create: (...args: unknown[]) => mockUserCreate(...args),
    },
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), errorWithCause: jest.fn() },
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
  jest.clearAllMocks()
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
    mockGetCurrentUser.mockResolvedValue({ id: 'u9', role: 'JOBCOACH' })

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
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'ADMIN' })

    await POST(post({ name: 'Neue Person' }))

    expect(mockUserCreate).toHaveBeenCalledTimes(1)
    const [args] = mockUserCreate.mock.calls[0]
    expect(args.data.role).toBe('BETREUUNG')
    expect(args.data.role).not.toBe('ADMIN')
  })

  it('still allows Leitung to be granted when it is asked for explicitly', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'ADMIN' })

    await POST(post({ name: 'Neue Person', role: 'ADMIN' }))

    const [args] = mockUserCreate.mock.calls[0]
    expect(args.data.role).toBe('ADMIN')
  })

  it('rejects a role it does not recognise rather than falling back', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', role: 'ADMIN' })

    const response = await POST(post({ name: 'Neue Person', role: 'SUPERUSER' }))

    expect(response.status).toBe(400)
    expect(mockUserCreate).not.toHaveBeenCalled()
  })

  it('keeps the error generic enough not to confirm anything', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u9', role: 'SOZIALARBEIT' })

    const response = await POST(post({ name: 'Neue Person' }))
    const body = await response.json()

    expect(body.error).toBe(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS)
  })
})
