/**
 * Unit tests for config server actions
 *
 * Tests getSystemConfig and saveSystemConfig.
 * saveSystemConfig uses a custom parseFloat that treats empty/negative/NaN as null.
 */

import { eq } from 'drizzle-orm'
import { systemConfig } from '@/lib/db'
import { getSystemConfig, saveSystemConfig } from '../config'

// =============================================================================
// MOCKS
// =============================================================================

const mockConfigFindFirst = vi.fn()
// Receives (valuesPayload, onConflictConfig) — the drizzle equivalent of upsert
const mockConfigUpsert = vi.fn()

vi.mock('@/lib/db', async () => ({
  ...(await vi.importActual<object>('@/lib/db')),
  db: {
    query: {
      systemConfig: { findFirst: (...a: unknown[]) => mockConfigFindFirst(...a) },
    },
    insert: vi.fn(() => ({
      values: (v: unknown) => ({
        onConflictDoUpdate: (cfg: unknown): Promise<unknown> => mockConfigUpsert(v, cfg),
      }),
    })),
  },
}))

vi.mock('next/cache', async () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/auth', async () => ({
  requirePermission: vi.fn().mockResolvedValue({
    id: 'staff-1',
    name: 'Test Admin',
    role: 'ADMIN' as const,
    scope: 'ALL_DOMAINS' as const,
    isSystemAdmin: true,
  }),
  requireStaffAuth: vi.fn().mockResolvedValue({
    id: 'staff-1',
    name: 'Test Admin',
    role: 'ADMIN' as const,
    scope: 'ALL_DOMAINS' as const,
    isSystemAdmin: true,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

// =============================================================================
// Helper to build FormData for saveSystemConfig
// =============================================================================

function makeConfigFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(overrides)) {
    fd.set(key, value)
  }
  return fd
}

// =============================================================================
// getSystemConfig
// =============================================================================

describe('getSystemConfig', () => {
  it('returns all nulls when no config row exists', async () => {
    mockConfigFindFirst.mockResolvedValue(null)

    const result = await getSystemConfig()

    expect(result).toEqual({
      pilotBaselineIncidentsPerMonth: null,
      pilotBaselineRelocationsPerMonth: null,
      pilotBaselineMediationHoursPerWeek: null,
      pilotStartDate: null,
    })
  })

  it('returns stored values when config exists', async () => {
    const startDate = new Date('2024-03-01')
    mockConfigFindFirst.mockResolvedValue({
      id: 'singleton',
      pilotBaselineIncidentsPerMonth: 15,
      pilotBaselineRelocationsPerMonth: 4,
      pilotBaselineMediationHoursPerWeek: 12,
      pilotStartDate: startDate,
    })

    const result = await getSystemConfig()

    expect(result).toEqual({
      pilotBaselineIncidentsPerMonth: 15,
      pilotBaselineRelocationsPerMonth: 4,
      pilotBaselineMediationHoursPerWeek: 12,
      pilotStartDate: startDate,
    })
  })

  it('returns nulls for missing optional fields in existing row', async () => {
    mockConfigFindFirst.mockResolvedValue({
      id: 'singleton',
      pilotBaselineIncidentsPerMonth: null,
      pilotBaselineRelocationsPerMonth: null,
      pilotBaselineMediationHoursPerWeek: null,
      pilotStartDate: null,
    })

    const result = await getSystemConfig()

    expect(result.pilotBaselineIncidentsPerMonth).toBeNull()
    expect(result.pilotStartDate).toBeNull()
  })

  it('queries by singleton id', async () => {
    mockConfigFindFirst.mockResolvedValue(null)

    await getSystemConfig()

    expect(mockConfigFindFirst).toHaveBeenCalledWith({
      where: eq(systemConfig.id, 'singleton'),
    })
  })
})

// =============================================================================
// saveSystemConfig
// =============================================================================

describe('saveSystemConfig', () => {
  it('saves valid numeric values', async () => {
    mockConfigUpsert.mockResolvedValue({})

    const fd = makeConfigFormData({
      pilotBaselineIncidentsPerMonth: '15',
      pilotBaselineRelocationsPerMonth: '4',
      pilotBaselineMediationHoursPerWeek: '12',
    })

    await saveSystemConfig(fd)

    expect(mockConfigUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        pilotBaselineIncidentsPerMonth: 15,
        pilotBaselineRelocationsPerMonth: 4,
        pilotBaselineMediationHoursPerWeek: 12,
      }),
      expect.objectContaining({
        set: expect.objectContaining({
          pilotBaselineIncidentsPerMonth: 15,
          pilotBaselineRelocationsPerMonth: 4,
          pilotBaselineMediationHoursPerWeek: 12,
        }),
      }),
    )
  })

  it('treats empty fields as null', async () => {
    mockConfigUpsert.mockResolvedValue({})

    await saveSystemConfig(new FormData())

    expect(mockConfigUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        pilotBaselineIncidentsPerMonth: null,
        pilotBaselineRelocationsPerMonth: null,
        pilotBaselineMediationHoursPerWeek: null,
        pilotStartDate: null,
      }),
      expect.anything(),
    )
  })

  it('treats negative values as null', async () => {
    mockConfigUpsert.mockResolvedValue({})

    const fd = makeConfigFormData({
      pilotBaselineIncidentsPerMonth: '-5',
      pilotBaselineRelocationsPerMonth: '-1',
    })

    await saveSystemConfig(fd)

    expect(mockConfigUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        pilotBaselineIncidentsPerMonth: null,
        pilotBaselineRelocationsPerMonth: null,
      }),
      expect.anything(),
    )
  })

  it('treats non-numeric strings as null', async () => {
    mockConfigUpsert.mockResolvedValue({})

    const fd = makeConfigFormData({
      pilotBaselineIncidentsPerMonth: 'abc',
      pilotBaselineMediationHoursPerWeek: 'N/A',
    })

    await saveSystemConfig(fd)

    expect(mockConfigUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        pilotBaselineIncidentsPerMonth: null,
        pilotBaselineMediationHoursPerWeek: null,
      }),
      expect.anything(),
    )
  })

  it('accepts zero as a valid value', async () => {
    mockConfigUpsert.mockResolvedValue({})

    const fd = makeConfigFormData({
      pilotBaselineIncidentsPerMonth: '0',
    })

    await saveSystemConfig(fd)

    expect(mockConfigUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        pilotBaselineIncidentsPerMonth: 0,
      }),
      expect.anything(),
    )
  })

  it('accepts decimal values', async () => {
    mockConfigUpsert.mockResolvedValue({})

    const fd = makeConfigFormData({
      pilotBaselineMediationHoursPerWeek: '7.5',
    })

    await saveSystemConfig(fd)

    expect(mockConfigUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        pilotBaselineMediationHoursPerWeek: 7.5,
      }),
      expect.anything(),
    )
  })

  it('saves a valid pilot start date', async () => {
    mockConfigUpsert.mockResolvedValue({})

    const fd = makeConfigFormData({ pilotStartDate: '2024-03-01' })

    await saveSystemConfig(fd)

    expect(mockConfigUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        pilotStartDate: new Date('2024-03-01'),
      }),
      expect.anything(),
    )
  })

  it('uses singleton upsert key', async () => {
    mockConfigUpsert.mockResolvedValue({})

    await saveSystemConfig(new FormData())

    expect(mockConfigUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'singleton' }),
      expect.objectContaining({ target: systemConfig.id }),
    )
  })

  it('revalidates settings and analytics paths', async () => {
    mockConfigUpsert.mockResolvedValue({})
    const { revalidatePath } = vi.mocked(await import('next/cache'))

    await saveSystemConfig(new FormData())

    expect(revalidatePath).toHaveBeenCalledWith('/settings')
    expect(revalidatePath).toHaveBeenCalledWith('/analytics')
  })

  it('rejects unauthenticated requests', async () => {
    const { requirePermission } = vi.mocked(await import('@/lib/auth'))
    requirePermission.mockRejectedValueOnce(new Error('Anmeldung erforderlich'))

    await expect(saveSystemConfig(new FormData())).rejects.toThrow('Anmeldung erforderlich')
    expect(mockConfigUpsert).not.toHaveBeenCalled()
  })
})
