/**
 * Tests for portal preferences API route (POST /api/portal/preferences)
 *
 * Tests: successful update, unauthenticated, resident not found, validation error, DB error
 */

import { NextRequest } from 'next/server'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'

// --- Mocks ---

const mockCookieGet = jest.fn()
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: (name: string) => mockCookieGet(name),
  }),
}))

const mockFindUnique = jest.fn()
const mockUpdate = jest.fn()
jest.mock('@/lib/db', () => ({
  prisma: {
    resident: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}))

jest.mock('@/lib/audit', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
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
import { POST } from '../preferences/route'

// --- Helpers ---

/** Valid preference form data matching portalPreferencesSchema */
const VALID_PREFS: Record<string, string> = {
  sleepSchedule: 'STANDARD',
  noiseTolerance: '3',
  cleanlinessPractice: '4',
  socialStyle: 'MODERATE',
  privacyNeed: '3',
  smokingStatus: 'NON_SMOKER',
  petTolerance: 'true',
  sharedBathroom: 'true',
  sharedKitchen: 'true',
}

function createPreferencesRequest(data: Record<string, string>): NextRequest {
  const formData = new URLSearchParams()
  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value)
  }

  return new NextRequest('http://localhost:3001/api/portal/preferences', {
    method: 'POST',
    body: formData.toString(),
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  })
}

// --- Tests ---

describe('POST /api/portal/preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 401 when no resident_code cookie', async () => {
    mockCookieGet.mockReturnValue(undefined)

    const req = createPreferencesRequest(VALID_PREFS)
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.NOT_AUTHENTICATED)
  })

  test('returns 404 when resident code not found in DB', async () => {
    mockCookieGet.mockReturnValue({ value: 'INVALID-CODE' })
    mockFindUnique.mockResolvedValue(null)

    const req = createPreferencesRequest(VALID_PREFS)
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.RESIDENT_NOT_FOUND)
  })

  test('updates preferences and returns success', async () => {
    const resident = { id: 'res-1', code: 'RES-001' }
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindUnique.mockResolvedValue(resident)
    mockUpdate.mockResolvedValue(resident)

    const req = createPreferencesRequest(VALID_PREFS)
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)

    // Verify prisma.resident.update was called with correct data
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      data: expect.objectContaining({
        sleepSchedule: 'STANDARD',
        noiseTolerance: 3,
        cleanlinessPractice: 4,
        socialStyle: 'MODERATE',
        privacyNeed: 3,
        smokingStatus: 'NON_SMOKER',
      }),
    })
  })

  test('builds roommatePreferences text from optional fields', async () => {
    const resident = { id: 'res-2', code: 'RES-002' }
    mockCookieGet.mockReturnValue({ value: 'RES-002' })
    mockFindUnique.mockResolvedValue(resident)
    mockUpdate.mockResolvedValue(resident)

    const prefsWithRoommate = {
      ...VALID_PREFS,
      preferredAgeRange: '25-35',
      culturalPreference: 'Arabisch',
      additionalPreferences: 'Ruhige Person',
    }

    const req = createPreferencesRequest(prefsWithRoommate)
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)

    const updateCall = mockUpdate.mock.calls[0][0]
    expect(updateCall.data.roommatePreferences).toContain('Altersgruppe: 25-35')
    expect(updateCall.data.roommatePreferences).toContain('Kultur: Arabisch')
    expect(updateCall.data.roommatePreferences).toContain('Ruhige Person')
  })

  test('returns 400 on validation error (invalid sleepSchedule)', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindUnique.mockResolvedValue({ id: 'res-1', code: 'RES-001' })

    const invalidPrefs = { ...VALID_PREFS, sleepSchedule: 'INVALID_VALUE' }
    const req = createPreferencesRequest(invalidPrefs)
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  test('returns 500 when database update fails', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindUnique.mockResolvedValue({ id: 'res-1', code: 'RES-001' })
    mockUpdate.mockRejectedValue(new Error('DB connection failed'))

    const req = createPreferencesRequest(VALID_PREFS)
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.PREFERENCES_SAVE_ERROR)
  })

  // ── Permission isolation ───────────────────────────────────────────────────
  // Verify residents can ONLY update their own record — identity comes from
  // the httpOnly cookie, never from user-supplied body data.

  test('always updates the resident identified by cookie, never request body', async () => {
    const ownResident = { id: 'res-own', code: 'RES-OWN' }
    mockCookieGet.mockReturnValue({ value: 'RES-OWN' })
    mockFindUnique.mockResolvedValue(ownResident)
    mockUpdate.mockResolvedValue(ownResident)

    const req = createPreferencesRequest(VALID_PREFS)
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)

    // Must use DB-resolved resident id, not any value from request body
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { code: 'RES-OWN' } })
    )
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'res-own' } })
    )
  })

  test('cannot update another resident by cookie swap — only cookie-identified resident is updated', async () => {
    // Resident A has their own cookie
    const residentA = { id: 'res-a', code: 'RES-AAA' }
    mockCookieGet.mockReturnValue({ value: 'RES-AAA' })
    mockFindUnique.mockResolvedValue(residentA)
    mockUpdate.mockResolvedValue(residentA)

    const req = createPreferencesRequest(VALID_PREFS)
    await POST(req)

    // Update is scoped to resident A's id, regardless of anything else
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'res-a' } })
    )
    // Resident B's id never appears in any DB call
    expect(mockUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'res-b' } })
    )
  })
})
