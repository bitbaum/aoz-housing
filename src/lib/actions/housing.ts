'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  validateFormData,
  HousingUnitInputSchema,
  HousingUnitUpdateSchema,
} from '@/lib/validation'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { DEFAULT_STATUSES } from '@/lib/config/thresholds'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { requireStaffAuth } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function createHousingUnit(formData: FormData): Promise<void> {
  const user = await requireStaffAuth()
  const data = validateFormData(HousingUnitInputSchema, formData)

  let unit
  try {
    unit = await prisma.housingUnit.create({
      data: {
        ...data,
        status: DEFAULT_STATUSES.housing,
      },
    })

    await logAudit({
      action: 'CREATE',
      entity: 'HOUSING_UNIT',
      entityId: unit.id,
      userId: user.id,
      changes: { code: data.code, address: data.address },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error(ERROR_MESSAGES.UNIT_CODE_EXISTS)
    }
    logger.errorWithCause('Failed to create housing unit', error, { code: data.code })
    throw new Error(ERROR_MESSAGES.UNIT_CREATE_ERROR)
  }

  revalidatePath('/housing')
  // Redirect to spots page for immediate room/bed setup
  redirect(`/housing/${unit.id}/spots?new=1`)
}

export async function updateHousingUnit(formData: FormData): Promise<void> {
  const user = await requireStaffAuth()
  const data = validateFormData(HousingUnitUpdateSchema, formData)
  const { id, ...updateData } = data

  try {
    await prisma.housingUnit.update({
      where: { id },
      data: updateData,
    })

    await logAudit({
      action: 'UPDATE',
      entity: 'HOUSING_UNIT',
      entityId: id,
      userId: user.id,
      changes: updateData,
    })
  } catch (error) {
    logger.errorWithCause('Failed to update housing unit', error, { housingUnitId: id })
    throw new Error(ERROR_MESSAGES.UNIT_UPDATE_ERROR)
  }

  revalidatePath('/housing')
  revalidatePath(`/housing/${id}`)
  redirect(`/housing/${id}`)
}

export async function archiveHousingUnit(housingUnitId: string): Promise<{ success: boolean; error?: string }> {
  const user = await requireStaffAuth()
  try {
    const unit = await prisma.housingUnit.findUnique({
      where: { id: housingUnitId },
      include: {
        placements: { where: { status: 'ACTIVE' }, select: { id: true } },
        spots: { where: { status: 'OCCUPIED' }, select: { id: true } },
      },
    })

    if (!unit) return { success: false, error: ERROR_MESSAGES.UNIT_NOT_FOUND }
    if (unit.placements.length > 0 || unit.spots.length > 0) {
      return { success: false, error: ERROR_MESSAGES.UNIT_ARCHIVE_BLOCKED }
    }

    await prisma.housingUnit.update({
      where: { id: housingUnitId },
      data: { status: 'CLOSED' },
    })

    await logAudit({
      action: 'ARCHIVE',
      entity: 'HOUSING_UNIT',
      entityId: housingUnitId,
      userId: user.id,
      changes: { status: 'CLOSED' },
    })

    revalidatePath('/housing')
    revalidatePath(`/housing/${housingUnitId}`)
    return { success: true }
  } catch (error) {
    logger.errorWithCause('Failed to archive housing unit', error, { housingUnitId })
    return { success: false, error: ERROR_MESSAGES.ARCHIVE_ERROR }
  }
}

export async function restoreHousingUnit(housingUnitId: string): Promise<{ success: boolean; error?: string }> {
  const user = await requireStaffAuth()
  try {
    const unit = await prisma.housingUnit.findUnique({ where: { id: housingUnitId } })
    if (!unit) return { success: false, error: ERROR_MESSAGES.UNIT_NOT_FOUND }

    await prisma.housingUnit.update({
      where: { id: housingUnitId },
      data: { status: 'AVAILABLE' },
    })

    await logAudit({
      action: 'RESTORE',
      entity: 'HOUSING_UNIT',
      entityId: housingUnitId,
      userId: user.id,
      changes: { status: 'AVAILABLE' },
    })

    revalidatePath('/housing')
    revalidatePath(`/housing/${housingUnitId}`)
    return { success: true }
  } catch (error) {
    logger.errorWithCause('Failed to restore housing unit', error, { housingUnitId })
    return { success: false, error: ERROR_MESSAGES.RESTORE_ERROR }
  }
}

function isTestOrDemoCode(code: string): boolean {
  const c = code.toLowerCase()
  return c.startsWith('test-') || c.startsWith('demo-') || c.includes('test') || c.includes('demo')
}

export async function hardDeleteHousingUnitProtected(
  housingUnitId: string,
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

    const unit = await prisma.housingUnit.findUnique({ where: { id: housingUnitId } })
    if (!unit) return { success: false, error: ERROR_MESSAGES.UNIT_NOT_FOUND }

    if (!isTestOrDemoCode(unit.code)) {
      return { success: false, error: 'Hard-Delete nur für Test-/Demo-Unterkünfte erlaubt' }
    }

    const [placements, incidents, maintenanceRequests, spots, tasks] = await Promise.all([
      prisma.placement.count({ where: { housingUnitId } }),
      prisma.incident.count({ where: { housingUnitId } }),
      prisma.maintenanceRequest.count({ where: { housingUnitId } }),
      prisma.placementSpot.count({ where: { housingUnitId } }),
      prisma.householdTask.count({ where: { housingUnitId } }),
    ])

    if (placements + incidents + maintenanceRequests + spots + tasks > 0) {
      return {
        success: false,
        error: 'Hard-Delete blockiert: Unterkunft hat verknüpfte Historie',
        blockerReport: {
          placements,
          incidents,
          maintenanceRequests,
          spots,
          tasks,
        },
      }
    }

    await prisma.housingUnit.delete({ where: { id: housingUnitId } })

    await logAudit({
      action: 'DELETE',
      entity: 'HOUSING_UNIT',
      entityId: housingUnitId,
      userId: user.id,
      reason,
      changes: { code: unit.code, protectedDelete: true },
    })

    revalidatePath('/housing')
    return { success: true }
  } catch (error) {
    logger.errorWithCause('Failed to hard-delete housing unit', error, { housingUnitId })
    return { success: false, error: 'Hard-Delete fehlgeschlagen' }
  }
}
