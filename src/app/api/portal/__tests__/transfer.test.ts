/**
 * Tests for portal transfer API route (POST /api/portal/transfer)
 *
 * Tests: auth, validation, resident lookup, placement check,
 * duplicate pending check, audit logging, DB errors
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

const mockFindFirst = jest.fn()
const mockTransferCreate = jest.fn()
const mockHousingUnitFindFirst = jest.fn()
jest.mock('@/lib/db', () => ({
  ...jest.requireActual<object>('@/lib/db'),
  db: {
    query: {
      resident: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
      housingUnit: {
        findFirst: (...args: unknown[]) => mockHousingUnitFindFirst(...args),
      },
    },
    insert: jest.fn(() => ({
      values: (v: unknown) => ({
        returning: (): Promise<unknown[]> => mockTransferCreate(v),
      }),
    })),
  },
}))

const mockLogAudit = jest.fn().mockResolvedValue(undefined)
jest.mock('@/lib/audit', () => ({
  logAudit: (...args: unknown[]) => mockLogAudit(...args),
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

jest.mock('@/lib/email', () => ({
  notifyStaff: jest.fn(),
  newTransferRequestNotification: jest
    .fn()
    .mockReturnValue({ subject: 'test', html: '<p>test</p>' }),
}))

// --- Import after mocks ---
import { POST } from '../transfer/route'

// --- Helpers ---

function createTransferRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3001/api/portal/transfer', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

/** Resident with active placement and no pending transfer requests */
const RESIDENT_WITH_PLACEMENT = {
  id: 'res-1',
  code: 'RES-001',
  placements: [{ id: 'pl-1', housingUnitId: 'hu-1', status: 'ACTIVE' }],
  transferRequests: [],
}

/** Resident with active placement but already has a pending transfer request */
const RESIDENT_WITH_PENDING_TRANSFER = {
  id: 'res-2',
  code: 'RES-002',
  placements: [{ id: 'pl-2', housingUnitId: 'hu-1', status: 'ACTIVE' }],
  transferRequests: [{ id: 'tr-existing', status: 'PENDING' }],
}

/** Resident without any active placement */
const RESIDENT_NO_PLACEMENT = {
  id: 'res-3',
  code: 'RES-003',
  placements: [],
  transferRequests: [],
}

const VALID_REASON = 'Ich möchte in eine ruhigere Unterkunft wechseln'

// --- Tests ---

describe('POST /api/portal/transfer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 401 when no resident_code cookie', async () => {
    mockCookieGet.mockReturnValue(undefined)

    const req = createTransferRequest({ reason: VALID_REASON })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.NOT_AUTHENTICATED)
    expect(mockFindFirst).not.toHaveBeenCalled()
  })

  test('returns 400 for invalid input (reason too short)', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })

    const req = createTransferRequest({ reason: 'kurz' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.INVALID_INPUT)
  })

  test('returns 404 when resident not found', async () => {
    mockCookieGet.mockReturnValue({ value: 'UNKNOWN-CODE' })
    mockFindFirst.mockResolvedValue(null)

    const req = createTransferRequest({ reason: VALID_REASON })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.RESIDENT_NOT_FOUND)
  })

  test('returns 400 when no active placement', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-003' })
    mockFindFirst.mockResolvedValue(RESIDENT_NO_PLACEMENT)

    const req = createTransferRequest({ reason: VALID_REASON })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.TRANSFER_REQUEST_NO_PLACEMENT)
  })

  test('returns 409 when pending request already exists', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-002' })
    mockFindFirst.mockResolvedValue(RESIDENT_WITH_PENDING_TRANSFER)

    const req = createTransferRequest({ reason: VALID_REASON })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.TRANSFER_REQUEST_ALREADY_PENDING)
  })

  test('returns 200 with success and id on happy path', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindFirst.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    mockTransferCreate.mockResolvedValue([{ id: 'tr-new' }])
    mockHousingUnitFindFirst.mockResolvedValue({ code: 'WE-001' })

    const req = createTransferRequest({ reason: VALID_REASON })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.id).toBe('tr-new')

    expect(mockTransferCreate).toHaveBeenCalledWith({
      residentId: 'res-1',
      currentPlacementId: 'pl-1',
      targetUnitId: null,
      reason: VALID_REASON,
    })
  })

  test('creates audit log on success', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindFirst.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    mockTransferCreate.mockResolvedValue([{ id: 'tr-audit' }])
    mockHousingUnitFindFirst.mockResolvedValue({ code: 'WE-001' })

    const req = createTransferRequest({ reason: VALID_REASON })
    await POST(req)

    expect(mockLogAudit).toHaveBeenCalledWith({
      action: 'CREATE',
      entity: 'TRANSFER_REQUEST',
      entityId: 'tr-audit',
      changes: { residentCode: 'RES-001', reason: VALID_REASON },
    })
  })

  test('returns 500 on database error', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindFirst.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    mockTransferCreate.mockRejectedValue(new Error('DB connection failed'))

    const req = createTransferRequest({ reason: VALID_REASON })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.TRANSFER_REQUEST_CREATE_ERROR)
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  test('passes targetUnitId when provided', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindFirst.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    mockTransferCreate.mockResolvedValue([{ id: 'tr-target' }])
    mockHousingUnitFindFirst.mockResolvedValue({ code: 'WE-002' })

    const req = createTransferRequest({
      reason: VALID_REASON,
      targetUnitId: 'hu-target',
    })
    await POST(req)

    expect(mockTransferCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        targetUnitId: 'hu-target',
      }),
    )
  })
})
