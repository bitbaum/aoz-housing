'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireStaffAuth, requirePermission } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import {
  ActivityInputSchema,
  ActivityUpdateSchema,
  validateFormData,
} from '@/lib/validation'
import {
  createActivityRecord,
  setActivityStatus,
  updateActivityRecord,
} from '@/lib/data/activities'

const ACTIVITY_PATHS = ['/activities', '/portal', '/portal/activities']

function revalidateActivityPaths(activityId?: string) {
  ACTIVITY_PATHS.forEach((path) => revalidatePath(path))
  if (activityId) {
    revalidatePath(`/activities/${activityId}/edit`)
  }
}

function normalizeActivityData<T extends {
  costNote?: string | null
  location?: string | null
  website?: string | null
  phone?: string | null
  schedule?: string | null
}>(data: T) {
  return {
    ...data,
    costNote: data.costNote ?? null,
    location: data.location ?? null,
    website: data.website ?? null,
    phone: data.phone ?? null,
    schedule: data.schedule ?? null,
  }
}

export async function createActivity(formData: FormData): Promise<void> {
  const user = await requirePermission('activities:write')
  const data = validateFormData(ActivityInputSchema, formData)

  let activity
  try {
    activity = await createActivityRecord({
      ...normalizeActivityData(data),
      userId: user.id,
    })

    await logAudit({
      action: 'CREATE',
      entity: 'ACTIVITY',
      entityId: activity.id,
      userId: user.id,
      changes: { title: data.title, status: data.status, category: data.category },
    })
  } catch (error) {
    logger.errorWithCause('Failed to create activity', error, { title: data.title })
    throw new Error('Aktivität konnte nicht erstellt werden')
  }

  revalidateActivityPaths(activity.id)
  redirect('/activities')
}

export async function updateActivity(formData: FormData): Promise<void> {
  const user = await requirePermission('activities:write')
  const data = validateFormData(ActivityUpdateSchema, formData)
  const { id, ...updateData } = data

  try {
    await updateActivityRecord(id, {
      ...normalizeActivityData(updateData),
      userId: user.id,
    })

    await logAudit({
      action: 'UPDATE',
      entity: 'ACTIVITY',
      entityId: id,
      userId: user.id,
      changes: updateData,
    })
  } catch (error) {
    logger.errorWithCause('Failed to update activity', error, { activityId: id })
    throw new Error('Aktivität konnte nicht aktualisiert werden')
  }

  revalidateActivityPaths(id)
  redirect('/activities')
}

export async function publishActivity(activityId: string): Promise<void> {
  const user = await requirePermission('activities:write')
  try {
    await setActivityStatus(activityId, 'PUBLISHED', user.id)

    await logAudit({
      action: 'UPDATE',
      entity: 'ACTIVITY',
      entityId: activityId,
      userId: user.id,
      changes: { status: 'PUBLISHED' },
    })

    revalidateActivityPaths(activityId)
    redirect('/activities')
  } catch (error) {
    logger.errorWithCause('Failed to publish activity', error, { activityId })
    throw new Error('Aktivität konnte nicht veröffentlicht werden')
  }
}

export async function archiveActivity(activityId: string): Promise<void> {
  const user = await requirePermission('activities:write')
  try {
    await setActivityStatus(activityId, 'ARCHIVED', user.id)

    await logAudit({
      action: 'ARCHIVE',
      entity: 'ACTIVITY',
      entityId: activityId,
      userId: user.id,
      changes: { status: 'ARCHIVED', highlight: false },
    })

    revalidateActivityPaths(activityId)
    redirect('/activities')
  } catch (error) {
    logger.errorWithCause('Failed to archive activity', error, { activityId })
    throw new Error('Aktivität konnte nicht archiviert werden')
  }
}
