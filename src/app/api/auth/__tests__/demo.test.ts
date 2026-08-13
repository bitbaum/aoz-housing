/**
 * Tests for the demo login endpoint (POST /api/auth/demo).
 *
 * Tests: role validation, the DEMO_ACCESS_ENABLED gate, rate limiting,
 * session issuance for both roles, and — the regression this file exists
 * for — that the STAFF demo works in production. An earlier guard refused
 * role=staff whenever NODE_ENV was 'production', which left the login page
 * showing a staff demo button that could never succeed.
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
jest.mock('@/lib/auth/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  recordLoginAttempt: (...args: unknown[]) => mockRecordLoginAttempt(...args),
}))

const mockSetResidentCookie = jest.fn()
jest.mock('@/lib/portal-auth', () => ({
  setResidentCookie: (...args: unknown[]) => mockSetResidentCookie(...args),
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
import { POST, GET } from '../demo/route'

// --- Helpers ---

const STAFF_CODE = 'AOZH-DEMO01'
const RESIDENT_CODE = 'RES-001'

function createDemoRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/auth/demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const STAFF_USER = {
  id: 'demo-user-id',
  email: '',
  name: 'Demo-Zugang',
  role: 'ADMIN' as const,
}

describe('POST /api/auth/demo', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.DEMO_ACCESS_ENABLED = 'true'
    process.env.DEMO_STAFF_CODE = STAFF_CODE
    process.env.DEMO_RESIDENT_CODE = RESIDENT_CODE
    mockCheckRateLimit.mockReturnValue({ allowed: true })
    mockLoginByCode.mockResolvedValue({
      success: true,
      type: 'staff',
      user: STAFF_USER,
    })
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('validation and configuration', () => {
    it('rejects an unknown role', async () => {
      const response = await POST(createDemoRequest({ role: 'superadmin' }))
      expect(response.status).toBe(400)
      expect(mockLoginByCode).not.toHaveBeenCalled()
    })

    it('returns 404 when demo access is disabled', async () => {
      process.env.DEMO_ACCESS_ENABLED = 'false'
      const response = await POST(createDemoRequest({ role: 'staff' }))
      expect(response.status).toBe(404)
      expect(mockLoginByCode).not.toHaveBeenCalled()
    })

    it('returns 404 when the code for the requested role is not configured', async () => {
      delete process.env.DEMO_STAFF_CODE
      const response = await POST(createDemoRequest({ role: 'staff' }))
      expect(response.status).toBe(404)
      expect(mockLoginByCode).not.toHaveBeenCalled()
    })
  })

  describe('staff demo', () => {
    it('issues a staff session', async () => {
      const response = await POST(createDemoRequest({ role: 'staff' }))
      const body = await response.json()
      expect(body).toEqual({ success: true, type: 'staff' })
      expect(mockLoginByCode).toHaveBeenCalledWith(STAFF_CODE, expect.any(String))
      expect(mockSetSessionCookie).toHaveBeenCalledWith(STAFF_USER)
    })

    it('issues a staff session in production (regression: prod hard-block)', async () => {
      // NODE_ENV is readonly in the type but a plain property at runtime.
      const env = process.env as Record<string, string | undefined>
      const previous = env.NODE_ENV
      env.NODE_ENV = 'production'
      try {
        const response = await POST(createDemoRequest({ role: 'staff' }))
        const body = await response.json()
        expect(response.status).toBe(200)
        expect(body).toEqual({ success: true, type: 'staff' })
        expect(mockSetSessionCookie).toHaveBeenCalledWith(STAFF_USER)
      } finally {
        env.NODE_ENV = previous
      }
    })
  })

  describe('resident demo', () => {
    it('issues a resident session', async () => {
      mockLoginByCode.mockResolvedValue({
        success: true,
        type: 'resident',
        code: RESIDENT_CODE,
      })
      const response = await POST(createDemoRequest({ role: 'resident' }))
      const body = await response.json()
      expect(body).toEqual({ success: true, type: 'resident' })
      expect(mockLoginByCode).toHaveBeenCalledWith(RESIDENT_CODE, expect.any(String))
      expect(mockSetResidentCookie).toHaveBeenCalledWith(RESIDENT_CODE)
    })
  })

  describe('throttling', () => {
    it('refuses when the IP is rate-limited', async () => {
      mockCheckRateLimit.mockReturnValue({ allowed: false, retryAfter: 42 })
      const response = await POST(createDemoRequest({ role: 'staff' }))
      expect(response.status).toBe(429)
      expect(mockLoginByCode).not.toHaveBeenCalled()
    })

    it('counts successful demo sessions against the rate limit', async () => {
      await POST(createDemoRequest({ role: 'staff' }))
      expect(mockRecordLoginAttempt).toHaveBeenCalledTimes(1)
    })
  })

  describe('failures', () => {
    it('returns 401 when the configured code does not resolve to an account', async () => {
      mockLoginByCode.mockResolvedValue({ success: false, error: 'Ungültiger Code' })
      const response = await POST(createDemoRequest({ role: 'staff' }))
      expect(response.status).toBe(401)
    })
  })

  describe('GET availability (drives the login page buttons)', () => {
    it('reports both roles when both are configured', async () => {
      const body = await (await GET()).json()
      expect(body).toEqual({ success: true, data: { staff: true, resident: true } })
    })

    it('hides the staff door when no dedicated staff code is configured', async () => {
      delete process.env.DEMO_STAFF_CODE
      const body = await (await GET()).json()
      expect(body.data).toEqual({ staff: false, resident: true })
    })

    it('resident stays available without an env code (scope default resolves one)', async () => {
      delete process.env.DEMO_RESIDENT_CODE
      const body = await (await GET()).json()
      expect(body.data.resident).toBe(true)
    })

    it('reports nothing when demo access is disabled', async () => {
      process.env.DEMO_ACCESS_ENABLED = 'false'
      const body = await (await GET()).json()
      expect(body.data).toEqual({ staff: false, resident: false })
    })
  })
})
