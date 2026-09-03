'use server'

import {
  db,
  resident as residentTable,
  placement,
  incident,
  incidentInvolvement,
  maintenanceRequest,
  compatibilityAssessment,
  isUniqueViolation,
} from '@/lib/db'
import { eq, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { validateFormData, ResidentInputSchema, ResidentUpdateSchema } from '@/lib/validation'
import { generateResidentCode } from '@/lib/auth/code-generation'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { DEFAULT_STATUSES } from '@/lib/config/thresholds'
import { ERROR_MESSAGES } from '@/lib/constants/error-messages'
import { requirePermission } from '@/lib/auth'

export async function createResident(formData: FormData): Promise<void> {
  const user = await requirePermission('residents:write')
  const data = validateFormData(ResidentInputSchema, formData)

  // Blank means "mint one". Trimmed and upper-cased first, so a stray space or
  // a lower-case paste of a real paper code does not become a second identity
  // that login can never resolve — the same normalisation the code login does.
  const typed = data.code?.trim().toUpperCase()
  const code = typed && typed.length > 0 ? typed : generateResidentCode()

  let resident
  try {
    const [created] = await db
      .insert(residentTable)
      .values({
        ...data,
        code,
        status: DEFAULT_STATUSES.resident,
      })
      .returning()
    resident = created

    await logAudit({
      action: 'CREATE',
      entity: 'RESIDENT',
      entityId: resident.id,
      userId: user.id,
      changes: { code },
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error(ERROR_MESSAGES.RESIDENT_CODE_EXISTS)
    }
    logger.errorWithCause('Failed to create resident', error, { code })
    throw new Error(ERROR_MESSAGES.RESIDENT_CREATE_ERROR)
  }

  revalidatePath('/residents')
  revalidatePath('/matching')
  // Redirect to matching page for immediate placement
  redirect(`/matching?resident=${resident.id}&new=1`)
}

export async function exitResident(
  residentId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await requirePermission('residents:write')
  try {
    const resident = await db.query.resident.findFirst({
      where: eq(residentTable.id, residentId),
      with: { placements: { where: eq(placement.status, 'ACTIVE') } },
    })

    if (!resident) {
      return { success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND }
    }

    if (resident.placements.length > 0) {
      return { success: false, error: ERROR_MESSAGES.RESIDENT_HAS_ACTIVE_PLACEMENTS }
    }

    await db.update(residentTable).set({ status: 'EXITED' }).where(eq(residentTable.id, residentId))

    await logAudit({
      action: 'END',
      entity: 'RESIDENT',
      entityId: residentId,
      userId: user.id,
      changes: { status: 'EXITED' },
      reason: 'Klient*in ausgetreten',
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
  const user = await requirePermission('residents:write')
  const data = validateFormData(ResidentUpdateSchema, formData)
  const { id, code: _code, ...updateData } = data

  try {
    const [updated] = await db
      .update(residentTable)
      .set(updateData)
      .where(eq(residentTable.id, id))
      .returning({ id: residentTable.id })

    // Updating a missing row used to throw (P2025); keep that error path.
    if (!updated) {
      throw new Error(ERROR_MESSAGES.RESIDENT_NOT_FOUND)
    }

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

export async function archiveResident(
  residentId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await requirePermission('residents:write')
  try {
    const resident = await db.query.resident.findFirst({
      where: eq(residentTable.id, residentId),
      with: { placements: { where: eq(placement.status, 'ACTIVE') } },
    })

    if (!resident) {
      return { success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND }
    }

    if (resident.placements.length > 0) {
      return { success: false, error: ERROR_MESSAGES.RESIDENT_ARCHIVE_BLOCKED }
    }

    await db.update(residentTable).set({ status: 'EXITED' }).where(eq(residentTable.id, residentId))

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

export async function restoreResident(
  residentId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await requirePermission('residents:write')
  try {
    const resident = await db.query.resident.findFirst({
      where: eq(residentTable.id, residentId),
      with: { placements: { where: eq(placement.status, 'ACTIVE') } },
    })

    if (!resident) {
      return { success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND }
    }

    const nextStatus = resident.placements.length > 0 ? 'PLACED' : 'ACTIVE'

    await db
      .update(residentTable)
      .set({ status: nextStatus })
      .where(eq(residentTable.id, residentId))

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
  reason: string,
): Promise<{ success: boolean; error?: string; blockerReport?: Record<string, number> }> {
  const user = await requirePermission('residents:write')
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

    const resident = await db.query.resident.findFirst({
      where: eq(residentTable.id, residentId),
    })
    if (!resident) {
      return { success: false, error: ERROR_MESSAGES.RESIDENT_NOT_FOUND }
    }

    if (!isTestOrDemoCode(resident.code)) {
      return { success: false, error: 'Hard-Delete nur für Test-/Demo-Klient*innen erlaubt' }
    }

    const [
      placements,
      incidentsReported,
      incidentsAsSubject,
      involvements,
      maintenanceRequests,
      assessments,
    ] = await Promise.all([
      db.$count(placement, eq(placement.residentId, residentId)),
      db.$count(incident, eq(incident.reportedById, residentId)),
      db.$count(incident, eq(incident.subjectId, residentId)),
      db.$count(incidentInvolvement, eq(incidentInvolvement.residentId, residentId)),
      db.$count(maintenanceRequest, eq(maintenanceRequest.reportedById, residentId)),
      db.$count(
        compatibilityAssessment,
        or(
          eq(compatibilityAssessment.residentId, residentId),
          eq(compatibilityAssessment.comparedWithId, residentId),
        ),
      ),
    ])

    if (
      placements +
        incidentsReported +
        incidentsAsSubject +
        involvements +
        maintenanceRequests +
        assessments >
      0
    ) {
      return {
        success: false,
        error: 'Hard-Delete blockiert: Klient*in hat verknüpfte Historie',
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

    await db.delete(residentTable).where(eq(residentTable.id, residentId))

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
