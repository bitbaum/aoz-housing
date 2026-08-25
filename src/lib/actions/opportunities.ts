'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { requirePermission } from '@/lib/auth'
import { getResidentCookie } from '@/lib/portal-auth'
import { isFull } from '@/lib/opportunities/pipeline'
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

/* ------------------------------------------------------------------ *
 * Resident self-service
 *
 * These share the tables above and NOTHING else. They are guarded by the
 * resident cookie, never by a staff permission, and they may only ever touch
 * the acting resident's own row — a resident holding an application id that is
 * not theirs must get the same answer as one holding an id that does not
 * exist.
 * ------------------------------------------------------------------ */

// Module-private on purpose: a `'use server'` file may export nothing but
// async functions, and every non-function export it grows fails the build
// while passing lint, tsc and the whole test suite.
const PORTAL_OPPORTUNITY_PATH = '/portal/opportunities'

/**
 * Outcomes the board can report back, as URL params.
 *
 * A string rather than a thrown error because every one of these is a normal
 * thing that can happen to a resident — the last seat went while they were
 * reading, staff pulled the listing — and none of them is a fault of theirs to
 * be shown a crash for.
 */
type PortalOutcome =
  | 'ok=interest'
  | 'ok=withdrawn'
  | 'error=unavailable'
  | 'error=full'
  | 'error=locked'
  | 'error=failed'

async function actingResidentId(): Promise<string | null> {
  const code = await getResidentCookie()
  if (!code) return null

  const resident = await prisma.resident.findUnique({
    where: { code },
    select: { id: true },
  })
  return resident?.id ?? null
}

/** All the fallible work, so `redirect()` never runs inside a `try`. */
async function recordInterest(opportunityId: string, residentId: string): Promise<PortalOutcome> {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: { applications: { select: { stage: true } } },
  })

  // A DRAFT is a listing staff are still writing and an ARCHIVED one is over.
  // Neither is on the board, so arriving here means a stale page or a guessed
  // id — either way, nobody gets attached to a place that is not on offer.
  if (!opportunity || opportunity.status !== 'PUBLISHED') return 'error=unavailable'
  if (isFull(opportunity, opportunity.applications.map((a) => a.stage))) return 'error=full'

  try {
    await prisma.opportunityApplication.create({
      data: {
        opportunityId,
        residentId,
        stage: 'INTERESTED',
        // The resident put themselves forward. `supportedByUserId` stays null
        // on purpose: it is the honest record that nobody on the staff side has
        // picked this up yet, which is exactly what the queue is filtering for.
        createdBy: 'RESIDENT',
      },
    })
  } catch (error) {
    // Already attached. That IS the state they asked for, so reporting a
    // failure would be a lie about a button that worked the first time.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return 'ok=interest'
    }
    logger.errorWithCause('Failed to record resident interest', error, { opportunityId })
    return 'error=failed'
  }

  await logAudit({
    action: 'CREATE',
    entity: 'OPPORTUNITY_APPLICATION',
    entityId: opportunityId,
    // No `userId`: no member of staff did this. The actor is named in the
    // payload instead, because an audit row that silently attributes a
    // resident's own choice to nobody reads as a system action.
    changes: { residentId, stage: 'INTERESTED', actor: 'RESIDENT' },
  })

  return 'ok=interest'
}

export async function expressInterest(formData: FormData): Promise<void> {
  const residentId = await actingResidentId()
  if (!residentId) redirect('/login')

  const opportunityId = String(formData.get('opportunityId') || '')
  const outcome: PortalOutcome = opportunityId
    ? await recordInterest(opportunityId, residentId)
    : 'error=unavailable'

  revalidatePath(PORTAL_OPPORTUNITY_PATH)
  revalidateOpportunity(opportunityId || undefined)
  redirect(`${PORTAL_OPPORTUNITY_PATH}?${outcome}`)
}

/**
 * Take back an interest you registered yourself and nobody has acted on.
 *
 * The two conditions are the whole point. Once staff have moved the thread
 * along, a conversation has happened and deleting the row would erase THEIR
 * record of it; and a row staff created is their note that they suggested this
 * person, which is not the resident's to remove. Changing your mind later is a
 * thing you say to a person, not a row you delete — so those cases send you to
 * your team instead of failing silently.
 */
async function removeInterest(applicationId: string, residentId: string): Promise<PortalOutcome> {
  const application = await prisma.opportunityApplication.findUnique({
    where: { id: applicationId },
    select: { id: true, residentId: true, opportunityId: true, createdBy: true, stage: true },
  })

  // Same answer for "not yours" as for "does not exist": a distinguishable
  // response would confirm that some other resident holds this application.
  if (!application || application.residentId !== residentId) return 'error=unavailable'
  if (application.createdBy !== 'RESIDENT' || application.stage !== 'INTERESTED') {
    return 'error=locked'
  }

  try {
    await prisma.opportunityApplication.delete({ where: { id: applicationId } })
  } catch (error) {
    logger.errorWithCause('Failed to withdraw resident interest', error, { applicationId })
    return 'error=failed'
  }

  await logAudit({
    action: 'DELETE',
    entity: 'OPPORTUNITY_APPLICATION',
    entityId: application.opportunityId,
    changes: { residentId, actor: 'RESIDENT' },
  })

  return 'ok=withdrawn'
}

export async function withdrawInterest(formData: FormData): Promise<void> {
  const residentId = await actingResidentId()
  if (!residentId) redirect('/login')

  const applicationId = String(formData.get('applicationId') || '')
  const outcome: PortalOutcome = applicationId
    ? await removeInterest(applicationId, residentId)
    : 'error=unavailable'

  revalidatePath(PORTAL_OPPORTUNITY_PATH)
  revalidatePath('/opportunities')
  redirect(`${PORTAL_OPPORTUNITY_PATH}?${outcome}`)
}
