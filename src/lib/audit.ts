/**
 * Audit logging utilities for tracking important changes
 * SSOT for audit log creation
 *
 * Auth-ready: Automatically captures current user when auth is implemented
 */

import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { QUERY_LIMITS } from '@/lib/config/thresholds'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'END'
  | 'TRANSFER'
  | 'RESOLVE'
  | 'ARCHIVE'
  | 'RESTORE'

export type AuditEntity =
  | 'RESIDENT'
  | 'HOUSING_UNIT'
  | 'SPOT'
  | 'PLACEMENT'
  | 'INCIDENT'
  | 'MAINTENANCE'
  | 'CHECK_IN'
  | 'HOUSEHOLD_TASK'
  | 'TRANSFER_REQUEST'
  | 'ACTIVITY'
  | 'HOUSE_RULE'
  | 'PROPOSAL'
  | 'CONFLICT_AGREEMENT'
  | 'EXPENSE'
  | 'MESSAGE'
  | 'SETTLEMENT'
  | 'RESIDENT_PROFILE'

interface AuditLogEntry {
  action: AuditAction
  entity: AuditEntity
  entityId: string
  userId?: string // Optional: will auto-capture from session if not provided
  changes?: Prisma.InputJsonValue
  reason?: string
}

/**
 * Create an audit log entry
 * Non-blocking - failures are logged but don't throw
 *
 * Auth-ready: If userId not provided, attempts to get from current session
 * During pilot: userId will be null (no auth)
 * After auth: userId will be automatically captured
 */
export async function logAudit({
  action,
  entity,
  entityId,
  userId,
  changes,
  reason,
}: AuditLogEntry): Promise<void> {
  try {
    // Auto-capture user from session if not explicitly provided
    let resolvedUserId = userId
    if (!resolvedUserId) {
      const currentUser = await getCurrentUser()
      resolvedUserId = currentUser?.id
    }

    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId: resolvedUserId,
        changes: changes ?? undefined,
        reason,
      },
    })
  } catch (error) {
    // Log error but don't throw - audit logging should never break operations
    // Audit logging should never break operations — log and swallow
    logger.errorWithCause('Audit log failed', error, { action, entity, entityId })
  }
}

/**
 * Get audit history for an entity
 */
export async function getEntityAuditLog(entity: AuditEntity, entityId: string) {
  return prisma.auditLog.findMany({
    where: { entity, entityId },
    orderBy: { createdAt: 'desc' },
    take: QUERY_LIMITS.entityHistory,
  })
}

/**
 * Get recent audit logs (for admin dashboard)
 */
export async function getRecentAuditLogs(limit = 100) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
