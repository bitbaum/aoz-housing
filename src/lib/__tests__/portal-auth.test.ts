/**
 * Tests for getPortalAuth (src/lib/portal-auth.ts)
 *
 * This is the security boundary for all portal routes — it reads the
 * resident_code cookie and validates it against the database.
 * Every code path must be verified.
 */

import { getPortalAuth } from '../portal-auth'
import { eqParts, whereParts } from '@/test-utils/drizzle-where'

// =============================================================================
// MOCKS
// =============================================================================

const mockGet = jest.fn()
const mockCookies = jest.fn().mockResolvedValue({ get: mockGet })

jest.mock('next/headers', () => ({
  cookies: () => mockCookies(),
}))

const mockResidentFindFirst = jest.fn()

jest.mock('@/lib/db', () => ({
  ...jest.requireActual<object>('@/lib/db'),
  db: {
    query: {
      resident: { findFirst: (...args: unknown[]) => mockResidentFindFirst(...args) },
    },
  },
}))

// =============================================================================
// HELPERS
// =============================================================================

const RESIDENT_CODE = 'RES-001'

const RESIDENT_WITH_PLACEMENT = {
  id: 'res-id-1',
  code: RESIDENT_CODE,
  placements: [{ id: 'placement-id-1', housingUnitId: 'unit-id-1' }],
}

const RESIDENT_WITHOUT_PLACEMENT = {
  id: 'res-id-2',
  code: 'RES-002',
  placements: [],
}

// =============================================================================
// TESTS
// =============================================================================

describe('getPortalAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── Cookie absent ─────────────────────────────────────────────────────────

  test('returns null when resident_code cookie is not set', async () => {
    mockGet.mockReturnValue(undefined)

    const result = await getPortalAuth()

    expect(result).toBeNull()
    expect(mockResidentFindFirst).not.toHaveBeenCalled()
  })

  test('returns null when resident_code cookie has no value', async () => {
    mockGet.mockReturnValue({ value: undefined })

    const result = await getPortalAuth()

    expect(result).toBeNull()
    expect(mockResidentFindFirst).not.toHaveBeenCalled()
  })

  // ── Resident not found ────────────────────────────────────────────────────

  test('returns null when resident code does not match any resident', async () => {
    mockGet.mockReturnValue({ value: 'RES-INVALID' })
    mockResidentFindFirst.mockResolvedValue(null)

    const result = await getPortalAuth()

    expect(result).toBeNull()
  })

  test('queries resident by exact code from cookie', async () => {
    mockGet.mockReturnValue({ value: RESIDENT_CODE })
    mockResidentFindFirst.mockResolvedValue(null)

    await getPortalAuth()

    const { where } = mockResidentFindFirst.mock.calls[0][0]
    expect(eqParts(where)).toEqual({ column: 'code', value: RESIDENT_CODE })
  })

  // ── Resident found but no active placement ────────────────────────────────

  test('returns null when resident has no active placement', async () => {
    mockGet.mockReturnValue({ value: 'RES-002' })
    mockResidentFindFirst.mockResolvedValue(RESIDENT_WITHOUT_PLACEMENT)

    const result = await getPortalAuth()

    expect(result).toBeNull()
  })

  // ── Happy path ────────────────────────────────────────────────────────────

  test('returns resident and placement when authentication succeeds', async () => {
    mockGet.mockReturnValue({ value: RESIDENT_CODE })
    mockResidentFindFirst.mockResolvedValue(RESIDENT_WITH_PLACEMENT)

    const result = await getPortalAuth()

    expect(result).not.toBeNull()
    expect(result!.resident.id).toBe('res-id-1')
    expect(result!.resident.code).toBe(RESIDENT_CODE)
    expect(result!.placement.id).toBe('placement-id-1')
    expect(result!.placement.housingUnitId).toBe('unit-id-1')
  })

  test('uses the first active placement when multiple exist', async () => {
    mockGet.mockReturnValue({ value: RESIDENT_CODE })
    mockResidentFindFirst.mockResolvedValue({
      ...RESIDENT_WITH_PLACEMENT,
      placements: [
        { id: 'placement-id-1', housingUnitId: 'unit-id-1' },
        { id: 'placement-id-2', housingUnitId: 'unit-id-2' },
      ],
    })

    const result = await getPortalAuth()

    expect(result!.placement.id).toBe('placement-id-1')
  })

  // ── Query correctness ─────────────────────────────────────────────────────

  test('only selects active placements in the query', async () => {
    mockGet.mockReturnValue({ value: RESIDENT_CODE })
    mockResidentFindFirst.mockResolvedValue(RESIDENT_WITH_PLACEMENT)

    await getPortalAuth()

    const call = mockResidentFindFirst.mock.calls[0][0]
    expect(whereParts(call.with.placements.where)).toEqual({ status: 'ACTIVE' })
  })

  test('limits placement query to 1 record', async () => {
    mockGet.mockReturnValue({ value: RESIDENT_CODE })
    mockResidentFindFirst.mockResolvedValue(RESIDENT_WITH_PLACEMENT)

    await getPortalAuth()

    const call = mockResidentFindFirst.mock.calls[0][0]
    expect(call.with.placements.limit).toBe(1)
  })

  test('selects minimal fields (id, code, placement id, housingUnitId)', async () => {
    mockGet.mockReturnValue({ value: RESIDENT_CODE })
    mockResidentFindFirst.mockResolvedValue(RESIDENT_WITH_PLACEMENT)

    await getPortalAuth()

    const call = mockResidentFindFirst.mock.calls[0][0]
    expect(call.columns).toEqual({ id: true, code: true })
    expect(call.with.placements.columns).toEqual({ id: true, housingUnitId: true })
  })
})
