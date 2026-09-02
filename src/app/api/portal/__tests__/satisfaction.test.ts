/**
 * Tests for portal satisfaction API route (POST + GET /api/portal/satisfaction)
 *
 * Tests: auth, validation, resident/placement checks, transaction behavior,
 * low-rating incident creation, GET last check-in, DB errors
 */

import { NextRequest } from 'next/server'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// --- Mocks ---

const mockCookieGet = vi.fn()
vi.mock('next/headers', async () => ({
  cookies: vi.fn().mockResolvedValue({
    get: (name: string) => mockCookieGet(name),
  }),
}))

// Transaction mock objects — these are used inside the db.transaction callback.
// The tx inserts the check-in and (for low ratings) an incident — both awaited
// on .values() — and updates the placement via .set().where(). Create mocks
// receive the values payload; the update mock receives { set, where }.
const mockTxSatisfactionCheckInCreate = vi.fn()
const mockTxPlacementUpdate = vi.fn()
const mockTxIncidentCreate = vi.fn()
const tx = {
  insert: (table: unknown) => ({
    values: (v: unknown): Promise<unknown> =>
      table === satisfactionCheckInTable
        ? mockTxSatisfactionCheckInCreate(v)
        : mockTxIncidentCreate(v),
  }),
  update: () => ({
    set: (v: unknown) => ({
      where: (w: unknown): Promise<unknown> => mockTxPlacementUpdate({ set: v, where: w }),
    }),
  }),
}

const mockFindFirst = vi.fn()
const mockTransaction = vi.fn()
vi.mock('@/lib/db', async () => ({
  ...(await vi.importActual<object>('@/lib/db')),
  db: {
    query: {
      resident: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

vi.mock('@/lib/logger', async () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    errorWithCause: vi.fn(),
  },
}))

const mockSafeParse = vi.fn()
vi.mock('@/lib/validation/schemas', async () => ({
  portalSatisfactionSchema: {
    safeParse: (...args: unknown[]) => mockSafeParse(...args),
  },
}))

vi.mock('@/lib/email', async () => ({
  notifyStaff: vi.fn().mockResolvedValue(true),
  lowSatisfactionAlert: vi.fn().mockReturnValue({ subject: 'test', html: '<p>test</p>' }),
}))

// --- Import after mocks ---
import { POST, GET } from '../satisfaction/route'
import {
  placement as placementTable,
  satisfactionCheckIn as satisfactionCheckInTable,
} from '@/lib/db'
import { eq } from 'drizzle-orm'

// --- Helpers ---

function createJsonRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3001/api/portal/satisfaction', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

/** Resident with an active placement (startDate 10 weeks ago for weekNumber calculation) */
const TEN_WEEKS_AGO = new Date(Date.now() - 10 * 7 * 24 * 60 * 60 * 1000).toISOString()
const RESIDENT_WITH_PLACEMENT = {
  id: 'res-1',
  code: 'RES-001',
  placements: [
    {
      id: 'pl-1',
      housingUnitId: 'hu-1',
      housingUnit: { code: 'WE-001' },
      status: 'ACTIVE',
      startDate: TEN_WEEKS_AGO,
      satisfactionRating: 4,
      checkIns: [{ createdAt: '2026-02-01T10:00:00.000Z' }],
    },
  ],
}

const RESIDENT_NO_PLACEMENT = {
  id: 'res-2',
  code: 'RES-002',
  placements: [],
}

// --- POST Tests ---

describe('POST /api/portal/satisfaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: transaction passes the callback through with our mock tx
    mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
      return cb(tx)
    })
  })

  test('returns 401 when no resident_code cookie', async () => {
    mockCookieGet.mockReturnValue(undefined)

    const req = createJsonRequest({ rating: 4 })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.NOT_AUTHENTICATED)
    expect(mockFindFirst).not.toHaveBeenCalled()
  })

  test('returns 400 when validation fails', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockSafeParse.mockReturnValue({ success: false, error: { issues: [] } })

    const req = createJsonRequest({ rating: 99 })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.INVALID_RATING)
    expect(mockFindFirst).not.toHaveBeenCalled()
  })

  test('returns 404 when resident not found', async () => {
    mockCookieGet.mockReturnValue({ value: 'UNKNOWN' })
    mockSafeParse.mockReturnValue({ success: true, data: { rating: 4, concerns: null } })
    mockFindFirst.mockResolvedValue(null)

    const req = createJsonRequest({ rating: 4 })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.RESIDENT_NOT_FOUND)
  })

  test('returns 400 when no active placement', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-002' })
    mockSafeParse.mockReturnValue({ success: true, data: { rating: 3, concerns: null } })
    mockFindFirst.mockResolvedValue(RESIDENT_NO_PLACEMENT)

    const req = createJsonRequest({ rating: 3 })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.NO_ACTIVE_PLACEMENT)
  })

  test('saves rating and returns success with rating value', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockSafeParse.mockReturnValue({ success: true, data: { rating: 4, concerns: null } })
    mockFindFirst.mockResolvedValue(RESIDENT_WITH_PLACEMENT)

    const req = createJsonRequest({ rating: 4 })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.rating).toBe(4)

    // Verify the check-in insert was called
    expect(mockTxSatisfactionCheckInCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        placementId: 'pl-1',
        checkInType: 'AD_HOC',
        overallSatisfaction: 4,
        isAnonymous: true,
      }),
    )

    // Verify the placement update was called
    expect(mockTxPlacementUpdate).toHaveBeenCalledWith({
      set: { satisfactionRating: 4 },
      where: eq(placementTable.id, 'pl-1'),
    })

    // Should NOT create an incident for rating > 2
    expect(mockTxIncidentCreate).not.toHaveBeenCalled()
  })

  test('creates incident for low rating (rating = 2)', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockSafeParse.mockReturnValue({ success: true, data: { rating: 2, concerns: 'Lärm nachts' } })
    mockFindFirst.mockResolvedValue(RESIDENT_WITH_PLACEMENT)

    const req = createJsonRequest({ rating: 2, concerns: 'Lärm nachts' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.rating).toBe(2)

    // Should create an incident with MEDIUM severity for rating 2
    expect(mockTxIncidentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        housingUnitId: 'hu-1',
        reportedById: 'res-1',
        category: 'WELLBEING',
        type: 'LOW_SATISFACTION',
        severity: 'MEDIUM',
      }),
    )

    // Description should include the concerns text
    const incidentData = mockTxIncidentCreate.mock.calls[0][0]
    expect(incidentData.description).toContain('Lärm nachts')
  })

  test('creates incident with HIGH severity for rating = 1', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockSafeParse.mockReturnValue({ success: true, data: { rating: 1, concerns: null } })
    mockFindFirst.mockResolvedValue(RESIDENT_WITH_PLACEMENT)

    const req = createJsonRequest({ rating: 1 })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)

    expect(mockTxIncidentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'HIGH',
        category: 'WELLBEING',
        type: 'LOW_SATISFACTION',
      }),
    )

    // No concerns provided — should use fallback description
    const incidentData = mockTxIncidentCreate.mock.calls[0][0]
    expect(incidentData.description).toContain('keine Details angegeben')
  })

  test('does not create incident for rating = 3', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockSafeParse.mockReturnValue({ success: true, data: { rating: 3, concerns: null } })
    mockFindFirst.mockResolvedValue(RESIDENT_WITH_PLACEMENT)

    const req = createJsonRequest({ rating: 3 })
    await POST(req)

    expect(mockTxIncidentCreate).not.toHaveBeenCalled()
  })

  test('passes concerns to check-in when provided', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockSafeParse.mockReturnValue({
      success: true,
      data: { rating: 4, concerns: 'Küche ist oft schmutzig' },
    })
    mockFindFirst.mockResolvedValue(RESIDENT_WITH_PLACEMENT)

    const req = createJsonRequest({ rating: 4, concerns: 'Küche ist oft schmutzig' })
    await POST(req)

    const checkInData = mockTxSatisfactionCheckInCreate.mock.calls[0][0]
    expect(checkInData.concerns).toBe('Küche ist oft schmutzig')
  })

  test('returns 500 on database transaction error', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockSafeParse.mockReturnValue({ success: true, data: { rating: 5, concerns: null } })
    mockFindFirst.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    mockTransaction.mockRejectedValue(new Error('Transaction failed'))

    const req = createJsonRequest({ rating: 5 })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.SAVE_FAILED)
  })
})

// --- GET Tests ---

describe('GET /api/portal/satisfaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns 401 when no resident_code cookie', async () => {
    mockCookieGet.mockReturnValue(undefined)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.NOT_AUTHENTICATED)
  })

  test('returns null values when resident not found', async () => {
    mockCookieGet.mockReturnValue({ value: 'UNKNOWN' })
    mockFindFirst.mockResolvedValue(null)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.lastCheckIn).toBeNull()
    expect(body.rating).toBeNull()
  })

  test('returns null values when no active placement', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-002' })
    mockFindFirst.mockResolvedValue(RESIDENT_NO_PLACEMENT)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.lastCheckIn).toBeNull()
    expect(body.rating).toBeNull()
  })

  test('returns lastCheckIn and rating when data exists', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindFirst.mockResolvedValue(RESIDENT_WITH_PLACEMENT)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.lastCheckIn).toBe('2026-02-01T10:00:00.000Z')
    expect(body.rating).toBe(4)
  })

  test('returns null lastCheckIn when no check-ins exist', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindFirst.mockResolvedValue({
      id: 'res-1',
      code: 'RES-001',
      placements: [
        {
          id: 'pl-1',
          status: 'ACTIVE',
          satisfactionRating: null,
          checkIns: [],
        },
      ],
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.lastCheckIn).toBeNull()
    expect(body.rating).toBeNull()
  })
})
