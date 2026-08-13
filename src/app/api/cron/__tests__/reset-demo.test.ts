/**
 * Tests for the daily demo reset endpoint (POST /api/cron/reset-demo).
 * Verifies auth, the demo-mode safety gate, advisory locking, and that the
 * lock is released even when the reset fails.
 */

// --- Mocks ---

// $queryRaw serves pg_try_advisory_lock + pg_advisory_unlock. Default:
// lock acquired so the route proceeds; tests override per case.
const mockQueryRaw = jest.fn()
jest.mock('@/lib/db', () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}))

const mockResetDemoData = jest.fn()
jest.mock('@/lib/demo/reset', () => ({
  resetDemoData: (...args: unknown[]) => mockResetDemoData(...args),
}))

const mockResetDemoWorld = jest.fn()
jest.mock('@/lib/demo/scoped-reset', () => ({
  resetDemoWorld: (...args: unknown[]) => mockResetDemoWorld(...args),
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
import { POST } from '../reset-demo/route'

// --- Helpers ---

const CRON_SECRET = 'test-cron-secret-123'

function createCronRequest(authHeader?: string): Request {
  const headers: Record<string, string> = {}
  if (authHeader) {
    headers['authorization'] = authHeader
  }
  return new Request('http://localhost/api/cron/reset-demo', {
    method: 'POST',
    headers,
  })
}

const FULL_RESET_SUMMARY = {
  residents: 15,
  housingUnits: 5,
  placements: 13,
  incidents: 8,
  demoResidentCode: 'RES-001',
  tablesWiped: 30,
  demoStaffCode: 'AOZH-DEMO01',
  orgRulesSynced: true,
}

const SCOPED_RESET_SUMMARY = {
  residents: 15,
  housingUnits: 5,
  placements: 13,
  incidents: 7,
  unitsDeleted: 5,
  residentsDeleted: 15,
  demoResidentCode: 'RES-DEMO1',
  demoStaffCode: 'WG-DEMO01',
}

describe('POST /api/cron/reset-demo', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.CRON_SECRET = CRON_SECRET
    process.env.DEMO_ACCESS_ENABLED = 'true'
    delete process.env.DEMO_RESET_SCOPE
    mockQueryRaw.mockResolvedValue([{ ok: true }])
    mockResetDemoData.mockResolvedValue(FULL_RESET_SUMMARY)
    mockResetDemoWorld.mockResolvedValue(SCOPED_RESET_SUMMARY)
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('authentication', () => {
    it('rejects requests without an authorization header', async () => {
      const response = await POST(createCronRequest())
      expect(response.status).toBe(401)
      expect(mockResetDemoData).not.toHaveBeenCalled()
    })

    it('rejects requests with a wrong bearer token', async () => {
      const response = await POST(createCronRequest('Bearer wrong-secret'))
      expect(response.status).toBe(401)
      expect(mockResetDemoData).not.toHaveBeenCalled()
    })

    it('rejects all requests when CRON_SECRET is not configured', async () => {
      delete process.env.CRON_SECRET
      const response = await POST(createCronRequest('Bearer undefined'))
      expect(response.status).toBe(401)
      expect(mockResetDemoData).not.toHaveBeenCalled()
    })
  })

  describe('demo-mode safety gate', () => {
    it('refuses to reset a deployment not opted into demo mode', async () => {
      // The one guard that matters most: on a deployment holding real data
      // (DEMO_ACCESS_ENABLED unset), a valid cron call must be a no-op.
      delete process.env.DEMO_ACCESS_ENABLED
      const response = await POST(createCronRequest(`Bearer ${CRON_SECRET}`))
      const body = await response.json()
      expect(body).toEqual({ skipped: true, reason: 'demo-disabled' })
      expect(mockResetDemoData).not.toHaveBeenCalled()
      expect(mockResetDemoWorld).not.toHaveBeenCalled()
    })
  })

  describe('advisory lock', () => {
    it('skips when another reset already holds the lock', async () => {
      mockQueryRaw.mockResolvedValueOnce([{ ok: false }])
      const response = await POST(createCronRequest(`Bearer ${CRON_SECRET}`))
      const body = await response.json()
      expect(body).toEqual({ skipped: true, reason: 'lock-held' })
      expect(mockResetDemoData).not.toHaveBeenCalled()
      expect(mockResetDemoWorld).not.toHaveBeenCalled()
    })

    it('releases the lock after a successful reset', async () => {
      await POST(createCronRequest(`Bearer ${CRON_SECRET}`))
      // First $queryRaw call acquires, second releases.
      expect(mockQueryRaw).toHaveBeenCalledTimes(2)
    })

    it('releases the lock even when the reset throws', async () => {
      mockResetDemoWorld.mockRejectedValueOnce(new Error('boom'))
      const response = await POST(createCronRequest(`Bearer ${CRON_SECRET}`))
      expect(response.status).toBe(500)
      expect(mockQueryRaw).toHaveBeenCalledTimes(2)
    })
  })

  describe('scope', () => {
    it('defaults to the SAFE scoped reset: only the demo world, never a truncate', async () => {
      const response = await POST(createCronRequest(`Bearer ${CRON_SECRET}`))
      const body = await response.json()
      expect(response.status).toBe(200)
      expect(body).toEqual({ success: true, scope: 'UNIT', ...SCOPED_RESET_SUMMARY })
      expect(mockResetDemoWorld).toHaveBeenCalledTimes(1)
      expect(mockResetDemoData).not.toHaveBeenCalled()
    })

    it('runs the destructive full reset only on explicit DEMO_RESET_SCOPE=full', async () => {
      process.env.DEMO_RESET_SCOPE = 'full'
      const response = await POST(createCronRequest(`Bearer ${CRON_SECRET}`))
      const body = await response.json()
      expect(response.status).toBe(200)
      expect(body).toEqual({ success: true, scope: 'FULL', ...FULL_RESET_SUMMARY })
      expect(mockResetDemoData).toHaveBeenCalledTimes(1)
      expect(mockResetDemoWorld).not.toHaveBeenCalled()
    })

    it('returns 500 without leaking details when the reset fails', async () => {
      mockResetDemoWorld.mockRejectedValueOnce(new Error('db exploded'))
      const response = await POST(createCronRequest(`Bearer ${CRON_SECRET}`))
      const body = await response.json()
      expect(response.status).toBe(500)
      expect(body).toEqual({ success: false, error: 'Demo reset failed' })
    })
  })
})
