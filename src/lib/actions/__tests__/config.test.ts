/**
 * Unit tests for config server actions
 *
 * Tests getSystemConfig and saveSystemConfig.
 * saveSystemConfig uses a custom parseFloat that treats empty/negative/NaN as null.
 */

import type { Mock, Mocked } from 'vitest'
import { prisma } from '@/lib/db'
import { getSystemConfig, saveSystemConfig } from '../config'

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('@/lib/db', () => ({
  prisma: {
    systemConfig: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
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

const mockPrisma = prisma as Mocked<typeof prisma>

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
    ;(mockPrisma.systemConfig.findUnique as Mock).mockResolvedValue(null)

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
    ;(mockPrisma.systemConfig.findUnique as Mock).mockResolvedValue({
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
    ;(mockPrisma.systemConfig.findUnique as Mock).mockResolvedValue({
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
    ;(mockPrisma.systemConfig.findUnique as Mock).mockResolvedValue(null)

    await getSystemConfig()

    expect(mockPrisma.systemConfig.findUnique).toHaveBeenCalledWith({
      where: { id: 'singleton' },
    })
  })
})

// =============================================================================
// saveSystemConfig
// =============================================================================

describe('saveSystemConfig', () => {
  it('saves valid numeric values', async () => {
    ;(mockPrisma.systemConfig.upsert as Mock).mockResolvedValue({})

    const fd = makeConfigFormData({
      pilotBaselineIncidentsPerMonth: '15',
      pilotBaselineRelocationsPerMonth: '4',
      pilotBaselineMediationHoursPerWeek: '12',
    })

    await saveSystemConfig(fd)

    expect(mockPrisma.systemConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          pilotBaselineIncidentsPerMonth: 15,
          pilotBaselineRelocationsPerMonth: 4,
          pilotBaselineMediationHoursPerWeek: 12,
        }),
        update: expect.objectContaining({
          pilotBaselineIncidentsPerMonth: 15,
          pilotBaselineRelocationsPerMonth: 4,
          pilotBaselineMediationHoursPerWeek: 12,
        }),
      }),
    )
  })

  it('treats empty fields as null', async () => {
    ;(mockPrisma.systemConfig.upsert as Mock).mockResolvedValue({})

    await saveSystemConfig(new FormData())

    expect(mockPrisma.systemConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          pilotBaselineIncidentsPerMonth: null,
          pilotBaselineRelocationsPerMonth: null,
          pilotBaselineMediationHoursPerWeek: null,
          pilotStartDate: null,
        }),
      }),
    )
  })

  it('treats negative values as null', async () => {
    ;(mockPrisma.systemConfig.upsert as Mock).mockResolvedValue({})

    const fd = makeConfigFormData({
      pilotBaselineIncidentsPerMonth: '-5',
      pilotBaselineRelocationsPerMonth: '-1',
    })

    await saveSystemConfig(fd)

    expect(mockPrisma.systemConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          pilotBaselineIncidentsPerMonth: null,
          pilotBaselineRelocationsPerMonth: null,
        }),
      }),
    )
  })

  it('treats non-numeric strings as null', async () => {
    ;(mockPrisma.systemConfig.upsert as Mock).mockResolvedValue({})

    const fd = makeConfigFormData({
      pilotBaselineIncidentsPerMonth: 'abc',
      pilotBaselineMediationHoursPerWeek: 'N/A',
    })

    await saveSystemConfig(fd)

    expect(mockPrisma.systemConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          pilotBaselineIncidentsPerMonth: null,
          pilotBaselineMediationHoursPerWeek: null,
        }),
      }),
    )
  })

  it('accepts zero as a valid value', async () => {
    ;(mockPrisma.systemConfig.upsert as Mock).mockResolvedValue({})

    const fd = makeConfigFormData({
      pilotBaselineIncidentsPerMonth: '0',
    })

    await saveSystemConfig(fd)

    expect(mockPrisma.systemConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          pilotBaselineIncidentsPerMonth: 0,
        }),
      }),
    )
  })

  it('accepts decimal values', async () => {
    ;(mockPrisma.systemConfig.upsert as Mock).mockResolvedValue({})

    const fd = makeConfigFormData({
      pilotBaselineMediationHoursPerWeek: '7.5',
    })

    await saveSystemConfig(fd)

    expect(mockPrisma.systemConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          pilotBaselineMediationHoursPerWeek: 7.5,
        }),
      }),
    )
  })

  it('saves a valid pilot start date', async () => {
    ;(mockPrisma.systemConfig.upsert as Mock).mockResolvedValue({})

    const fd = makeConfigFormData({ pilotStartDate: '2024-03-01' })

    await saveSystemConfig(fd)

    expect(mockPrisma.systemConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          pilotStartDate: new Date('2024-03-01'),
        }),
      }),
    )
  })

  it('uses singleton upsert key', async () => {
    ;(mockPrisma.systemConfig.upsert as Mock).mockResolvedValue({})

    await saveSystemConfig(new FormData())

    expect(mockPrisma.systemConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'singleton' } }),
    )
  })

  it('revalidates settings and analytics paths', async () => {
    ;(mockPrisma.systemConfig.upsert as Mock).mockResolvedValue({})
    const { revalidatePath } = await import('next/cache')

    await saveSystemConfig(new FormData())

    expect(revalidatePath).toHaveBeenCalledWith('/settings')
    expect(revalidatePath).toHaveBeenCalledWith('/analytics')
  })

  it('rejects unauthenticated requests', async () => {
    const { requirePermission } = await import('@/lib/auth')
    requirePermission.mockRejectedValueOnce(new Error('Anmeldung erforderlich'))

    await expect(saveSystemConfig(new FormData())).rejects.toThrow('Anmeldung erforderlich')
    expect(mockPrisma.systemConfig.upsert).not.toHaveBeenCalled()
  })
})
