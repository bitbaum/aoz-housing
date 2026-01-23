/**
 * Audit logging utilities for tracking important changes
 * SSOT for audit log creation
 */

import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'END'
  | 'TRANSFER'
  | 'RESOLVE'

export type AuditEntity =
  | 'RESIDENT'
  | 'HOUSING_UNIT'
  | 'SPOT'
  | 'PLACEMENT'
  | 'INCIDENT'
  | 'MAINTENANCE'
  | 'CHECK_IN'

interface AuditLogEntry {
  action: AuditAction
  entity: AuditEntity
  entityId: string
  userId?: string
  changes?: Prisma.InputJsonValue
  reason?: string
}

/**
 * Create an audit log entry
 * Non-blocking - failures are logged but don't throw
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
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        changes: changes ?? undefined,
        reason,
      },
    })
  } catch (error) {
    // Log error but don't throw - audit logging should never break operations
    console.error('[Audit] Failed to log:', { action, entity, entityId, error })
  }
}

/**
 * Get audit history for an entity
 */
export async function getEntityAuditLog(entity: AuditEntity, entityId: string) {
  return prisma.auditLog.findMany({
    where: { entity, entityId },
    orderBy: { createdAt: 'desc' },
    take: 50,
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
