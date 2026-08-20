/**
 * Unit tests for incident server actions
 *
 * Tests resolveIncident (uses redirect-free flow via revalidatePath),
 * getResidentIncidentStats, and getHousingUnitIncidentHistory.
 * createIncident/addFollowUp use redirect() or are form-data-dependent.
 */

import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import {
  getResidentIncidentStats,
  getHousingUnitIncidentHistory,
  getIncidentsNeedingFollowUp,
  clearFollowUpReminder,
} from '../incidents'

// =============================================================================
// MOCKS
// =============================================================================

jest.mock('@/lib/db', () => ({
  prisma: {
    incident: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    incidentInvolvement: {
      count: jest.fn(),
    },
    incidentFollowUp: {
      create: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  },
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

jest.mock('@/lib/audit', () => ({
  logAudit: jest.fn(),
}))

const mockStaffUser = { id: 'staff-1', email: 'admin@test.com', name: 'Test Admin', role: 'ADMIN' as const }

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({ id: 'staff-1', email: 'admin@test.com', name: 'Test Admin', role: 'ADMIN' as const }),
  requireStaffAuth: jest.fn().mockResolvedValue({ id: 'staff-1', email: 'admin@test.com', name: 'Test Admin', role: 'ADMIN' as const }),
  // The actions moved to permission-based auth; a mock missing this
  // fails as `requirePermission is not a function`, which reads like a
  // broken import rather than a stale mock.
  requirePermission: jest.fn().mockResolvedValue({ id: 'staff-1', email: 'admin@test.com', name: 'Test Admin', role: 'ADMIN' as const }),
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

const mockPrisma = prisma as jest.Mocked<typeof prisma>

beforeEach(() => {
  jest.clearAllMocks()
})

// =============================================================================
// getResidentIncidentStats
// =============================================================================

describe('getResidentIncidentStats', () => {
  it('returns zero counts when resident has no incidents', async () => {
    ;(mockPrisma.incident.count as jest.Mock)
      .mockResolvedValueOnce(0) // reported
      .mockResolvedValueOnce(0) // as subject
    ;(mockPrisma.incidentInvolvement.count as jest.Mock).mockResolvedValue(0) // involved
    ;(mockPrisma.incident.findMany as jest.Mock).mockResolvedValue([]) // unique incidents

    const stats = await getResidentIncidentStats('res-1')

    expect(stats).toEqual({
      reported: 0,
      asSubject: 0,
      involved: 0,
      total: 0,
    })
  })

  it('returns correct counts for a resident with mixed incident involvement', async () => {
    ;(mockPrisma.incident.count as jest.Mock)
      .mockResolvedValueOnce(3) // reported
      .mockResolvedValueOnce(1) // as subject
    ;(mockPrisma.incidentInvolvement.count as jest.Mock).mockResolvedValue(2) // involved
    ;(mockPrisma.incident.findMany as jest.Mock).mockResolvedValue([
      { id: 'inc-1' },
      { id: 'inc-2' },
      { id: 'inc-3' },
      { id: 'inc-4' },
    ])

    const stats = await getResidentIncidentStats('res-1')

    expect(stats).toEqual({
      reported: 3,
      asSubject: 1,
      involved: 2,
      total: 4,
    })
  })
})

// =============================================================================
// getHousingUnitIncidentHistory
// =============================================================================

describe('getHousingUnitIncidentHistory', () => {
  it('returns empty data for a unit with no incidents', async () => {
    ;(mockPrisma.incident.findMany as jest.Mock).mockResolvedValue([])

    const result = await getHousingUnitIncidentHistory('hu-1')

    expect(result.incidents).toEqual([])
    expect(result.stats).toEqual({
      total: 0,
      open: 0,
      interpersonal: 0,
      maintenance: 0,
    })
    expect(result.frequentSubjects).toEqual([])
  })

  it('calculates correct stats and identifies frequent subjects', async () => {
    const incidents = [
      {
        id: 'inc-1',
        category: 'INTERPERSONAL',
        resolvedAt: null,
        subject: { id: 'res-a', code: 'RES-A' },
        reportedBy: null,
        involvedResidents: [],
      },
      {
        id: 'inc-2',
        category: 'MAINTENANCE',
        resolvedAt: new Date(),
        subject: null,
        reportedBy: null,
        involvedResidents: [],
      },
      {
        id: 'inc-3',
        category: 'INTERPERSONAL',
        resolvedAt: null,
        subject: { id: 'res-a', code: 'RES-A' },
        reportedBy: null,
        involvedResidents: [],
      },
    ]
    ;(mockPrisma.incident.findMany as jest.Mock).mockResolvedValue(incidents)

    const result = await getHousingUnitIncidentHistory('hu-1')

    expect(result.stats.total).toBe(3)
    expect(result.stats.open).toBe(2)
    expect(result.stats.interpersonal).toBe(2)
    expect(result.stats.maintenance).toBe(1)

    // res-a appears as subject 2 times (>= 2 threshold)
    expect(result.frequentSubjects).toHaveLength(1)
    expect(result.frequentSubjects[0]).toEqual(
      expect.objectContaining({ id: 'res-a', code: 'RES-A', count: 2 })
    )
  })

  it('does not flag subjects with only one incident', async () => {
    const incidents = [
      {
        id: 'inc-1',
        category: 'INTERPERSONAL',
        resolvedAt: null,
        subject: { id: 'res-a', code: 'RES-A' },
        reportedBy: null,
        involvedResidents: [],
      },
      {
        id: 'inc-2',
        category: 'INTERPERSONAL',
        resolvedAt: null,
        subject: { id: 'res-b', code: 'RES-B' },
        reportedBy: null,
        involvedResidents: [],
      },
    ]
    ;(mockPrisma.incident.findMany as jest.Mock).mockResolvedValue(incidents)

    const result = await getHousingUnitIncidentHistory('hu-1')

    expect(result.frequentSubjects).toHaveLength(0)
  })
})

// =============================================================================
// getIncidentsNeedingFollowUp
// =============================================================================

describe('getIncidentsNeedingFollowUp', () => {
  it('returns categorized incidents for follow-up', async () => {
    const overdueIncident = { id: 'inc-overdue', nextFollowUpDate: new Date('2025-01-01') }
    const dueSoonIncident = { id: 'inc-soon', nextFollowUpDate: new Date() }
    const urgentIncident = { id: 'inc-urgent', followUpPriority: 'URGENT' }

    ;(mockPrisma.incident.findMany as jest.Mock)
      .mockResolvedValueOnce([overdueIncident]) // overdue
      .mockResolvedValueOnce([dueSoonIncident]) // dueSoon
      .mockResolvedValueOnce([urgentIncident])  // urgent

    const result = await getIncidentsNeedingFollowUp()

    expect(result.overdue).toHaveLength(1)
    expect(result.dueSoon).toHaveLength(1)
    expect(result.urgent).toHaveLength(1)
  })

  it('returns empty arrays when no follow-ups needed', async () => {
    ;(mockPrisma.incident.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const result = await getIncidentsNeedingFollowUp()

    expect(result.overdue).toEqual([])
    expect(result.dueSoon).toEqual([])
    expect(result.urgent).toEqual([])
  })
})

// =============================================================================
// auth guard
// =============================================================================

describe('auth guard', () => {
  it('rejects unauthenticated requests', async () => {
    // These actions gate on requirePermission now. Rejecting requireStaffAuth
    // left the real guard resolving happily, so the action ran and the test
    // asserted a guard that was no longer there.
    const { requirePermission: mockRequirePermission } = require('@/lib/auth')
    mockRequirePermission.mockRejectedValueOnce(new Error('Anmeldung erforderlich'))

    const fd = new FormData()
    await expect(clearFollowUpReminder(fd)).rejects.toThrow('Anmeldung erforderlich')
  })
})
