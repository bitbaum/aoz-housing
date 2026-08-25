'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requirePermission } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/db'
import {
  ApplicationCreateSchema,
  ApplicationStageChangeSchema,
  OpportunityInputSchema,
  OpportunityUpdateSchema,
  validateFormData,
} from '@/lib/validation'
import { evidenceForStartedApplication } from '@/lib/opportunities/pipeline'
import type { OpportunityStatusId } from '@/lib/config/opportunities'

function revalidateOpportunity(opportunityId?: string) {
  revalidatePath('/opportunities')
  revalidatePath('/learning')
  if (opportunityId) {
    revalidatePath(`/opportunities/${opportunityId}`)
    revalidatePath(`/opportunities/${opportunityId}/edit`)
  }
}

/** Empty strings from a form are absent values, not blank ones. */
function nullifyBlanks<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data }
  for (const key of Object.keys(out) as (keyof T)[]) {
    if (out[key] === '') out[key] = null as T[keyof T]
  }
  return out
}

export async function createOpportunity(formData: FormData): Promise<void> {
  const user = await requirePermission('opportunities:write')
  const data = validateFormData(OpportunityInputSchema, formData)

  let created
  try {
    created = await prisma.opportunity.create({
      data: {
        ...nullifyBlanks(data),
        createdByUserId: user.id,
        updatedByUserId: user.id,
      },
    })

    await logAudit({
      action: 'CREATE',
      entity: 'OPPORTUNITY',
      entityId: created.id,
      userId: user.id,
      changes: { title: data.title, kind: data.kind, status: data.status },
    })
  } catch (error) {
    logger.errorWithCause('Failed to create opportunity', error, { title: data.title })
    throw new Error('Einsatzplatz konnte nicht erstellt werden')
  }

  revalidateOpportunity(created.id)
  redirect(`/opportunities/${created.id}`)
}

export async function updateOpportunity(formData: FormData): Promise<void> {
  const user = await requirePermission('opportunities:write')
  const { id, ...data } = validateFormData(OpportunityUpdateSchema, formData)

  try {
    await prisma.opportunity.update({
      where: { id },
      data: { ...nullifyBlanks(data), updatedByUserId: user.id },
    })

    await logAudit({
      action: 'UPDATE',
      entity: 'OPPORTUNITY',
      entityId: id,
      userId: user.id,
      changes: data,
    })
  } catch (error) {
    logger.errorWithCause('Failed to update opportunity', error, { opportunityId: id })
    throw new Error('Einsatzplatz konnte nicht aktualisiert werden')
  }

  revalidateOpportunity(id)
  redirect(`/opportunities/${id}`)
}

async function setStatus(opportunityId: string, status: OpportunityStatusId): Promise<void> {
  const user = await requirePermission('opportunities:write')

  try {
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { status, updatedByUserId: user.id },
    })

    await logAudit({
      action: status === 'ARCHIVED' ? 'ARCHIVE' : 'UPDATE',
      entity: 'OPPORTUNITY',
      entityId: opportunityId,
      userId: user.id,
      changes: { status },
    })
  } catch (error) {
    logger.errorWithCause('Failed to change opportunity status', error, { opportunityId, status })
    throw new Error('Stand konnte nicht geändert werden')
  }

  revalidateOpportunity(opportunityId)
}

export async function publishOpportunity(opportunityId: string): Promise<void> {
  await setStatus(opportunityId, 'PUBLISHED')
}

export async function archiveOpportunity(opportunityId: string): Promise<void> {
  await setStatus(opportunityId, 'ARCHIVED')
}

export async function addApplicant(formData: FormData): Promise<void> {
  const user = await requirePermission('opportunities:write')
  const data = validateFormData(ApplicationCreateSchema, formData)

  try {
    await prisma.opportunityApplication.create({
      data: {
        opportunityId: data.opportunityId,
        residentId: data.residentId,
        note: data.note || null,
        stage: 'INTERESTED',
        // Staff put this person forward. The resident portal will set
        // 'RESIDENT' for self-service interest in the next phase.
        createdBy: 'STAFF',
        supportedByUserId: user.id,
      },
    })

    await logAudit({
      action: 'CREATE',
      entity: 'OPPORTUNITY_APPLICATION',
      entityId: data.opportunityId,
      userId: user.id,
      changes: { residentId: data.residentId, stage: 'INTERESTED' },
    })
  } catch (error) {
    logger.errorWithCause('Failed to add applicant', error, {
      opportunityId: data.opportunityId,
      residentId: data.residentId,
    })
    throw new Error('Person konnte nicht zugeordnet werden')
  }

  revalidateOpportunity(data.opportunityId)
}

/**
 * Move one thread along, and keep the evidence in step with it.
 *
 * Everything happens in ONE transaction. A LearningRecord written without its
 * back-link would be an orphan certificate that reappears on every later stage
 * change — the resident's dossier would slowly fill with duplicates of one
 * afternoon's work, and nothing would report an error.
 */
export async function changeApplicationStage(formData: FormData): Promise<void> {
  const user = await requirePermission('opportunities:write')
  const { applicationId, stage, hours } = validateFormData(ApplicationStageChangeSchema, formData)

  const application = await prisma.opportunityApplication.findUnique({
    where: { id: applicationId },
    include: { opportunity: true },
  })
  if (!application) throw new Error('Bewerbung nicht gefunden')

  const now = new Date()

  try {
    await prisma.$transaction(async (tx) => {
      let learningRecordId = application.learningRecordId

      // Generate the evidence exactly once. A coach correcting a misclick
      // back and forth through STARTED must not mint a record each time —
      // `learningRecordId` is unique, so the second insert would throw and
      // the stage move would fail for a reason nobody could act on.
      if (stage === 'STARTED' && !learningRecordId) {
        const record = await tx.learningRecord.create({
          data: {
            residentId: application.residentId,
            ...evidenceForStartedApplication(application.opportunity, now),
          },
        })
        learningRecordId = record.id
      }

      // The total is only knowable when the engagement is over, which is why
      // it is asked for here and never derived from hoursPerWeek.
      if (stage === 'ENDED' && learningRecordId) {
        await tx.learningRecord.update({
          where: { id: learningRecordId },
          data: {
            status: 'COMPLETED',
            completedAt: now,
            ...(hours !== null ? { hours } : {}),
          },
        })
      }

      await tx.opportunityApplication.update({
        where: { id: applicationId },
        data: {
          stage,
          stageChangedAt: now,
          learningRecordId,
          supportedByUserId: application.supportedByUserId ?? user.id,
        },
      })
    })

    await logAudit({
      action: 'UPDATE',
      entity: 'OPPORTUNITY_APPLICATION',
      entityId: applicationId,
      userId: user.id,
      changes: { from: application.stage, to: stage, ...(hours !== null ? { hours } : {}) },
    })
  } catch (error) {
    logger.errorWithCause('Failed to change application stage', error, { applicationId, stage })
    throw new Error('Stand konnte nicht geändert werden')
  }

  revalidateOpportunity(application.opportunityId)
}
