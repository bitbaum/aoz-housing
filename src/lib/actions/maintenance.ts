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
import { DEFAULT_STATUSES } from '@/lib/config/thresholds'

export async function createMaintenanceRequest(formData: FormData): Promise<void> {
  const data = validateFormData(MaintenanceRequestInputSchema, formData)

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
    changes: {
      category: data.category,
      priority: data.priority,
      title: data.title,
    },
  })

  revalidatePath('/maintenance')
  revalidatePath(`/housing/${data.housingUnitId}`)
  redirect('/maintenance')
}

export async function updateMaintenanceStatus(formData: FormData): Promise<void> {
  const data = validateFormData(MaintenanceStatusUpdateSchema, formData)

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
    changes: { status: data.status, ...updateData },
  })

  revalidatePath('/maintenance')
  revalidatePath(`/maintenance/${data.requestId}`)
  revalidatePath(`/housing/${request.housingUnitId}`)
}

export async function assignMaintenanceRequest(formData: FormData): Promise<void> {
  const { requestId, assignedTo } = validateFormData(AssignMaintenanceSchema, formData)

  const request = await prisma.maintenanceRequest.update({
    where: { id: requestId },
    data: {
      status: 'ASSIGNED',
      assignedTo,
      assignedAt: new Date(),
    },
    select: { housingUnitId: true },
  })

  revalidatePath('/maintenance')
  revalidatePath(`/maintenance/${requestId}`)
  revalidatePath(`/housing/${request.housingUnitId}`)
}

export async function getMaintenanceStats() {
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
  return prisma.maintenanceRequest.findMany({
    where: { housingUnitId },
    include: {
      spot: true,
      reportedBy: { select: { id: true, code: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
}
