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
import { DEFAULT_STATUSES } from '@/lib/config/thresholds'

export async function createHousingUnit(formData: FormData): Promise<void> {
  const data = validateFormData(HousingUnitInputSchema, formData)

  const unit = await prisma.housingUnit.create({
    data: {
      ...data,
      status: DEFAULT_STATUSES.housing,
    },
  })

  await logAudit({
    action: 'CREATE',
    entity: 'HOUSING_UNIT',
    entityId: unit.id,
    changes: { code: data.code, address: data.address },
  })

  revalidatePath('/housing')
  // Redirect to spots page for immediate room/bed setup
  redirect(`/housing/${unit.id}/spots?new=1`)
}

export async function updateHousingUnit(formData: FormData): Promise<void> {
  const data = validateFormData(HousingUnitUpdateSchema, formData)
  const { id, ...updateData } = data

  await prisma.housingUnit.update({
    where: { id },
    data: updateData,
  })

  await logAudit({
    action: 'UPDATE',
    entity: 'HOUSING_UNIT',
    entityId: id,
    changes: updateData,
  })

  revalidatePath('/housing')
  revalidatePath(`/housing/${id}`)
  redirect(`/housing/${id}`)
}

export async function archiveHousingUnit(housingUnitId: string): Promise<{ success: boolean; error?: string }> {
  const unit = await prisma.housingUnit.findUnique({
    where: { id: housingUnitId },
    include: {
      placements: { where: { status: 'ACTIVE' }, select: { id: true } },
      spots: { where: { status: 'OCCUPIED' }, select: { id: true } },
    },
  })

  if (!unit) return { success: false, error: 'Unterkunft nicht gefunden' }
  if (unit.placements.length > 0 || unit.spots.length > 0) {
    return { success: false, error: 'Archivieren nicht möglich: aktive Belegung vorhanden' }
  }

  await prisma.housingUnit.update({
    where: { id: housingUnitId },
    data: { status: 'CLOSED' },
  })

  await logAudit({
    action: 'ARCHIVE',
    entity: 'HOUSING_UNIT',
    entityId: housingUnitId,
    changes: { status: 'CLOSED' },
  })

  revalidatePath('/housing')
  revalidatePath(`/housing/${housingUnitId}`)
  return { success: true }
}

export async function restoreHousingUnit(housingUnitId: string): Promise<{ success: boolean; error?: string }> {
  const unit = await prisma.housingUnit.findUnique({ where: { id: housingUnitId } })
  if (!unit) return { success: false, error: 'Unterkunft nicht gefunden' }

  await prisma.housingUnit.update({
    where: { id: housingUnitId },
    data: { status: 'AVAILABLE' },
  })

  await logAudit({
    action: 'RESTORE',
    entity: 'HOUSING_UNIT',
    entityId: housingUnitId,
    changes: { status: 'AVAILABLE' },
  })

  revalidatePath('/housing')
  revalidatePath(`/housing/${housingUnitId}`)
  return { success: true }
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
  if (confirmation !== 'DELETE') {
    return { success: false, error: 'Bestätigung fehlt (DELETE)' }
  }

  if (!reason || reason.trim().length < 10) {
    return { success: false, error: 'Bitte einen aussagekräftigen Grund angeben (mind. 10 Zeichen)' }
  }

  const unit = await prisma.housingUnit.findUnique({ where: { id: housingUnitId } })
  if (!unit) return { success: false, error: 'Unterkunft nicht gefunden' }

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
    reason,
    changes: { code: unit.code, protectedDelete: true },
  })

  revalidatePath('/housing')
  return { success: true }
}
