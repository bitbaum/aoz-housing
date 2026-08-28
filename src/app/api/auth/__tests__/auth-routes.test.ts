/**
 * Tests for auth API routes:
 * - POST /api/auth/logout
 * - GET  /api/auth/session
 * - POST /api/auth/register (admin-only staff provisioning)
 */

import { NextRequest } from 'next/server'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// --- Mocks ---

const mockClearSessionCookie = jest.fn()
const mockGetCurrentUser = jest.fn()
jest.mock('@/lib/auth', () => ({
  clearSessionCookie: (...args: unknown[]) => mockClearSessionCookie(...args),
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    errorWithCause: jest.fn(),
  },
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

// --- Import after mocks ---
import { POST as logoutPOST } from '../logout/route'
import { GET as sessionGET } from '../session/route'
import { POST as registerPOST } from '../register/route'
import { BRAND } from '@/lib/config/brand'

// --- Helpers ---

function createJsonRequest(
  url: string,
  body: Record<string, unknown>,
): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

const ADMIN_USER = {
  id: 'user-1',
  email: 'admin@aoz.ch',
  name: 'Test Admin',
  role: 'ADMIN' as const,
}

// --- Tests ---

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls clearSessionCookie(true) and returns success', async () => {
    mockClearSessionCookie.mockResolvedValue(undefined)

    const res = await logoutPOST()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockClearSessionCookie).toHaveBeenCalledWith(true)
  })

  test('returns 500 when clearSessionCookie throws', async () => {
    mockClearSessionCookie.mockRejectedValue(new Error('Cookie error'))

    const res = await logoutPOST()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
  })

  test('returns success even when called multiple times', async () => {
    mockClearSessionCookie.mockResolvedValue(undefined)

    const res1 = await logoutPOST()
    const res2 = await logoutPOST()

    expect((await res1.json()).success).toBe(true)
    expect((await res2.json()).success).toBe(true)
    expect(mockClearSessionCookie).toHaveBeenCalledTimes(2)
  })
})

describe('GET /api/auth/session', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns current user when authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(ADMIN_USER)

    const res = await sessionGET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.user).toEqual(ADMIN_USER)
  })

  test('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const res = await sessionGET()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.NOT_AUTHENTICATED)
  })

  test('excludes sensitive fields like passwordHash', async () => {
    mockGetCurrentUser.mockResolvedValue(ADMIN_USER)

    const res = await sessionGET()
    const body = await res.json()

    expect(body.user).not.toHaveProperty('passwordHash')
    expect(body.user).not.toHaveProperty('password')
    expect(Object.keys(body.user).sort()).toEqual(['email', 'id', 'name', 'role'])
  })

  test('returns 500 on unexpected server error', async () => {
    mockGetCurrentUser.mockRejectedValue(new Error('Database down'))

    const res = await sessionGET()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.SESSION_ERROR)
  })
})

describe('POST /api/auth/register (admin-only staff provisioning)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: authenticated admin
    mockGetCurrentUser.mockResolvedValue(ADMIN_USER)
  })

  test('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { name: 'New Staff' }
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.AUTH_REQUIRED)
  })

  test('returns 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost:3001/api/auth/register', {
      method: 'POST',
      body: 'not json',
      headers: { 'content-type': 'application/json' },
    })

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.INVALID_REQUEST)
  })

  test('returns 400 when name is missing', async () => {
    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      {}
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toContain('Name')
  })

  test('returns 400 when name is too short', async () => {
    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { name: 'X' }
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  test('returns 400 when code does not start with the brand prefix', async () => {
    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { name: 'New Staff', code: 'RES-ABC123' }
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toContain(BRAND.codePrefix)
  })

  test('creates staff user with provided code', async () => {
    mockUserFindUnique.mockResolvedValue(null) // code not taken
    // No role in the request, so the new account gets the NARROWEST one.
    // This previously expected ADMIN, pinning in place the behaviour that made
    // every one of the 23 staff accounts in production a Leitung.
    mockUserCreate.mockResolvedValue({
      id: 'new-1',
      code: `${BRAND.codePrefix}CUSTOM`,
      name: 'New Staff',
      role: 'BETREUUNG',
    })

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { name: 'New Staff', code: `${BRAND.codePrefix}CUSTOM` }
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.user.code).toBe(`${BRAND.codePrefix}CUSTOM`)
    expect(body.user.name).toBe('New Staff')
    expect(body.user.role).toBe('BETREUUNG')

    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code: `${BRAND.codePrefix}CUSTOM`,
          name: 'New Staff',
          role: 'BETREUUNG',
          active: true,
        }),
      })
    )
  })

  test('generates code when none provided', async () => {
    // First findUnique (code gen check) returns null (code available)
    mockUserFindUnique
      .mockResolvedValueOnce(null) // generated code is free
      .mockResolvedValueOnce(null) // uniqueness check passes
    mockUserCreate.mockResolvedValue({
      id: 'new-2',
      code: `${BRAND.codePrefix}GEN001`,
      name: 'Auto Code',
      role: 'ADMIN',
    })

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { name: 'Auto Code' }
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.user.name).toBe('Auto Code')
  })

  test('returns 409 when code already exists', async () => {
    // For provided code: uniqueness check finds existing user
    mockUserFindUnique.mockResolvedValue({ id: 'existing' })

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { name: 'Duplicate', code: `${BRAND.codePrefix}EXISTS` }
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.success).toBe(false)
  })

  test('returns 500 when all code generation attempts fail', async () => {
    // All generated codes collide
    mockUserFindUnique.mockResolvedValue({ id: 'existing' })

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { name: 'No Code Available' }
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.CODE_GENERATION_ERROR)
  })

  test('returns 500 when database create fails', async () => {
    mockUserFindUnique.mockResolvedValue(null) // code available
    mockUserCreate.mockRejectedValue(new Error('DB error'))

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { name: 'DB Fail', code: `${BRAND.codePrefix}DBFAIL` }
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.SAVE_ERROR)
  })

  test('uppercases provided code', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    mockUserCreate.mockResolvedValue({
      id: 'new-3',
      code: `${BRAND.codePrefix}LOWER1`,
      name: 'Lower',
      role: 'ADMIN',
    })

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { name: 'Lower', code: `${BRAND.codePrefix.toLowerCase()}lower1` }
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ code: `${BRAND.codePrefix}LOWER1` }),
      })
    )
  })

  test('trims name before storing', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    mockUserCreate.mockResolvedValue({
      id: 'new-4',
      code: `${BRAND.codePrefix}TRIM01`,
      name: 'Trimmed Name',
      role: 'ADMIN',
    })

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { name: '  Trimmed Name  ', code: `${BRAND.codePrefix}TRIM01` }
    )

    await registerPOST(req)

    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Trimmed Name' }),
      })
    )
  })
})
