/**
 * Tests for unified code-based login API route (POST /api/auth/login)
 *
 * Tests: successful staff/resident login, missing code, rate limit,
 * invalid credentials, server error, IP extraction, code normalisation
 */

import { NextRequest } from 'next/server'

// --- Mocks ---

const mockLoginByCode = jest.fn()
const mockSetSessionCookie = jest.fn()
jest.mock('@/lib/auth', () => ({
  loginByCode: (...args: unknown[]) => mockLoginByCode(...args),
  setSessionCookie: (...args: unknown[]) => mockSetSessionCookie(...args),
}))

const mockCheckRateLimit = jest.fn()
const mockRecordLoginAttempt = jest.fn()
const mockClearLoginAttempts = jest.fn()
jest.mock('@/lib/auth/rate-limit', () => ({
  getClientIp: (request: { headers: { get(name: string): string | null } }) =>
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown',
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  recordLoginAttempt: (...args: unknown[]) => mockRecordLoginAttempt(...args),
  clearLoginAttempts: (...args: unknown[]) => mockClearLoginAttempts(...args),
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

// --- Import after mocks ---
import { POST } from '../login/route'

// --- Helpers ---

function createJsonRequest(body: Record<string, unknown>, headers?: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost:3001/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  })
}

const STAFF_USER = {
  id: 'user-1',
  email: 'admin@aoz.ch',
  name: 'Test Admin',
  role: 'ADMIN' as const,
}

// --- Tests ---

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: rate limit allows
    mockCheckRateLimit.mockReturnValue({ allowed: true })
  })

  test('returns staff user data on successful staff login', async () => {
    mockLoginByCode.mockResolvedValue({ success: true, type: 'staff', user: STAFF_USER })
    mockSetSessionCookie.mockResolvedValue(undefined)

    const req = createJsonRequest(
      { code: 'AOZ-ABC123' },
      { 'x-forwarded-for': '10.0.0.1' }
    )
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.type).toBe('staff')
    expect(body.user).toEqual(STAFF_USER)

    expect(mockLoginByCode).toHaveBeenCalledWith('AOZ-ABC123', '10.0.0.1')
    expect(mockSetSessionCookie).toHaveBeenCalledWith(STAFF_USER)
    expect(mockClearLoginAttempts).toHaveBeenCalledWith('10.0.0.1')
  })

  test('returns resident data on successful resident login', async () => {
    mockLoginByCode.mockResolvedValue({ success: true, type: 'resident', code: 'RES-XYZ789' })

    const req = createJsonRequest(
      { code: 'RES-XYZ789' },
      { 'x-forwarded-for': '10.0.0.2' }
    )
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.type).toBe('resident')
    expect(body.code).toBe('RES-XYZ789')

    // Resident login sets cookie, not staff session
    expect(mockSetSessionCookie).not.toHaveBeenCalled()
    expect(mockCookieSet).toHaveBeenCalledWith(
      'resident_code',
      'RES-XYZ789',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' })
    )
  })

  test('returns 401 on invalid code', async () => {
    mockLoginByCode.mockResolvedValue({
      success: false,
      error: 'Ungültiger Code',
    })

    const req = createJsonRequest(
      { code: 'AOZ-WRONG1' },
      { 'x-forwarded-for': '10.0.0.3' }
    )
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Ungültiger Code')
    expect(mockSetSessionCookie).not.toHaveBeenCalled()
  })

  test('returns 400 when code is missing', async () => {
    const req = createJsonRequest({})
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Code erforderlich')
    expect(mockLoginByCode).not.toHaveBeenCalled()
  })

  test('returns 400 when code is not a string', async () => {
    const req = createJsonRequest({ code: 12345 })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Code erforderlich')
  })

  test('returns 400 (not 500) when the body is not valid JSON', async () => {
    // A truncated/aborted request body used to reach request.json() and throw,
    // producing a 500 and an ERROR log for what is a client-side fault.
    const req = new NextRequest('http://localhost:3001/api/auth/login', {
      method: 'POST',
      body: '{"code":',
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(mockLoginByCode).not.toHaveBeenCalled()
  })

  test('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, retryAfter: 120 })

    const req = createJsonRequest(
      { code: 'AOZ-ABC123' },
      { 'x-forwarded-for': '10.0.0.5' }
    )
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(429)
    expect(body.success).toBe(false)
    expect(body.retryAfter).toBe(120)
    expect(mockLoginByCode).not.toHaveBeenCalled()
  })

  test('returns 500 on unexpected server error', async () => {
    mockLoginByCode.mockRejectedValue(new Error('Database connection failed'))

    const req = createJsonRequest(
      { code: 'AOZ-ABC123' },
      { 'x-forwarded-for': '10.0.0.6' }
    )
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Ein Fehler ist aufgetreten')
  })

  test('trims and uppercases the code before login', async () => {
    mockLoginByCode.mockResolvedValue({ success: true, type: 'staff', user: STAFF_USER })
    mockSetSessionCookie.mockResolvedValue(undefined)

    const req = createJsonRequest({ code: '  aoz-abc123  ' })
    await POST(req)

    expect(mockLoginByCode).toHaveBeenCalledWith('AOZ-ABC123', expect.any(String))
  })

  test('extracts IP from x-forwarded-for header (first IP)', async () => {
    mockLoginByCode.mockResolvedValue({ success: true, type: 'staff', user: STAFF_USER })
    mockSetSessionCookie.mockResolvedValue(undefined)

    const req = createJsonRequest(
      { code: 'AOZ-ABC123' },
      { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }
    )
    await POST(req)

    expect(mockCheckRateLimit).toHaveBeenCalledWith('192.168.1.1')
    expect(mockLoginByCode).toHaveBeenCalledWith('AOZ-ABC123', '192.168.1.1')
  })

  test('falls back to x-real-ip when x-forwarded-for is absent', async () => {
    mockLoginByCode.mockResolvedValue({ success: true, type: 'staff', user: STAFF_USER })
    mockSetSessionCookie.mockResolvedValue(undefined)

    const req = createJsonRequest(
      { code: 'AOZ-ABC123' },
      { 'x-real-ip': '172.16.0.1' }
    )
    await POST(req)

    expect(mockLoginByCode).toHaveBeenCalledWith('AOZ-ABC123', '172.16.0.1')
  })

  test('uses "unknown" when no IP headers present', async () => {
    mockLoginByCode.mockResolvedValue({ success: true, type: 'staff', user: STAFF_USER })
    mockSetSessionCookie.mockResolvedValue(undefined)

    const req = createJsonRequest({ code: 'AOZ-ABC123' })
    await POST(req)

    expect(mockLoginByCode).toHaveBeenCalledWith('AOZ-ABC123', 'unknown')
  })
})
