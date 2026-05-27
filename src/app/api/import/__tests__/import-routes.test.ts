/**
 * Tests for resident CSV import API route.
 * Covers: auth check, missing file, validation errors, duplicate codes,
 * successful creation, audit logging.
 */

// --- Mocks ---

const mockGetCurrentUser = jest.fn()
jest.mock('@/lib/auth', () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}))

const mockResidentFindUnique = jest.fn()
const mockResidentCreate = jest.fn()
jest.mock('@/lib/db', () => ({
  prisma: {
    resident: {
      findUnique: (...args: unknown[]) => mockResidentFindUnique(...args),
      create: (...args: unknown[]) => mockResidentCreate(...args),
    },
  },
}))

const mockLogAudit = jest.fn()
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

// --- Import after mocks ---
import { POST } from '../../import/residents/route'

// --- Helpers ---

function createCSVFile(content: string): File {
  return new File([content], 'test.csv', { type: 'text/csv' })
}

function createFormData(file: File): FormData {
  const formData = new FormData()
  formData.append('file', file)
  return formData
}

function createRequest(formData: FormData): Request {
  return new Request('http://localhost/api/import/residents', {
    method: 'POST',
    body: formData,
  })
}

const VALID_CSV_ROW =
  'RES-TEST,ADULT,MALE,SINGLE,STANDARD,3,4,MODERATE,NON_SMOKER,NONE,"de,en"'
const CSV_HEADER =
  'code,ageRange,gender,familyStatus,sleepSchedule,noiseTolerance,cleanlinessLevel,socialStyle,smokingStatus,mobilityNeeds,languages'

const STAFF_USER = {
  id: 'user-1',
  email: 'staff@aoz.ch',
  name: 'Staff',
  role: 'ADMIN' as const,
}

describe('POST /api/import/residents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const file = createCSVFile('code\nRES-001')
    const request = createRequest(createFormData(file))

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Nicht authentifiziert')
  })

  it('returns 400 when no file is uploaded', async () => {
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)

    const formData = new FormData()
    const request = createRequest(formData)

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Keine Datei hochgeladen')
  })

  it('returns validation errors for invalid rows', async () => {
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)

    // Missing required fields and invalid enum values
    const csv = `${CSV_HEADER}\n,INVALID_AGE,MALE,SINGLE,STANDARD,3,4,MODERATE,NON_SMOKER,NONE,de`
    const file = createCSVFile(csv)
    const request = createRequest(createFormData(file))

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.skipped).toBe(1)
    expect(body.created).toBe(0)
    expect(body.errors.length).toBeGreaterThan(0)
    expect(body.errors[0].row).toBe(2)
  })

  it('creates valid residents and returns counts', async () => {
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)
    mockResidentFindUnique.mockResolvedValue(null)
    mockResidentCreate.mockResolvedValue({
      id: 'new-res-1',
      code: 'RES-TEST',
    })
    mockLogAudit.mockResolvedValue(undefined)

    const csv = `${CSV_HEADER}\n${VALID_CSV_ROW}`
    const file = createCSVFile(csv)
    const request = createRequest(createFormData(file))

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.created).toBe(1)
    expect(body.skipped).toBe(0)
    expect(body.errors.length).toBe(0)

    // Verify prisma create was called with correct data
    expect(mockResidentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        code: 'RES-TEST',
        ageRange: 'ADULT',
        gender: 'MALE',
        status: 'ACTIVE',
        privacyNeed: 3,
        guestTolerance: 3,
        languages: ['de', 'en'],
      }),
    })

    // Verify audit log
    expect(mockLogAudit).toHaveBeenCalledWith({
      action: 'CREATE',
      entity: 'RESIDENT',
      entityId: 'new-res-1',
      userId: 'user-1',
      changes: { code: 'RES-TEST', source: 'CSV_IMPORT' },
    })
  })

  it('skips duplicate codes', async () => {
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)
    // Simulate Prisma unique-constraint violation (P2002).
    // We avoid importing PrismaClientKnownRequestError directly because the
    // route uses instanceof — instead, construct an object that satisfies the
    // check by setting the prototype chain.
    const { Prisma } = require('@prisma/client')
    const duplicateError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: '5.0.0' }
    )
    mockResidentCreate.mockRejectedValue(duplicateError)

    const csv = `${CSV_HEADER}\n${VALID_CSV_ROW}`
    const file = createCSVFile(csv)
    const request = createRequest(createFormData(file))

    const response = await POST(request)
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.created).toBe(0)
    expect(body.skipped).toBe(1)
    expect(body.errors[0].error).toContain('existiert bereits')
  })

  it('handles mixed valid and invalid rows', async () => {
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)
    mockResidentFindUnique.mockResolvedValue(null)
    mockResidentCreate.mockResolvedValue({
      id: 'new-res-1',
      code: 'RES-TEST',
    })
    mockLogAudit.mockResolvedValue(undefined)

    // First row valid, second row invalid (missing code)
    const csv = `${CSV_HEADER}\n${VALID_CSV_ROW}\n,ADULT,MALE,SINGLE,STANDARD,3,4,MODERATE,NON_SMOKER,NONE,de`
    const file = createCSVFile(csv)
    const request = createRequest(createFormData(file))

    const response = await POST(request)
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.created).toBe(1)
    expect(body.skipped).toBe(1)
  })

  it('handles database errors gracefully', async () => {
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)
    mockResidentFindUnique.mockResolvedValue(null)
    mockResidentCreate.mockRejectedValue(new Error('DB connection failed'))

    const csv = `${CSV_HEADER}\n${VALID_CSV_ROW}`
    const file = createCSVFile(csv)
    const request = createRequest(createFormData(file))

    const response = await POST(request)
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.created).toBe(0)
    expect(body.skipped).toBe(1)
    expect(body.errors[0].error).toBe('Erstellung fehlgeschlagen')
  })

  it('coerces numeric fields from CSV strings', async () => {
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)
    mockResidentFindUnique.mockResolvedValue(null)
    mockResidentCreate.mockResolvedValue({
      id: 'new-res-1',
      code: 'RES-COERCE',
    })
    mockLogAudit.mockResolvedValue(undefined)

    // noiseTolerance and cleanlinessLevel come as strings from CSV
    const csv = `${CSV_HEADER}\nRES-COERCE,ADULT,MALE,SINGLE,STANDARD,3,4,MODERATE,NON_SMOKER,NONE,de`
    const file = createCSVFile(csv)
    const request = createRequest(createFormData(file))

    await POST(request)

    expect(mockResidentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        noiseTolerance: 3,
        cleanlinessLevel: 4,
      }),
    })
  })
})
