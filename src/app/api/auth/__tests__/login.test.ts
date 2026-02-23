/**
 * Tests for staff auth login API route (POST /api/auth/login)
 *
 * Tests: successful login, invalid credentials, missing fields, rate limit, server error
 */

import { NextRequest } from 'next/server'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// --- Mocks ---

const mockLogin = jest.fn()
const mockSetSessionCookie = jest.fn()
jest.mock('@/lib/auth', () => ({
  login: (...args: unknown[]) => mockLogin(...args),
  setSessionCookie: (...args: unknown[]) => mockSetSessionCookie(...args),
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

// --- Import after mocks ---
import { POST } from '../login/route'

// --- Helpers ---

function createJsonRequest(body: Record<string, unknown>, ip?: string): NextRequest {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }
  if (ip) {
    headers['x-forwarded-for'] = ip
  }

  return new NextRequest('http://localhost:3001/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
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
  })

  test('returns user data on successful login', async () => {
    mockLogin.mockResolvedValue({ success: true, user: STAFF_USER })
    mockSetSessionCookie.mockResolvedValue(undefined)

    const req = createJsonRequest(
      { email: 'admin@aoz.ch', password: 'securepass' },
      '10.0.0.1'
    )
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.user).toEqual({
      id: 'user-1',
      email: 'admin@aoz.ch',
      name: 'Test Admin',
      role: 'ADMIN',
    })

    // Verify login was called with email, password, and IP
    expect(mockLogin).toHaveBeenCalledWith('admin@aoz.ch', 'securepass', '10.0.0.1')
    expect(mockSetSessionCookie).toHaveBeenCalledWith(STAFF_USER)
  })

  test('returns 401 on invalid credentials', async () => {
    mockLogin.mockResolvedValue({
      success: false,
      error: ERROR_MESSAGES.INVALID_CREDENTIALS,
    })

    const req = createJsonRequest(
      { email: 'wrong@aoz.ch', password: 'wrongpass' },
      '10.0.0.2'
    )
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.INVALID_CREDENTIALS)
    expect(mockSetSessionCookie).not.toHaveBeenCalled()
  })

  test('returns 400 when email is missing', async () => {
    const req = createJsonRequest({ password: 'somepass' }, '10.0.0.3')
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('E-Mail und Passwort erforderlich')
    expect(mockLogin).not.toHaveBeenCalled()
  })

  test('returns 400 when password is missing', async () => {
    const req = createJsonRequest({ email: 'admin@aoz.ch' }, '10.0.0.4')
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('E-Mail und Passwort erforderlich')
    expect(mockLogin).not.toHaveBeenCalled()
  })

  test('returns 429 when rate limited', async () => {
    mockLogin.mockResolvedValue({
      success: false,
      error: 'Zu viele Anmeldeversuche. Bitte warten Sie 120 Sekunden.',
      retryAfter: 120,
    })

    const req = createJsonRequest(
      { email: 'admin@aoz.ch', password: 'test' },
      '10.0.0.5'
    )
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(429)
    expect(body.success).toBe(false)
    expect(body.retryAfter).toBe(120)
  })

  test('returns 500 on unexpected server error', async () => {
    mockLogin.mockRejectedValue(new Error('Database connection failed'))

    const req = createJsonRequest(
      { email: 'admin@aoz.ch', password: 'test' },
      '10.0.0.6'
    )
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.SESSION_ERROR)
  })

  test('extracts IP from x-forwarded-for header', async () => {
    mockLogin.mockResolvedValue({ success: true, user: STAFF_USER })
    mockSetSessionCookie.mockResolvedValue(undefined)

    const req = new NextRequest('http://localhost:3001/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@aoz.ch', password: 'test' }),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      },
    })

    await POST(req)

    // Should use the first IP from x-forwarded-for
    expect(mockLogin).toHaveBeenCalledWith('admin@aoz.ch', 'test', '192.168.1.1')
  })

  test('falls back to x-real-ip when x-forwarded-for is absent', async () => {
    mockLogin.mockResolvedValue({ success: true, user: STAFF_USER })
    mockSetSessionCookie.mockResolvedValue(undefined)

    const req = new NextRequest('http://localhost:3001/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@aoz.ch', password: 'test' }),
      headers: {
        'content-type': 'application/json',
        'x-real-ip': '172.16.0.1',
      },
    })

    await POST(req)

    expect(mockLogin).toHaveBeenCalledWith('admin@aoz.ch', 'test', '172.16.0.1')
  })

  test('uses "unknown" when no IP headers present', async () => {
    mockLogin.mockResolvedValue({ success: true, user: STAFF_USER })
    mockSetSessionCookie.mockResolvedValue(undefined)

    const req = new NextRequest('http://localhost:3001/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@aoz.ch', password: 'test' }),
      headers: {
        'content-type': 'application/json',
      },
    })

    await POST(req)

    expect(mockLogin).toHaveBeenCalledWith('admin@aoz.ch', 'test', 'unknown')
  })
})
