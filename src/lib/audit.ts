/**
 * Audit logging utilities for tracking important changes
 * SSOT for audit log creation
 *
 * Auth-ready: Automatically captures current user when auth is implemented
 */

import { db, auditLog } from '@/lib/db'
import { and, eq, desc } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { QUERY_LIMITS } from '@/lib/config/thresholds'

export type AuditAction =
  'CREATE' | 'UPDATE' | 'DELETE' | 'END' | 'TRANSFER' | 'RESOLVE' | 'ARCHIVE' | 'RESTORE'

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
  | 'OPPORTUNITY'
  | 'OPPORTUNITY_APPLICATION'
  // A staff account as the SUBJECT of an action — currently opening and
  // closing a borrowed view. Distinct from the `userId` on every other entry,
  // which records who ACTED; here the staff member is what was acted upon.
  | 'STAFF_USER'

interface AuditLogEntry {
  action: AuditAction
  entity: AuditEntity
  entityId: string
  userId?: string // Optional: will auto-capture from session if not provided
  // The jsonb column types as `unknown` — anything JSON-serialisable is fine.
  changes?: unknown
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

    await db.insert(auditLog).values({
      action,
      entity,
      entityId,
      userId: resolvedUserId,
      changes: changes ?? undefined,
      reason,
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
  return db.query.auditLog.findMany({
    where: and(eq(auditLog.entity, entity), eq(auditLog.entityId, entityId)),
    orderBy: [desc(auditLog.createdAt)],
    limit: QUERY_LIMITS.entityHistory,
  })
}

/**
 * Get recent audit logs (for admin dashboard)
 */
export async function getRecentAuditLogs(limit = 100) {
  return db.query.auditLog.findMany({
    orderBy: [desc(auditLog.createdAt)],
    limit,
  })
}
