/**
 * Tests for auth API routes:
 * - POST /api/auth/logout
 * - GET  /api/auth/session
 * - POST /api/auth/register
 *
 * Tests: logout success/error, session auth/unauth/field exclusion,
 * register rate-limit/validation/resident/staff/dual-profile/code-gen/hashing/cookie
 */

import { NextRequest } from 'next/server'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// --- Mocks ---

const mockClearSessionCookie = jest.fn()
const mockGetCurrentUser = jest.fn()
const mockSetSessionCookie = jest.fn()
jest.mock('@/lib/auth', () => ({
  clearSessionCookie: (...args: unknown[]) => mockClearSessionCookie(...args),
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
  setSessionCookie: (...args: unknown[]) => mockSetSessionCookie(...args),
}))

const mockHashPassword = jest.fn()
jest.mock('@/lib/auth/password', () => ({
  hashPassword: (...args: unknown[]) => mockHashPassword(...args),
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

const mockCookieSet = jest.fn()
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    set: (...args: unknown[]) => mockCookieSet(...args),
  }),
}))

const mockUserFindUnique = jest.fn()
const mockUserCreate = jest.fn()
const mockResidentFindFirst = jest.fn()
const mockResidentFindUnique = jest.fn()
const mockResidentCreate = jest.fn()
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      create: (...args: unknown[]) => mockUserCreate(...args),
    },
    resident: {
      findFirst: (...args: unknown[]) => mockResidentFindFirst(...args),
      findUnique: (...args: unknown[]) => mockResidentFindUnique(...args),
      create: (...args: unknown[]) => mockResidentCreate(...args),
    },
  },
}))

// --- Import after mocks ---
import { POST as logoutPOST } from '../logout/route'
import { GET as sessionGET } from '../session/route'
import { POST as registerPOST } from '../register/route'

// --- Helpers ---

function createJsonRequest(
  url: string,
  body: Record<string, unknown>,
  ip?: string
): NextRequest {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }
  if (ip) {
    headers['x-forwarded-for'] = ip
  }
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  })
}

function createGetRequest(url: string): NextRequest {
  return new NextRequest(url, { method: 'GET' })
}

const VALID_REGISTRATION = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'securepass123',
  inviteCode: '0000',
}

const STAFF_USER = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'CASE_WORKER' as const,
}

// --- Tests ---

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls clearSessionCookie and returns success', async () => {
    mockClearSessionCookie.mockResolvedValue(undefined)

    const res = await logoutPOST()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockClearSessionCookie).toHaveBeenCalledTimes(1)
  })

  test('returns 500 when clearSessionCookie throws', async () => {
    mockClearSessionCookie.mockRejectedValue(new Error('Cookie error'))

    const res = await logoutPOST()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.SESSION_ERROR)
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
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'admin@aoz.ch',
      name: 'Test Admin',
      role: 'ADMIN',
    })

    const req = createGetRequest('http://localhost:3001/api/auth/session')
    const res = await sessionGET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.user).toEqual({
      id: 'user-1',
      email: 'admin@aoz.ch',
      name: 'Test Admin',
      role: 'ADMIN',
    })
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
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'admin@aoz.ch',
      name: 'Test Admin',
      role: 'ADMIN',
    })

    const res = await sessionGET()
    const body = await res.json()

    expect(body.user).not.toHaveProperty('passwordHash')
    expect(body.user).not.toHaveProperty('password')
    // Only expected fields are present
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

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 429 when rate limited', async () => {
    // Use a unique IP and exhaust the rate limit (3 attempts + 1 over)
    const ip = `rate-limit-${Date.now()}`
    const url = 'http://localhost:3001/api/auth/register'

    // Set up mocks so the first 3 requests succeed (consume the limit)
    mockUserFindUnique.mockResolvedValue(null)
    mockHashPassword.mockResolvedValue('hashed')
    mockUserCreate.mockResolvedValue(STAFF_USER)
    mockSetSessionCookie.mockResolvedValue(undefined)
    mockResidentFindFirst.mockResolvedValue(null)
    mockResidentFindUnique.mockResolvedValue(null)
    mockResidentCreate.mockResolvedValue({ code: 'RES-ABC123' })

    // Exhaust rate limit
    for (let i = 0; i < 3; i++) {
      await registerPOST(createJsonRequest(url, VALID_REGISTRATION, ip))
    }

    // 4th attempt should be rate limited
    const res = await registerPOST(createJsonRequest(url, VALID_REGISTRATION, ip))
    const body = await res.json()

    expect(res.status).toBe(429)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.RATE_LIMITED)
  })

  test('returns 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost:3001/api/auth/register', {
      method: 'POST',
      body: 'not json',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': `json-${Date.now()}`,
      },
    })

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.INVALID_REQUEST)
  })

  test('returns 400 when required fields are missing', async () => {
    const ip = `missing-${Date.now()}`
    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { email: 'test@example.com' }, // missing name and password
      ip
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.REGISTRATION_FIELDS_REQUIRED_CORRECT)
    expect(body.details).toBeDefined()
  })

  test('returns 400 when email is invalid', async () => {
    const ip = `email-${Date.now()}`
    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { name: 'Test', email: 'not-an-email', password: 'securepass123' },
      ip
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  test('returns 400 when password is too short', async () => {
    const ip = `short-pw-${Date.now()}`
    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { name: 'Test', email: 'test@example.com', password: 'short' },
      ip
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  test('creates resident profile when no invite code is provided', async () => {
    const ip = `resident-${Date.now()}`
    mockResidentFindFirst.mockResolvedValue(null)
    mockResidentFindUnique.mockResolvedValue(null)
    mockResidentCreate.mockResolvedValue({ code: 'RES-ABC123' })

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { name: 'Resident', email: 'resident@example.com', password: 'securepass123' },
      ip
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.profileType).toBe('resident')
    expect(body.code).toBeDefined()
    // Should NOT call user create (staff) or setSessionCookie (staff session)
    expect(mockUserCreate).not.toHaveBeenCalled()
    expect(mockSetSessionCookie).not.toHaveBeenCalled()
  })

  test('creates resident profile when invite code is empty string', async () => {
    const ip = `empty-invite-${Date.now()}`
    mockResidentFindFirst.mockResolvedValue(null)
    mockResidentFindUnique.mockResolvedValue(null)
    mockResidentCreate.mockResolvedValue({ code: 'RES-XYZ789' })

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { name: 'Resident', email: 'resident2@example.com', password: 'securepass123', inviteCode: '' },
      ip
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.profileType).toBe('resident')
  })

  test('creates staff profile with valid invite code', async () => {
    const ip = `staff-${Date.now()}`
    mockUserFindUnique.mockResolvedValue(null)
    mockHashPassword.mockResolvedValue('hashed-password-123')
    mockUserCreate.mockResolvedValue(STAFF_USER)
    mockSetSessionCookie.mockResolvedValue(undefined)
    mockResidentFindFirst.mockResolvedValue(null)
    mockResidentFindUnique.mockResolvedValue(null)
    mockResidentCreate.mockResolvedValue({ code: 'RES-STAFF1' })

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      VALID_REGISTRATION,
      ip
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.profileType).toBe('staff')
    expect(body.user).toEqual(STAFF_USER)
    expect(mockUserCreate).toHaveBeenCalledTimes(1)
  })

  test('returns 403 when invite code is wrong', async () => {
    const ip = `wrong-code-${Date.now()}`
    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { ...VALID_REGISTRATION, inviteCode: 'WRONG' },
      ip
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.INVALID_AOZ_CODE)
  })

  test('returns 409 when email already exists as staff', async () => {
    const ip = `dupe-${Date.now()}`
    mockUserFindUnique.mockResolvedValue({ id: 'existing-user' })

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      VALID_REGISTRATION,
      ip
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED)
  })

  test('creates dual profile (staff + resident) on staff registration', async () => {
    const ip = `dual-${Date.now()}`
    mockUserFindUnique.mockResolvedValue(null)
    mockHashPassword.mockResolvedValue('hashed')
    mockUserCreate.mockResolvedValue(STAFF_USER)
    mockSetSessionCookie.mockResolvedValue(undefined)
    // ensureResidentProfile: no existing, code is unique
    mockResidentFindFirst.mockResolvedValue(null)
    mockResidentFindUnique.mockResolvedValue(null)
    mockResidentCreate.mockResolvedValue({ code: 'RES-DUAL01' })

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      VALID_REGISTRATION,
      ip
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.profileType).toBe('staff')
    expect(body.residentCode).toBeDefined()
    // Both staff session cookie and resident cookie should be set
    expect(mockSetSessionCookie).toHaveBeenCalledWith(STAFF_USER)
    expect(mockCookieSet).toHaveBeenCalledWith(
      'resident_code',
      expect.any(String),
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' })
    )
  })

  test('retries code generation when duplicate is found', async () => {
    const ip = `retry-code-${Date.now()}`
    mockResidentFindFirst.mockResolvedValue(null)
    // First code attempt: duplicate exists. Second: no duplicate.
    mockResidentFindUnique
      .mockResolvedValueOnce({ code: 'RES-EXISTS' }) // first candidate collides
      .mockResolvedValueOnce(null)                    // second candidate is free
    mockResidentCreate.mockResolvedValue({ code: 'RES-NEW001' })

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { name: 'Retry', email: 'retry@example.com', password: 'securepass123' },
      ip
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    // findUnique was called twice for code uniqueness check
    expect(mockResidentFindUnique).toHaveBeenCalledTimes(2)
  })

  test('returns 500 when all code generation attempts fail', async () => {
    const ip = `code-fail-${Date.now()}`
    mockResidentFindFirst.mockResolvedValue(null)
    // All 3 code attempts collide
    mockResidentFindUnique
      .mockResolvedValueOnce({ code: 'exists' })
      .mockResolvedValueOnce({ code: 'exists' })
      .mockResolvedValueOnce({ code: 'exists' })

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { name: 'Fail', email: 'fail@example.com', password: 'securepass123' },
      ip
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.CODE_GENERATION_ERROR)
  })

  test('hashes password before storing', async () => {
    const ip = `hash-${Date.now()}`
    mockUserFindUnique.mockResolvedValue(null)
    mockHashPassword.mockResolvedValue('bcrypt-hashed-value')
    mockUserCreate.mockResolvedValue(STAFF_USER)
    mockSetSessionCookie.mockResolvedValue(undefined)
    mockResidentFindFirst.mockResolvedValue(null)
    mockResidentFindUnique.mockResolvedValue(null)
    mockResidentCreate.mockResolvedValue({ code: 'RES-HASH01' })

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      VALID_REGISTRATION,
      ip
    )

    await registerPOST(req)

    expect(mockHashPassword).toHaveBeenCalledWith('securepass123')
    // User create should receive the hashed password, not the plaintext
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: 'bcrypt-hashed-value',
        }),
      })
    )
  })

  test('sets session cookie for staff registration', async () => {
    const ip = `cookie-${Date.now()}`
    mockUserFindUnique.mockResolvedValue(null)
    mockHashPassword.mockResolvedValue('hashed')
    mockUserCreate.mockResolvedValue(STAFF_USER)
    mockSetSessionCookie.mockResolvedValue(undefined)
    mockResidentFindFirst.mockResolvedValue(null)
    mockResidentFindUnique.mockResolvedValue(null)
    mockResidentCreate.mockResolvedValue({ code: 'RES-COOK01' })

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      VALID_REGISTRATION,
      ip
    )

    await registerPOST(req)

    expect(mockSetSessionCookie).toHaveBeenCalledWith({
      id: STAFF_USER.id,
      email: STAFF_USER.email,
      name: STAFF_USER.name,
      role: STAFF_USER.role,
    })
  })

  test('sets resident cookie for resident-only registration', async () => {
    const ip = `res-cookie-${Date.now()}`
    mockResidentFindFirst.mockResolvedValue(null)
    mockResidentFindUnique.mockResolvedValue(null)
    mockResidentCreate.mockResolvedValue({ code: 'RES-RC0001' })

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { name: 'ResCookie', email: 'rescookie@example.com', password: 'securepass123' },
      ip
    )

    await registerPOST(req)

    expect(mockCookieSet).toHaveBeenCalledWith(
      'resident_code',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    )
  })

  test('lowercases email before storing staff profile', async () => {
    const ip = `lower-${Date.now()}`
    mockUserFindUnique.mockResolvedValue(null)
    mockHashPassword.mockResolvedValue('hashed')
    mockUserCreate.mockResolvedValue({ ...STAFF_USER, email: 'upper@example.com' })
    mockSetSessionCookie.mockResolvedValue(undefined)
    mockResidentFindFirst.mockResolvedValue(null)
    mockResidentFindUnique.mockResolvedValue(null)
    mockResidentCreate.mockResolvedValue({ code: 'RES-LOW001' })

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { ...VALID_REGISTRATION, email: 'UPPER@EXAMPLE.COM' },
      ip
    )

    await registerPOST(req)

    expect(mockUserFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'upper@example.com' },
      })
    )
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'upper@example.com',
        }),
      })
    )
  })

  test('reuses existing resident profile for same email', async () => {
    const ip = `reuse-${Date.now()}`
    // ensureResidentProfile finds an existing profile
    mockResidentFindFirst.mockResolvedValue({ code: 'RES-EXIST1' })

    const req = createJsonRequest(
      'http://localhost:3001/api/auth/register',
      { name: 'Reuse', email: 'reuse@example.com', password: 'securepass123' },
      ip
    )

    const res = await registerPOST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.code).toBe('RES-EXIST1')
    // Should not create a new resident since one already exists
    expect(mockResidentCreate).not.toHaveBeenCalled()
  })
})
