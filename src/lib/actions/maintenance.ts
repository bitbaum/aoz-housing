'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import {
  validateFormData,
  MaintenanceRequestInputSchema,
  MaintenanceStatusUpdateSchema,
  AssignMaintenanceSchema,
} from '@/lib/validation'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { DEFAULT_STATUSES, QUERY_LIMITS } from '@/lib/config/thresholds'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { requirePermission } from '@/lib/auth'

/**
 * These used to check `requireStaffAuth()` — signed in, nothing more — while
 * the nav gated the board on `maintenance:read`. A server action is the real
 * boundary: guarding the page and leaving the action open just means the hole
 * needs one more step to reach. Verified in production 2026-08-31 that a role
 * without either maintenance permission was offered every one of these buttons.
 */
export async function createMaintenanceRequest(formData: FormData): Promise<void> {
  const user = await requirePermission('maintenance:write')
  const data = validateFormData(MaintenanceRequestInputSchema, formData)

  try {
    const request = await prisma.maintenanceRequest.create({
      data: {
        housingUnitId: data.housingUnitId,
        spotId: data.spotId || undefined,
        category: data.category,
        priority: data.priority,
        title: data.title,
        description: data.description,
        location: data.location,
        reportedById: data.reportedById || undefined,
        reporterName: data.reporterName,
        status: DEFAULT_STATUSES.maintenance,
      },
    })

    await logAudit({
      action: 'CREATE',
      entity: 'MAINTENANCE',
      entityId: request.id,
      userId: user.id,
      changes: {
        category: data.category,
        priority: data.priority,
        title: data.title,
      },
    })
  } catch (error) {
    logger.errorWithCause('Failed to create maintenance request', error, {
      housingUnitId: data.housingUnitId,
    })
    throw new Error(ERROR_MESSAGES.MAINTENANCE_CREATE_ERROR)
  }

  revalidatePath('/maintenance')
  revalidatePath(`/housing/${data.housingUnitId}`)
  redirect('/maintenance')
}

export async function updateMaintenanceStatus(formData: FormData): Promise<void> {
  const user = await requirePermission('maintenance:write')
  const data = validateFormData(MaintenanceStatusUpdateSchema, formData)

  try {
    const updateData: Record<string, string | number | Date | null> = { status: data.status }

    // Set timestamps based on status
    if (data.status === 'ASSIGNED' && data.assignedTo) {
      updateData.assignedTo = data.assignedTo
      updateData.assignedAt = new Date()
    }
    if (data.status === 'IN_PROGRESS') {
      updateData.startedAt = new Date()
    }
    if (data.status === 'COMPLETED') {
      updateData.completedAt = new Date()
      if (data.resolution) updateData.resolution = data.resolution
      if (data.cost !== null && data.cost !== undefined) updateData.cost = data.cost
    }
    if (data.notes) updateData.notes = data.notes

    const request = await prisma.maintenanceRequest.update({
      where: { id: data.requestId },
      data: updateData,
      select: { housingUnitId: true },
    })

    await logAudit({
      action: 'UPDATE',
      entity: 'MAINTENANCE',
      entityId: data.requestId,
      userId: user.id,
      changes: { status: data.status, ...updateData },
    })

    revalidatePath('/maintenance')
    revalidatePath(`/maintenance/${data.requestId}`)
    revalidatePath(`/housing/${request.housingUnitId}`)
  } catch (error) {
    logger.errorWithCause('Failed to update maintenance status', error, {
      requestId: data.requestId,
    })
    throw new Error(ERROR_MESSAGES.MAINTENANCE_STATUS_UPDATE_ERROR)
  }
}

export async function assignMaintenanceRequest(formData: FormData): Promise<void> {
  const user = await requirePermission('maintenance:write')
  const { requestId, assignedTo } = validateFormData(AssignMaintenanceSchema, formData)

  try {
    const request = await prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status: 'ASSIGNED',
        assignedTo,
        assignedAt: new Date(),
      },
      select: { housingUnitId: true },
    })

    await logAudit({
      action: 'UPDATE',
      entity: 'MAINTENANCE',
      entityId: requestId,
      userId: user.id,
      changes: { status: 'ASSIGNED', assignedTo },
    })

    revalidatePath('/maintenance')
    revalidatePath(`/maintenance/${requestId}`)
    revalidatePath(`/housing/${request.housingUnitId}`)
  } catch (error) {
    logger.errorWithCause('Failed to assign maintenance request', error, { requestId })
    throw new Error(ERROR_MESSAGES.MAINTENANCE_ASSIGN_ERROR)
  }
}

export async function getMaintenanceStats() {
  await requirePermission('maintenance:read')
  const [open, assigned, inProgress, onHold, completedThisMonth] = await Promise.all([
    prisma.maintenanceRequest.count({ where: { status: 'OPEN' } }),
    prisma.maintenanceRequest.count({ where: { status: 'ASSIGNED' } }),
    prisma.maintenanceRequest.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.maintenanceRequest.count({ where: { status: 'ON_HOLD' } }),
    prisma.maintenanceRequest.count({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: new Date(new Date().setDate(1)) },
      },
    }),
  ])

  const urgent = await prisma.maintenanceRequest.count({
    where: {
      priority: 'URGENT',
      status: { in: ['OPEN', 'ASSIGNED'] },
    },
  })

  return {
    open,
    assigned,
    inProgress,
    onHold,
    completedThisMonth,
    urgent,
    active: open + assigned + inProgress + onHold,
  }
}

export async function getHousingUnitMaintenance(housingUnitId: string) {
  await requirePermission('maintenance:read')
  return prisma.maintenanceRequest.findMany({
    where: { housingUnitId },
    include: {
      spot: true,
      reportedBy: { select: { id: true, code: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: QUERY_LIMITS.unitHistory,
  })
}
