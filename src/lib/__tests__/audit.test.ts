/**
 * Tests for audit logging (src/lib/audit.ts)
 *
 * Covers: logAudit (auto userId capture, non-blocking error swallowing),
 * getEntityAuditLog, and getRecentAuditLogs.
 */

import { logAudit, getEntityAuditLog, getRecentAuditLogs } from '../audit'

// =============================================================================
// MOCKS
// =============================================================================

const mockAuditLogCreate = vi.hoisted(() => vi.fn())
const mockAuditLogFindMany = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  prisma: {
    auditLog: {
      create: (...args: unknown[]) => mockAuditLogCreate(...args),
      findMany: (...args: unknown[]) => mockAuditLogFindMany(...args),
    },
  },
}))

const mockGetCurrentUser = vi.hoisted(() => vi.fn())

vi.mock('@/lib/auth', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    errorWithCause: vi.fn(),
  },
}))

// =============================================================================
// TESTS
// =============================================================================

describe('logAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuditLogCreate.mockResolvedValue({})
    mockGetCurrentUser.mockResolvedValue(null)
  })

  // ── Basic creation ────────────────────────────────────────────────────────

  test('creates an audit log entry with provided fields', async () => {
    await logAudit({
      action: 'CREATE',
      entity: 'RESIDENT',
      entityId: 'res-123',
      userId: 'user-1',
      reason: 'Test reason',
    })

    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'CREATE',
        entity: 'RESIDENT',
        entityId: 'res-123',
        userId: 'user-1',
        reason: 'Test reason',
      }),
    })
  })

  test('includes changes field when provided', async () => {
    const changes = { name: { from: 'Old', to: 'New' } }

    await logAudit({
      action: 'UPDATE',
      entity: 'RESIDENT',
      entityId: 'res-123',
      userId: 'user-1',
      changes,
    })

    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ changes }),
    })
  })

  // ── Auto userId capture ───────────────────────────────────────────────────

  test('auto-captures userId from getCurrentUser when not provided', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'auto-user-id' })

    await logAudit({
      action: 'DELETE',
      entity: 'SPOT',
      entityId: 'spot-456',
    })

    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'auto-user-id' }),
    })
  })

  test('uses null userId when getCurrentUser returns null and userId not provided', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    await logAudit({
      action: 'CREATE',
      entity: 'PLACEMENT',
      entityId: 'placement-789',
    })

    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: undefined }),
    })
  })

  test('explicit userId takes precedence over getCurrentUser', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'session-user' })

    await logAudit({
      action: 'UPDATE',
      entity: 'INCIDENT',
      entityId: 'inc-1',
      userId: 'explicit-user',
    })

    // getCurrentUser should NOT be called when userId is explicit
    expect(mockGetCurrentUser).not.toHaveBeenCalled()
    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'explicit-user' }),
    })
  })

  // ── Non-blocking error handling ───────────────────────────────────────────

  test('does not throw when prisma.auditLog.create fails', async () => {
    mockAuditLogCreate.mockRejectedValue(new Error('DB connection lost'))

    await expect(
      logAudit({ action: 'CREATE', entity: 'RESIDENT', entityId: 'res-1' }),
    ).resolves.toBeUndefined()
  })

  test('logs the error via logger when create fails', async () => {
    const { logger } = await import('@/lib/logger')
    const error = new Error('Constraint violation')
    mockAuditLogCreate.mockRejectedValue(error)

    await logAudit({ action: 'CREATE', entity: 'RESIDENT', entityId: 'res-1' })

    expect(logger.errorWithCause).toHaveBeenCalledWith(
      expect.stringContaining('Audit log failed'),
      error,
      expect.any(Object),
    )
  })

  test('does not throw when getCurrentUser fails', async () => {
    mockGetCurrentUser.mockRejectedValue(new Error('Auth service down'))

    await expect(
      logAudit({ action: 'CREATE', entity: 'RESIDENT', entityId: 'res-1' }),
    ).resolves.toBeUndefined()
  })
})

// =============================================================================

describe('getEntityAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuditLogFindMany.mockResolvedValue([])
  })

  test('queries by entity type and entityId', async () => {
    await getEntityAuditLog('RESIDENT', 'res-123')

    expect(mockAuditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { entity: 'RESIDENT', entityId: 'res-123' },
      }),
    )
  })

  test('orders results by createdAt descending', async () => {
    await getEntityAuditLog('PLACEMENT', 'p-1')

    expect(mockAuditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      }),
    )
  })

  test('limits results to 50', async () => {
    await getEntityAuditLog('INCIDENT', 'i-1')

    expect(mockAuditLogFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }))
  })

  test('returns the results from prisma', async () => {
    const entries = [{ id: 'log-1', action: 'CREATE' }]
    mockAuditLogFindMany.mockResolvedValue(entries)

    const result = await getEntityAuditLog('RESIDENT', 'res-1')

    expect(result).toEqual(entries)
  })
})

// =============================================================================

describe('getRecentAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuditLogFindMany.mockResolvedValue([])
  })

  test('orders results by createdAt descending', async () => {
    await getRecentAuditLogs()

    expect(mockAuditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      }),
    )
  })

  test('defaults to limit 100', async () => {
    await getRecentAuditLogs()

    expect(mockAuditLogFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }))
  })

  test('respects custom limit', async () => {
    await getRecentAuditLogs(25)

    expect(mockAuditLogFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 25 }))
  })
})
