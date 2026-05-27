'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  validateFormData,
  ResidentInputSchema,
  ResidentUpdateSchema,
} from '@/lib/validation'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { DEFAULT_STATUSES } from '@/lib/config/thresholds'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { requireStaffAuth } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function createResident(formData: FormData): Promise<void> {
  const user = await requireStaffAuth()
  const data = validateFormData(ResidentInputSchema, formData)

  let resident
  try {
    resident = await prisma.resident.create({
      data: {
        ...data,
        status: DEFAULT_STATUSES.resident,
      },
    })

    await logAudit({
      action: 'CREATE',
      entity: 'RESIDENT',
      entityId: resident.id,
      userId: user.id,
      changes: { code: data.code },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error(ERROR_MESSAGES.RESIDENT_CODE_EXISTS)
    }
    logger.errorWithCause('Failed to create resident', error, { code: data.code })
    throw new Error(ERROR_MESSAGES.RESIDENT_CREATE_ERROR)
  }

  revalidatePath('/residents')
  revalidatePath('/matching')
  // Redirect to matching page for immediate placement
  redirect(`/matching?resident=${resident.id}&new=1`)
}

export async function exitResident(residentId: string): Promise<{ success: boolean; error?: string }> {
  const user = await requireStaffAuth()
  try {
    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      include: { placements: { where: { status: 'ACTIVE' } } },
    })

    if (!resident) {
      return { success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND }
    }

    if (resident.placements.length > 0) {
      return { success: false, error: ERROR_MESSAGES.RESIDENT_HAS_ACTIVE_PLACEMENTS }
    }

    await prisma.resident.update({
      where: { id: residentId },
      data: { status: 'EXITED' },
    })

    await logAudit({
      action: 'END',
      entity: 'RESIDENT',
      entityId: residentId,
      userId: user.id,
      changes: { status: 'EXITED' },
      reason: 'Bewohner ausgetreten',
    })

    revalidatePath('/residents')
    revalidatePath(`/residents/${residentId}`)
    return { success: true }
  } catch (error) {
    logger.errorWithCause('Failed to exit resident', error, { residentId })
    return { success: false, error: ERROR_MESSAGES.RESIDENT_UPDATE_ERROR }
  }
}

export async function updateResident(formData: FormData): Promise<void> {
  const user = await requireStaffAuth()
  const data = validateFormData(ResidentUpdateSchema, formData)
  const { id, code: _code, ...updateData } = data

  try {
    await prisma.resident.update({
      where: { id },
      data: updateData,
    })

    await logAudit({
      action: 'UPDATE',
      entity: 'RESIDENT',
      entityId: id,
      userId: user.id,
      changes: updateData,
    })
  } catch (error) {
    logger.errorWithCause('Failed to update resident', error, { residentId: id })
    throw new Error(ERROR_MESSAGES.RESIDENT_UPDATE_ERROR)
  }

  revalidatePath('/residents')
  revalidatePath(`/residents/${id}`)
  redirect(`/residents/${id}`)
}

export async function archiveResident(residentId: string): Promise<{ success: boolean; error?: string }> {
  const user = await requireStaffAuth()
  try {
    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      include: { placements: { where: { status: 'ACTIVE' } } },
    })

    if (!resident) {
      return { success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND }
    }

    if (resident.placements.length > 0) {
      return { success: false, error: ERROR_MESSAGES.RESIDENT_ARCHIVE_BLOCKED }
    }

    await prisma.resident.update({
      where: { id: residentId },
      data: { status: 'EXITED' },
    })

    await logAudit({
      action: 'ARCHIVE',
      entity: 'RESIDENT',
      entityId: residentId,
      userId: user.id,
      changes: { status: 'EXITED' },
    })

    revalidatePath('/residents')
    revalidatePath(`/residents/${residentId}`)
    return { success: true }
  } catch (error) {
    logger.errorWithCause('Failed to archive resident', error, { residentId })
    return { success: false, error: ERROR_MESSAGES.ARCHIVE_ERROR }
  }
}

export async function restoreResident(residentId: string): Promise<{ success: boolean; error?: string }> {
  const user = await requireStaffAuth()
  try {
    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      include: { placements: { where: { status: 'ACTIVE' } } },
    })

    if (!resident) {
      return { success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND }
    }

    const nextStatus = resident.placements.length > 0 ? 'PLACED' : 'ACTIVE'

    await prisma.resident.update({
      where: { id: residentId },
      data: { status: nextStatus },
    })

    await logAudit({
      action: 'RESTORE',
      entity: 'RESIDENT',
      entityId: residentId,
      userId: user.id,
      changes: { status: nextStatus },
    })

    revalidatePath('/residents')
    revalidatePath(`/residents/${residentId}`)
    return { success: true }
  } catch (error) {
    logger.errorWithCause('Failed to restore resident', error, { residentId })
    return { success: false, error: ERROR_MESSAGES.RESTORE_ERROR }
  }
}

function isTestOrDemoCode(code: string): boolean {
  const c = code.toLowerCase()
  return c.startsWith('test-') || c.startsWith('demo-') || c.includes('test') || c.includes('demo')
}

export async function hardDeleteResidentProtected(
  residentId: string,
  confirmation: string,
  reason: string
): Promise<{ success: boolean; error?: string; blockerReport?: Record<string, number> }> {
  const user = await requireStaffAuth()
  try {
    if (confirmation !== 'DELETE') {
      return { success: false, error: 'Bestätigung fehlt (DELETE)' }
    }

    if (!reason || reason.trim().length < 10) {
      return { success: false, error: 'Bitte einen aussagekräftigen Grund angeben (mind. 10 Zeichen)' }
    }

    const resident = await prisma.resident.findUnique({ where: { id: residentId } })
    if (!resident) {
      return { success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND }
    }

    if (!isTestOrDemoCode(resident.code)) {
      return { success: false, error: 'Hard-Delete nur für Test-/Demo-Bewohner erlaubt' }
    }

    const [placements, incidentsReported, incidentsAsSubject, involvements, maintenanceRequests, assessments] = await Promise.all([
      prisma.placement.count({ where: { residentId } }),
      prisma.incident.count({ where: { reportedById: residentId } }),
      prisma.incident.count({ where: { subjectId: residentId } }),
      prisma.incidentInvolvement.count({ where: { residentId } }),
      prisma.maintenanceRequest.count({ where: { reportedById: residentId } }),
      prisma.compatibilityAssessment.count({
        where: {
          OR: [{ residentId }, { comparedWithId: residentId }],
        },
      }),
    ])

    if (placements + incidentsReported + incidentsAsSubject + involvements + maintenanceRequests + assessments > 0) {
      return {
        success: false,
        error: 'Hard-Delete blockiert: Bewohner hat verknüpfte Historie',
        blockerReport: {
          placements,
          incidentsReported,
          incidentsAsSubject,
          involvements,
          maintenanceRequests,
          assessments,
        },
      }
    }

    await prisma.resident.delete({ where: { id: residentId } })

    await logAudit({
      action: 'DELETE',
      entity: 'RESIDENT',
      entityId: residentId,
      userId: user.id,
      reason,
      changes: { code: resident.code, protectedDelete: true },
    })

    revalidatePath('/residents')
    return { success: true }
  } catch (error) {
    logger.errorWithCause('Failed to hard-delete resident', error, { residentId })
    return { success: false, error: 'Hard-Delete fehlgeschlagen' }
  }
}
