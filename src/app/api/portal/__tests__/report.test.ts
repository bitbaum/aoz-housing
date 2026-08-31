/**
 * Tests for portal report API route (POST /api/portal/report)
 *
 * Tests: auth, resident lookup, placement check, validation,
 * maintenance location prefix, mediation note, audit logging, DB errors
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
const mockIncidentCreate = jest.fn()
const mockMaintenanceCreate = jest.fn()
const mockPlacementFindFirst = jest.fn()
jest.mock('@/lib/db', () => ({
  prisma: {
    resident: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    incident: {
      create: (...args: unknown[]) => mockIncidentCreate(...args),
    },
    maintenanceRequest: {
      create: (...args: unknown[]) => mockMaintenanceCreate(...args),
    },
    placement: {
      findFirst: (...args: unknown[]) => mockPlacementFindFirst(...args),
    },
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

const mockNotifyStaff = jest.fn().mockResolvedValue(true)
const mockNewIncidentNotification = jest.fn().mockReturnValue({
  subject: '[AOZ Housing] Neuer Vorfall',
  html: '<p>test</p>',
})
const mockNewMaintenanceNotification = jest.fn().mockReturnValue({
  subject: '[AOZ Housing] Neue Wartungsanfrage',
  html: '<p>test</p>',
})
jest.mock('@/lib/email', () => ({
  notifyStaff: (...args: unknown[]) => mockNotifyStaff(...args),
  newIncidentNotification: (...args: unknown[]) => mockNewIncidentNotification(...args),
  newMaintenanceRequestNotification: (...args: unknown[]) =>
    mockNewMaintenanceNotification(...args),
}))

// Mock validation — the route uses validateFormData + ValidationError
const mockValidateFormData = jest.fn()
const MockValidationError = class ValidationError extends Error {
  fieldErrors: Record<string, string[] | undefined>
  constructor(message: string, fieldErrors: Record<string, string[] | undefined> = {}) {
    super(message)
    this.fieldErrors = fieldErrors
  }
}
jest.mock('@/lib/validation/schemas', () => ({
  portalReportSchema: {},
  validateFormData: (...args: unknown[]) => mockValidateFormData(...args),
  ValidationError: MockValidationError,
}))

// Mock PORTAL_LABELS with the locations the route looks up
jest.mock('@/lib/constants', () => ({
  PORTAL_LABELS: {
    report: {
      locations: [
        { value: 'room', label: 'Mein Zimmer' },
        { value: 'bathroom', label: 'Badezimmer' },
        { value: 'kitchen', label: 'Küche' },
        { value: 'common', label: 'Gemeinschaftsraum' },
        { value: 'entrance', label: 'Eingang / Flur' },
        { value: 'other', label: 'Anderer Ort' },
      ],
    },
  },
  INCIDENT_TYPE_LABELS: { PLUMBING: 'Sanitär', GENERAL_MAINTENANCE: 'Allgemeine Wartung' },
  getLabel: (labels: Record<string, string>, key: string) => labels[key] ?? key,
}))

// --- Import after mocks ---
import { POST } from '../report/route'

// --- Helpers ---

function createFormDataRequest(data: Record<string, string>): NextRequest {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value)
  }
  return new NextRequest('http://localhost:3001/api/portal/report', {
    method: 'POST',
    body: formData,
  })
}

/** Resident with an active placement */
const RESIDENT_WITH_PLACEMENT = {
  id: 'res-1',
  code: 'RES-001',
  placements: [
    { id: 'pl-1', housingUnitId: 'hu-1', status: 'ACTIVE', housingUnit: { code: 'WE-001' } },
  ],
}

/** Resident without any active placement */
const RESIDENT_NO_PLACEMENT = {
  id: 'res-2',
  code: 'RES-002',
  placements: [],
}

// --- Tests ---

describe('POST /api/portal/report', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 401 when no resident_code cookie', async () => {
    mockCookieGet.mockReturnValue(undefined)

    const req = createFormDataRequest({ description: 'test' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.NOT_AUTHENTICATED)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  test('returns 404 when resident not found', async () => {
    mockCookieGet.mockReturnValue({ value: 'UNKNOWN-CODE' })
    mockFindUnique.mockResolvedValue(null)

    const req = createFormDataRequest({ description: 'test' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.RESIDENT_NOT_FOUND)
  })

  test('returns 400 when no active placement', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-002' })
    mockFindUnique.mockResolvedValue(RESIDENT_NO_PLACEMENT)

    const req = createFormDataRequest({ description: 'test' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.NO_ACTIVE_PLACEMENT)
  })

  test('returns 400 when validation fails with ValidationError', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindUnique.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    mockValidateFormData.mockImplementation(() => {
      throw new MockValidationError('Beschreibung ist erforderlich')
    })

    const req = createFormDataRequest({ description: '' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Beschreibung ist erforderlich')
  })

  test('returns 400 with generic message for non-validation errors during parsing', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindUnique.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    mockValidateFormData.mockImplementation(() => {
      throw new Error('Unexpected parse failure')
    })

    const req = createFormDataRequest({ description: 'test' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.INVALID_INPUT)
  })

  test('a broken tap becomes a MAINTENANCE REQUEST, not an incident', async () => {
    // The staff maintenance board reads MaintenanceRequest. Filing this as an
    // Incident left the report invisible to the people who fix things, and
    // inflated the incident count AOZ uses to measure conflict.
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindUnique.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    mockValidateFormData.mockReturnValue({
      category: 'MAINTENANCE',
      type: 'PLUMBING',
      severity: 'MEDIUM',
      description: 'Wasserhahn tropft',
      location: 'kitchen',
      incidentDate: null,
    })
    mockMaintenanceCreate.mockResolvedValue({
      id: 'mr-1',
      category: 'PLUMBING',
      priority: 'NORMAL',
      title: 'Sanitär',
    })

    const req = createFormDataRequest({ description: 'Wasserhahn tropft' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockIncidentCreate).not.toHaveBeenCalled()

    expect(mockMaintenanceCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        housingUnitId: 'hu-1',
        reportedById: 'res-1',
        category: 'PLUMBING',
        priority: 'NORMAL',
        title: 'Sanitär',
        // The board has its own location column, so the text stays clean.
        description: 'Wasserhahn tropft',
        location: 'Küche',
      }),
    })
  })

  test("severity maps onto the maintenance board's own urgency scale", async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindUnique.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    mockValidateFormData.mockReturnValue({
      category: 'MAINTENANCE',
      type: 'PLUMBING',
      severity: 'CRITICAL',
      description: 'Wasser läuft aus der Decke',
      location: 'bathroom',
      incidentDate: null,
    })
    mockMaintenanceCreate.mockResolvedValue({
      id: 'mr-2',
      category: 'PLUMBING',
      priority: 'URGENT',
      title: 'Sanitär',
    })

    await POST(createFormDataRequest({ description: 'x' }))

    expect(mockMaintenanceCreate.mock.calls[0][0].data.priority).toBe('URGENT')
  })

  test('notifies staff about maintenance as a request, not as a Vorfall', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindUnique.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    mockValidateFormData.mockReturnValue({
      category: 'MAINTENANCE',
      type: 'PLUMBING',
      severity: 'MEDIUM',
      description: 'Wasserhahn tropft',
      location: 'kitchen',
      incidentDate: null,
    })
    mockMaintenanceCreate.mockResolvedValue({
      id: 'mr-3',
      category: 'PLUMBING',
      priority: 'NORMAL',
      title: 'Sanitär',
    })

    await POST(createFormDataRequest({ description: 'x' }))

    expect(mockNewMaintenanceNotification).toHaveBeenCalled()
    expect(mockNewIncidentNotification).not.toHaveBeenCalled()
    expect(mockNotifyStaff).toHaveBeenCalled()
  })

  test('creates interpersonal incident with mediation note appended', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindUnique.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    mockValidateFormData.mockReturnValue({
      category: 'INTERPERSONAL',
      type: 'NOISE_COMPLAINT',
      severity: 'HIGH',
      description: 'Laute Musik nach 22 Uhr',
      requestMediation: true,
      involvedResident: 'external',
      incidentDate: null,
    })
    mockIncidentCreate.mockResolvedValue({ id: 'inc-2' })

    const req = createFormDataRequest({ description: 'Laute Musik nach 22 Uhr' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)

    // Description should have mediation note appended
    const createCall = mockIncidentCreate.mock.calls[0][0]
    expect(createCall.data.description).toContain('Laute Musik nach 22 Uhr')
    expect(createCall.data.description).toContain('[Bewohner wünscht Vermittlungsgespräch]')

    // involvedResident === 'external' should result in null subjectId
    expect(createCall.data.subjectId).toBeNull()
  })

  test('sets subjectId when involvedResident is a roommate in the same unit', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindUnique.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    // Validation lookup: res-99 IS in the same unit, so insert proceeds.
    mockPlacementFindFirst.mockResolvedValue({ residentId: 'res-99' })
    mockValidateFormData.mockReturnValue({
      category: 'INTERPERSONAL',
      type: 'PERSONAL_CONFLICT',
      severity: 'MEDIUM',
      description: 'Streit um Küchenutzung',
      involvedResident: 'res-99',
      requestMediation: false,
      incidentDate: null,
    })
    mockIncidentCreate.mockResolvedValue({ id: 'inc-3' })

    const req = createFormDataRequest({ description: 'Streit' })
    await POST(req)

    const createCall = mockIncidentCreate.mock.calls[0][0]
    expect(createCall.data.subjectId).toBe('res-99')
  })

  test('rejects involvedResident that does not live in the same unit', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindUnique.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    // Validation lookup: stranger NOT in this unit → null.
    mockPlacementFindFirst.mockResolvedValue(null)
    mockValidateFormData.mockReturnValue({
      category: 'INTERPERSONAL',
      type: 'PERSONAL_CONFLICT',
      severity: 'MEDIUM',
      description: 'Streit',
      involvedResident: 'res-strange',
      requestMediation: false,
      incidentDate: null,
    })

    const req = createFormDataRequest({ description: 'Streit' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    expect(mockIncidentCreate).not.toHaveBeenCalled()
  })

  test('uses provided incidentDate when present', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindUnique.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    mockValidateFormData.mockReturnValue({
      category: 'INTERPERSONAL',
      type: 'SCHEDULE_CONFLICT',
      severity: 'LOW',
      description: 'Streit um Duschzeiten',
      involvedResident: 'external',
      requestMediation: false,
      incidentDate: '2026-01-15',
    })
    mockIncidentCreate.mockResolvedValue({ id: 'inc-4' })

    const req = createFormDataRequest({ description: 'Streit um Duschzeiten' })
    await POST(req)

    const createCall = mockIncidentCreate.mock.calls[0][0]
    expect(createCall.data.date).toEqual(new Date('2026-01-15'))
  })

  test('calls logAudit with correct data after incident creation', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindUnique.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    mockValidateFormData.mockReturnValue({
      category: 'INTERPERSONAL',
      type: 'SPACE_DISPUTE',
      severity: 'HIGH',
      description: 'Streit um den Kühlschrank',
      involvedResident: 'external',
      requestMediation: false,
      incidentDate: null,
    })
    mockIncidentCreate.mockResolvedValue({ id: 'inc-audit' })

    const req = createFormDataRequest({ description: 'Streit um den Kühlschrank' })
    await POST(req)

    expect(mockLogAudit).toHaveBeenCalledWith({
      action: 'CREATE',
      entity: 'INCIDENT',
      entityId: 'inc-audit',
      changes: {
        category: 'INTERPERSONAL',
        type: 'SPACE_DISPUTE',
        severity: 'HIGH',
        reportedBy: 'RES-001',
        subjectId: null,
        description: 'Streit um den Kühlschrank',
        requestedMediation: false,
      },
    })
  })

  test('audits a maintenance report against the maintenance entity', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindUnique.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    mockValidateFormData.mockReturnValue({
      category: 'MAINTENANCE',
      type: 'PLUMBING',
      severity: 'HIGH',
      description: 'Rohrbruch',
      location: 'bathroom',
      requestMediation: false,
      incidentDate: null,
    })
    mockMaintenanceCreate.mockResolvedValue({
      id: 'mr-audit',
      category: 'PLUMBING',
      priority: 'HIGH',
      title: 'Sanitär',
    })

    await POST(createFormDataRequest({ description: 'Rohrbruch' }))

    expect(mockLogAudit).toHaveBeenCalledWith({
      action: 'CREATE',
      entity: 'MAINTENANCE',
      entityId: 'mr-audit',
      changes: {
        category: 'PLUMBING',
        priority: 'HIGH',
        reportedBy: 'RES-001',
        description: 'Rohrbruch',
      },
    })
  })

  test('sends staff notification after successful incident creation', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindUnique.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    mockValidateFormData.mockReturnValue({
      category: 'INTERPERSONAL',
      type: 'NOISE_COMPLAINT',
      severity: 'HIGH',
      description: 'Laute Musik',
      requestMediation: true,
      involvedResident: 'external',
      incidentDate: null,
    })
    mockIncidentCreate.mockResolvedValue({ id: 'inc-notify' })

    const req = createFormDataRequest({ description: 'Laute Musik' })
    await POST(req)

    // Wait for fire-and-forget promise
    await new Promise((r) => setTimeout(r, 0))

    expect(mockNewIncidentNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        residentCode: 'RES-001',
        housingUnitCode: 'WE-001',
        category: 'INTERPERSONAL',
        type: 'NOISE_COMPLAINT',
        severity: 'HIGH',
        requestedMediation: true,
      }),
    )
    expect(mockNotifyStaff).toHaveBeenCalledWith('[AOZ Housing] Neuer Vorfall', '<p>test</p>')
  })

  test('returns 500 when prisma.incident.create fails', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindUnique.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    mockValidateFormData.mockReturnValue({
      category: 'INTERPERSONAL',
      type: 'CULTURAL_FRICTION',
      severity: 'LOW',
      description: 'Missverständnis in der Küche',
      involvedResident: 'external',
      requestMediation: false,
      incidentDate: null,
    })
    mockIncidentCreate.mockRejectedValue(new Error('DB connection failed'))

    const req = createFormDataRequest({ description: 'Missverständnis in der Küche' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe(ERROR_MESSAGES.REPORT_SAVE_ERROR)
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  test('falls back to location value when label not found in PORTAL_LABELS', async () => {
    mockCookieGet.mockReturnValue({ value: 'RES-001' })
    mockFindUnique.mockResolvedValue(RESIDENT_WITH_PLACEMENT)
    mockValidateFormData.mockReturnValue({
      category: 'MAINTENANCE',
      type: 'GENERAL_MAINTENANCE',
      severity: 'LOW',
      description: 'Problem im Keller',
      location: 'basement', // not in the locations array
      incidentDate: null,
    })
    mockMaintenanceCreate.mockResolvedValue({
      id: 'mr-5',
      category: 'OTHER',
      priority: 'LOW',
      title: 'Allgemeine Wartung',
    })

    const req = createFormDataRequest({ description: 'Problem im Keller' })
    await POST(req)

    // Falls back to the raw value when no matching label
    expect(mockMaintenanceCreate.mock.calls[0][0].data.location).toBe('basement')
  })
})
