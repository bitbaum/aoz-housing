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
  getClientIp: (request: { headers: { get(name: string): string | null } }) =>
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown',
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

// A door is offered only when its ACCOUNT exists, so the endpoint reads the
// database. Config presence proves nothing now that codes are derived: it
// would offer five buttons on an instance where the seed never ran.
const mockUserFindMany = jest.fn()
const mockResidentFindUnique = jest.fn()
jest.mock('@/lib/db', () => ({
  prisma: {
    user: { findMany: (...args: unknown[]) => mockUserFindMany(...args) },
    resident: { findUnique: (...args: unknown[]) => mockResidentFindUnique(...args) },
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
  scope: 'ALL_DOMAINS' as const,
  isSystemAdmin: true,
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
    // Every staff door's account exists unless a test says otherwise.
    mockUserFindMany.mockImplementation(async (args: { where: { code: { in: string[] } } }) =>
      args.where.code.in.map((code) => ({ code })),
    )
    mockResidentFindUnique.mockResolvedValue({ id: 'demo-resident-id' })
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('validation and configuration', () => {
    it('rejects an unknown role', async () => {
      // 404, not 400: "no such role" and "that door is not on offer here" are
      // the same fact to the caller, and answering them differently would tell
      // a prober which roles exist.
      const response = await POST(createDemoRequest({ role: 'superadmin' }))
      expect(response.status).toBe(404)
      expect(mockLoginByCode).not.toHaveBeenCalled()
    })

    it('opens a door for every staff role, not just one', async () => {
      // The reason this endpoint changed: the product a Jobcoach sees and the
      // product Leitung sees are different applications.
      const response = await GET()
      const body = await response.json()
      const ids = body.data.doors.map((door: { id: string }) => door.id)

      expect(ids).toEqual(
        expect.arrayContaining([
          'ADMIN',
          'BETREUUNG',
          'SOZIALARBEIT',
          'JOBCOACH',
          'FREIWILLIGENARBEIT',
          'resident',
        ]),
      )
    })

    it('offers no door whose account is missing', async () => {
      // The rule the old version stated and this one keeps: a button appears
      // only when pressing it can succeed.
      mockUserFindMany.mockResolvedValue([])
      mockResidentFindUnique.mockResolvedValue(null)

      const response = await GET()
      const body = await response.json()

      expect(body.data.doors).toEqual([])
    })

    it('still answers the old role=staff identifier', async () => {
      // Old clients and bookmarks send it; breaking them would retire a door
      // that worked yesterday for no reason the user could act on.
      const response = await POST(createDemoRequest({ role: 'staff' }))
      expect(response.status).toBe(200)
    })

    it('returns 404 when demo access is disabled', async () => {
      process.env.DEMO_ACCESS_ENABLED = 'false'
      const response = await POST(createDemoRequest({ role: 'staff' }))
      expect(response.status).toBe(404)
      expect(mockLoginByCode).not.toHaveBeenCalled()
    })

    it('returns 404 when the account behind the requested door is missing', async () => {
      // What closes a door is now the ACCOUNT, not an env var: codes are
      // derived, so unsetting `DEMO_STAFF_CODE` only changes which code the
      // Leitung door uses. An instance where the seed never ran must still
      // offer nothing rather than five buttons that all answer "invalid code".
      mockUserFindMany.mockResolvedValue([])

      const response = await POST(createDemoRequest({ role: 'ADMIN' }))

      expect(response.status).toBe(404)
      expect(mockLoginByCode).not.toHaveBeenCalled()
    })

    it('keeps the legacy env code as the Leitung door when one is set', async () => {
      // A deployment already running DEMO_STAFF_CODE has that code in
      // circulation; retiring it silently would break the door people know.
      await POST(createDemoRequest({ role: 'ADMIN' }))

      expect(mockLoginByCode).toHaveBeenCalledWith(STAFF_CODE, expect.any(String))
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
    it('reports both kinds of door when the accounts are there', async () => {
      const body = await (await GET()).json()
      expect(body.success).toBe(true)
      expect(body.data.staff).toBe(true)
      expect(body.data.resident).toBe(true)
    })

    it('gives every door a label a person can read', async () => {
      // A button reading "FREIWILLIGENARBEIT" is a database value on screen.
      const body = await (await GET()).json()
      const labels = body.data.doors.map((door: { label: string }) => door.label)

      expect(labels).toEqual(expect.arrayContaining(['Leitung', 'Betreuung', 'Jobcoach']))
      expect(labels.every((label: string) => label === label.trim() && label.length > 0)).toBe(true)
      expect(labels).not.toContain('FREIWILLIGENARBEIT')
    })

    it('hides the staff doors when their accounts are gone', async () => {
      mockUserFindMany.mockResolvedValue([])
      const body = await (await GET()).json()

      expect(body.data.staff).toBe(false)
      expect(body.data.resident).toBe(true)
    })

    it('resident stays available without an env code (scope default resolves one)', async () => {
      delete process.env.DEMO_RESIDENT_CODE
      const body = await (await GET()).json()
      expect(body.data.resident).toBe(true)
    })

    it('reports nothing when demo access is disabled', async () => {
      process.env.DEMO_ACCESS_ENABLED = 'false'
      const body = await (await GET()).json()
      expect(body.data).toEqual({ doors: [], staff: false, resident: false })
    })
  })
})
