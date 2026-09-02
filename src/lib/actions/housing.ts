'use server'

import {
  db,
  housingUnit,
  placement,
  placementSpot,
  incident,
  maintenanceRequest,
  householdTask,
  isUniqueViolation,
} from '@/lib/db'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { validateFormData, HousingUnitInputSchema, HousingUnitUpdateSchema } from '@/lib/validation'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { DEFAULT_STATUSES } from '@/lib/config/thresholds'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { requirePermission } from '@/lib/auth'

export async function createHousingUnit(formData: FormData): Promise<void> {
  const user = await requirePermission('housing:write')
  const data = validateFormData(HousingUnitInputSchema, formData)

  let unit
  try {
    const [created] = await db
      .insert(housingUnit)
      .values({
        ...data,
        status: DEFAULT_STATUSES.housing,
      })
      .returning()
    unit = created

    await logAudit({
      action: 'CREATE',
      entity: 'HOUSING_UNIT',
      entityId: unit.id,
      userId: user.id,
      changes: { code: data.code, address: data.address },
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
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
  const user = await requirePermission('housing:write')
  const data = validateFormData(HousingUnitUpdateSchema, formData)
  const { id, ...updateData } = data

  try {
    const [updated] = await db
      .update(housingUnit)
      .set(updateData)
      .where(eq(housingUnit.id, id))
      .returning({ id: housingUnit.id })
    // Prisma threw when the unit was missing — keep that error path
    if (!updated) throw new Error(ERROR_MESSAGES.UNIT_UPDATE_ERROR)

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

export async function archiveHousingUnit(
  housingUnitId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await requirePermission('housing:write')
  try {
    const unit = await db.query.housingUnit.findFirst({
      where: eq(housingUnit.id, housingUnitId),
      with: {
        placements: { where: eq(placement.status, 'ACTIVE'), columns: { id: true } },
        spots: { where: eq(placementSpot.status, 'OCCUPIED'), columns: { id: true } },
      },
    })

    if (!unit) return { success: false, error: ERROR_MESSAGES.UNIT_NOT_FOUND }
    if (unit.placements.length > 0 || unit.spots.length > 0) {
      return { success: false, error: ERROR_MESSAGES.UNIT_ARCHIVE_BLOCKED }
    }

    await db.update(housingUnit).set({ status: 'CLOSED' }).where(eq(housingUnit.id, housingUnitId))

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

export async function restoreHousingUnit(
  housingUnitId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await requirePermission('housing:write')
  try {
    const unit = await db.query.housingUnit.findFirst({ where: eq(housingUnit.id, housingUnitId) })
    if (!unit) return { success: false, error: ERROR_MESSAGES.UNIT_NOT_FOUND }

    await db
      .update(housingUnit)
      .set({ status: 'AVAILABLE' })
      .where(eq(housingUnit.id, housingUnitId))

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
  reason: string,
): Promise<{ success: boolean; error?: string; blockerReport?: Record<string, number> }> {
  const user = await requirePermission('housing:write')
  try {
    if (confirmation !== 'DELETE') {
      return { success: false, error: 'Bestätigung fehlt (DELETE)' }
    }

    if (!reason || reason.trim().length < 10) {
      return {
        success: false,
        error: 'Bitte einen aussagekräftigen Grund angeben (mind. 10 Zeichen)',
      }
    }

    const unit = await db.query.housingUnit.findFirst({ where: eq(housingUnit.id, housingUnitId) })
    if (!unit) return { success: false, error: ERROR_MESSAGES.UNIT_NOT_FOUND }

    if (!isTestOrDemoCode(unit.code)) {
      return { success: false, error: 'Hard-Delete nur für Test-/Demo-Unterkünfte erlaubt' }
    }

    const [placements, incidents, maintenanceRequests, spots, tasks] = await Promise.all([
      db.$count(placement, eq(placement.housingUnitId, housingUnitId)),
      db.$count(incident, eq(incident.housingUnitId, housingUnitId)),
      db.$count(maintenanceRequest, eq(maintenanceRequest.housingUnitId, housingUnitId)),
      db.$count(placementSpot, eq(placementSpot.housingUnitId, housingUnitId)),
      db.$count(householdTask, eq(householdTask.housingUnitId, housingUnitId)),
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

    await db.delete(housingUnit).where(eq(housingUnit.id, housingUnitId))

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
