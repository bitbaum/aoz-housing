/**
 * Tests for resident CSV import API route.
 * Covers: auth check, missing file, validation errors, duplicate codes,
 * successful creation, audit logging.
 */

// --- Mocks ---

const mockGetCurrentUser = jest.fn()
jest.mock('@/lib/auth', () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
  authorizeStaff: async () => {
    const user = await mockGetCurrentUser()
    if (!user) return { ok: false as const, status: 401 as const }
    return { ok: true as const, user }
  },
}))

// Route now uses createMany + a transaction; pre-checks existing codes via
// findMany, and writes AuditLog entries via auditLog.createMany.
const mockResidentFindMany = jest.fn().mockResolvedValue([])
const mockResidentCreateMany = jest.fn().mockResolvedValue({ count: 0 })
const mockAuditLogCreateMany = jest.fn().mockResolvedValue({ count: 0 })
const mockTx = {
  resident: {
    findMany: mockResidentFindMany,
    createMany: mockResidentCreateMany,
  },
  auditLog: {
    createMany: mockAuditLogCreateMany,
  },
}
const mockTransaction = jest.fn(async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx))
jest.mock('@/lib/db', () => ({
  prisma: {
    $transaction: (...args: unknown[]) => mockTransaction(...args as [(tx: typeof mockTx) => Promise<unknown>]),
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
  'code,ageRange,gender,familyStatus,sleepSchedule,noiseTolerance,cleanlinessPractice,socialStyle,smokingStatus,mobilityNeeds,languages'

const STAFF_USER = {
  id: 'user-1',
  email: 'staff@aoz.ch',
  name: 'Staff',
  role: 'ADMIN' as const,
  scope: 'ALL_DOMAINS' as const,
  isSystemAdmin: true,
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
    // No existing codes; createMany inserts 1; findMany after insert returns the new row
    mockResidentFindMany
      .mockResolvedValueOnce([]) // pre-check: no duplicates
      .mockResolvedValueOnce([{ id: 'new-res-1', code: 'RES-TEST' }]) // post-insert ID lookup
    mockResidentCreateMany.mockResolvedValue({ count: 1 })
    mockAuditLogCreateMany.mockResolvedValue({ count: 1 })
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

    // Verify bulk insert was called with the validated row payload
    expect(mockResidentCreateMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({
        code: 'RES-TEST',
        ageRange: 'ADULT',
        gender: 'MALE',
        status: 'ACTIVE',
        privacyNeed: 3,
        guestTolerance: 3,
        languages: ['de', 'en'],
      })],
      skipDuplicates: true,
    })

    // The route now also writes AuditLog rows inside the transaction plus a
    // single summary logAudit() afterwards.
    expect(mockAuditLogCreateMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({
        action: 'CREATE',
        entity: 'RESIDENT',
        entityId: 'new-res-1',
        userId: 'user-1',
        changes: { code: 'RES-TEST', source: 'CSV_IMPORT' },
      })],
    })
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        entity: 'RESIDENT',
        entityId: 'CSV_IMPORT_BATCH',
        userId: 'user-1',
        changes: { source: 'CSV_IMPORT', count: 1 },
      })
    )
  })

  it('skips duplicate codes (pre-check detects existing)', async () => {
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)
    // Pre-check reports the code already exists; createMany is not called.
    mockResidentFindMany.mockResolvedValueOnce([{ code: 'RES-TEST' }])

    const csv = `${CSV_HEADER}\n${VALID_CSV_ROW}`
    const file = createCSVFile(csv)
    const request = createRequest(createFormData(file))

    const response = await POST(request)
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.created).toBe(0)
    expect(body.skipped).toBe(1)
    expect(body.errors[0].error).toContain('existiert bereits')
    expect(mockResidentCreateMany).not.toHaveBeenCalled()
  })

  it('handles mixed valid and invalid rows', async () => {
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)
    mockResidentFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'new-res-1', code: 'RES-TEST' }])
    mockResidentCreateMany.mockResolvedValue({ count: 1 })
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
    mockResidentFindMany.mockResolvedValueOnce([])
    mockResidentCreateMany.mockRejectedValueOnce(new Error('DB connection failed'))

    const csv = `${CSV_HEADER}\n${VALID_CSV_ROW}`
    const file = createCSVFile(csv)
    const request = createRequest(createFormData(file))

    const response = await POST(request)
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.created).toBe(0)
    // The whole batch rolled back — one row in, one skipped.
    expect(body.skipped).toBe(1)
    expect(body.errors[0].error).toBe('Import abgebrochen')
  })

  it('coerces numeric fields from CSV strings', async () => {
    mockGetCurrentUser.mockResolvedValue(STAFF_USER)
    mockResidentFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'new-res-1', code: 'RES-COERCE' }])
    mockResidentCreateMany.mockResolvedValue({ count: 1 })
    mockLogAudit.mockResolvedValue(undefined)

    // noiseTolerance and cleanlinessPractice come as strings from CSV
    const csv = `${CSV_HEADER}\nRES-COERCE,ADULT,MALE,SINGLE,STANDARD,3,4,MODERATE,NON_SMOKER,NONE,de`
    const file = createCSVFile(csv)
    const request = createRequest(createFormData(file))

    await POST(request)

    expect(mockResidentCreateMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({
        noiseTolerance: 3,
        cleanlinessPractice: 4,
      })],
      skipDuplicates: true,
    })
  })
})
