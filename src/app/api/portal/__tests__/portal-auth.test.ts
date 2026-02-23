/**
 * Tests for portal auth routes:
 * - POST /api/portal/logout
 * - POST /api/portal/register
 */

import { NextRequest } from 'next/server'

// --- Mocks ---

// Mock redirect to capture calls (next/navigation redirect throws by design)
const mockRedirect = jest.fn()
jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args)
    throw new Error('NEXT_REDIRECT')
  },
}))

// Mock cookies
const mockCookieSet = jest.fn()
const mockCookieDelete = jest.fn()
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    set: (...args: unknown[]) => mockCookieSet(...args),
    delete: (...args: unknown[]) => mockCookieDelete(...args),
  }),
}))

// Mock Prisma
const mockFindUnique = jest.fn()
const mockCreate = jest.fn()
jest.mock('@/lib/db', () => ({
  prisma: {
    resident: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}))

// --- Import after mocks ---
import { POST as logoutPOST } from '../logout/route'
import { POST as registerPOST } from '../register/route'

// --- Helpers ---

function createJsonRequest(
  url: string,
  body: unknown,
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

const VALID_REGISTRATION = {
  ageRange: 'ADULT',
  gender: 'MALE',
  familyStatus: 'SINGLE',
  languages: ['DE', 'EN'],
}

// --- Tests ---

describe('POST /api/portal/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('deletes the resident_code cookie', async () => {
    await expect(logoutPOST()).rejects.toThrow('NEXT_REDIRECT')

    expect(mockCookieDelete).toHaveBeenCalledWith('resident_code')
  })

  test('redirects to /portal after deleting cookie', async () => {
    await expect(logoutPOST()).rejects.toThrow('NEXT_REDIRECT')

    expect(mockRedirect).toHaveBeenCalledWith('/portal')
  })

  test('deletes cookie before redirecting', async () => {
    const callOrder: string[] = []
    mockCookieDelete.mockImplementation(() => {
      callOrder.push('delete')
    })
    mockRedirect.mockImplementation(() => {
      callOrder.push('redirect')
      throw new Error('NEXT_REDIRECT')
    })

    await expect(logoutPOST()).rejects.toThrow('NEXT_REDIRECT')

    expect(callOrder).toEqual(['delete', 'redirect'])
  })
})

describe('POST /api/portal/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // --- Rate limiting ---

  test('returns 429 after too many registration attempts from same IP', async () => {
    const ip = `register-rate-${Date.now()}`
    mockFindUnique.mockResolvedValue(null) // code is unique
    mockCreate.mockResolvedValue({ id: 'res-new', code: 'RES-ABC123' })

    // First 3 requests succeed (MAX_ATTEMPTS = 3)
    for (let i = 0; i < 3; i++) {
      const req = createJsonRequest(
        'http://localhost:3001/api/portal/register',
        VALID_REGISTRATION,
        ip
      )
      const res = await registerPOST(req)
      expect(res.status).toBe(200)
    }

    // 4th attempt should be rate-limited
    const req = createJsonRequest(
      'http://localhost:3001/api/portal/register',
      VALID_REGISTRATION,
      ip
    )
    const res = await registerPOST(req)
    expect(res.status).toBe(429)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toBeDefined()
  })

  // --- Input validation ---

  test('returns 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost:3001/api/portal/register', {
      method: 'POST',
      body: 'not json',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': `invalid-json-${Date.now()}`,
      },
    })

    const res = await registerPOST(req)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.success).toBe(false)
  })

  test('returns 400 when required fields are missing', async () => {
    const req = createJsonRequest(
      'http://localhost:3001/api/portal/register',
      { ageRange: 'ADULT' }, // missing gender, familyStatus
      `missing-fields-${Date.now()}`
    )

    const res = await registerPOST(req)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.details).toBeDefined()
  })

  test('returns 400 for invalid enum values', async () => {
    const req = createJsonRequest(
      'http://localhost:3001/api/portal/register',
      {
        ageRange: 'INVALID_AGE',
        gender: 'MALE',
        familyStatus: 'SINGLE',
      },
      `invalid-enum-${Date.now()}`
    )

    const res = await registerPOST(req)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.success).toBe(false)
  })

  test('returns 400 for empty body', async () => {
    const req = createJsonRequest(
      'http://localhost:3001/api/portal/register',
      {},
      `empty-body-${Date.now()}`
    )

    const res = await registerPOST(req)
    expect(res.status).toBe(400)
  })

  // --- Successful registration ---

  test('creates resident with correct defaults on valid input', async () => {
    mockFindUnique.mockResolvedValue(null) // code is unique
    mockCreate.mockResolvedValue({ id: 'res-new', code: 'RES-ABC123' })

    const req = createJsonRequest(
      'http://localhost:3001/api/portal/register',
      VALID_REGISTRATION,
      `create-resident-${Date.now()}`
    )

    const res = await registerPOST(req)
    expect(res.status).toBe(200)

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ageRange: 'ADULT',
        gender: 'MALE',
        familyStatus: 'SINGLE',
        languages: ['DE', 'EN'],
        // Default values
        sleepSchedule: 'STANDARD',
        socialStyle: 'MODERATE',
        smokingStatus: 'NON_SMOKER',
        noiseTolerance: 3,
        cleanlinessLevel: 3,
        privacyNeed: 3,
        choresContribution: 3,
        mobilityNeeds: 'NONE',
        status: 'ACTIVE',
        petTolerance: true,
        sharedBathroom: true,
        sharedKitchen: true,
        notes: 'Selbstregistrierung via Portal',
      }),
    })

    // Code should be present in create call (generated, matches RES-XXXXXX pattern)
    const createArg = mockCreate.mock.calls[0][0] as { data: { code: string } }
    expect(createArg.data.code).toMatch(/^RES-[A-Z2-9]{6}$/)
  })

  test('generates unique code and retries on collision', async () => {
    // First findUnique: code already exists (collision)
    // Second findUnique: code is unique
    mockFindUnique
      .mockResolvedValueOnce({ id: 'existing', code: 'RES-EXIST1' })
      .mockResolvedValueOnce(null)
    mockCreate.mockResolvedValue({ id: 'res-new' })

    const req = createJsonRequest(
      'http://localhost:3001/api/portal/register',
      VALID_REGISTRATION,
      `retry-code-${Date.now()}`
    )

    const res = await registerPOST(req)
    expect(res.status).toBe(200)

    // Should have tried findUnique twice (collision then success)
    expect(mockFindUnique).toHaveBeenCalledTimes(2)
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  test('returns 500 when all code generation attempts collide', async () => {
    // All 3 findUnique calls return existing records (all collisions)
    mockFindUnique
      .mockResolvedValueOnce({ id: 'e1' })
      .mockResolvedValueOnce({ id: 'e2' })
      .mockResolvedValueOnce({ id: 'e3' })

    const req = createJsonRequest(
      'http://localhost:3001/api/portal/register',
      VALID_REGISTRATION,
      `all-collisions-${Date.now()}`
    )

    const res = await registerPOST(req)
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  test('sets resident_code cookie on successful registration', async () => {
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({ id: 'res-new' })

    const req = createJsonRequest(
      'http://localhost:3001/api/portal/register',
      VALID_REGISTRATION,
      `cookie-set-${Date.now()}`
    )

    const res = await registerPOST(req)
    expect(res.status).toBe(200)

    expect(mockCookieSet).toHaveBeenCalledWith(
      'resident_code',
      expect.stringMatching(/^RES-[A-Z2-9]{6}$/),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    )
  })

  test('returns success response with generated code', async () => {
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({ id: 'res-new' })

    const req = createJsonRequest(
      'http://localhost:3001/api/portal/register',
      VALID_REGISTRATION,
      `success-response-${Date.now()}`
    )

    const res = await registerPOST(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.code).toMatch(/^RES-[A-Z2-9]{6}$/)
  })

  test('accepts registration with empty languages array', async () => {
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({ id: 'res-new' })

    const req = createJsonRequest(
      'http://localhost:3001/api/portal/register',
      {
        ageRange: 'SENIOR',
        gender: 'FEMALE',
        familyStatus: 'COUPLE',
        languages: [],
      },
      `empty-langs-${Date.now()}`
    )

    const res = await registerPOST(req)
    expect(res.status).toBe(200)

    const createArg = mockCreate.mock.calls[0][0] as { data: { languages: string[] } }
    expect(createArg.data.languages).toEqual([])
  })

  test('accepts registration without languages field (defaults to empty)', async () => {
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({ id: 'res-new' })

    const req = createJsonRequest(
      'http://localhost:3001/api/portal/register',
      {
        ageRange: 'YOUNG_ADULT',
        gender: 'OTHER',
        familyStatus: 'FAMILY_WITH_CHILDREN',
      },
      `no-langs-${Date.now()}`
    )

    const res = await registerPOST(req)
    expect(res.status).toBe(200)

    const createArg = mockCreate.mock.calls[0][0] as { data: { languages: string[] } }
    expect(createArg.data.languages).toEqual([])
  })

  test('uses x-forwarded-for IP for rate limiting', async () => {
    const ip = `xff-test-${Date.now()}`
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({ id: 'res-new' })

    // Exhaust rate limit for this IP
    for (let i = 0; i < 3; i++) {
      const req = createJsonRequest(
        'http://localhost:3001/api/portal/register',
        VALID_REGISTRATION,
        ip
      )
      await registerPOST(req)
    }

    // Same IP should be rate-limited
    const blockedReq = createJsonRequest(
      'http://localhost:3001/api/portal/register',
      VALID_REGISTRATION,
      ip
    )
    const blockedRes = await registerPOST(blockedReq)
    expect(blockedRes.status).toBe(429)

    // Different IP should still work
    const otherReq = createJsonRequest(
      'http://localhost:3001/api/portal/register',
      VALID_REGISTRATION,
      `other-ip-${Date.now()}`
    )
    const otherRes = await registerPOST(otherReq)
    expect(otherRes.status).toBe(200)
  })
})
