'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { logAudit } from '@/lib/audit'
import { mayReviewFact, type ClientFactKind } from '@/lib/client-facts/policy'
import { db, clientHealthContact, clientInsurance, clientPermit } from '@/lib/db'
import { logger } from '@/lib/logger'
import { getPortalResident } from '@/lib/portal-auth'
import { seatsForClient, staffViewerFor } from '@/lib/client-facts/access'
import {
  healthContactInputSchema,
  insuranceInputSchema,
  permitInputSchema,
  reviewInputSchema,
} from '@/lib/validation/client-facts'
import { CLIENT_FACT_LABELS as L } from '@/lib/constants/labels'

/**
 * Saving a client's own admin facts.
 *
 * Every action RETURNS its outcome and never throws for anything the person
 * must act on. This repo has already shipped the other version: a thrown
 * `ValidationError` reached React's error boundary, which cannot tell a system
 * fault from a rule a user must read, so it rendered "Etwas ist
 * schiefgelaufen" AND unmounted the route — destroying fourteen fields the
 * person had just typed. Here that would mean losing an insurance number
 * copied off a card.
 */
export interface ClientFactFormState {
  ok?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

const TABLES = {
  INSURANCE: clientInsurance,
  HEALTH_CONTACT: clientHealthContact,
  PERMIT: clientPermit,
} as const

const AUDIT_ENTITY = {
  INSURANCE: 'CLIENT_INSURANCE',
  HEALTH_CONTACT: 'CLIENT_HEALTH_CONTACT',
  PERMIT: 'CLIENT_PERMIT',
} as const

/** Anything the client edits returns to PENDING — including an edit after a confirmation. */
const PENDING_AGAIN = { status: 'PENDING' as const, reviewedBy: null, reviewedAt: null }

function failure(error: string, fieldErrors?: Record<string, string[]>): ClientFactFormState {
  return { ok: false, error, fieldErrors }
}

/**
 * Editing a confirmed fact un-confirms it, deliberately.
 *
 * "Geprüft" records that a member of staff saw a particular set of values. The
 * moment the client changes one, that statement is about something that no
 * longer exists — keeping the badge would let an edit inherit a check nobody
 * performed on it.
 */
export async function saveInsurance(
  _prev: ClientFactFormState,
  formData: FormData,
): Promise<ClientFactFormState> {
  const me = await getPortalResident()
  if (!me) return failure(L.errors.signedOut)

  const parsed = insuranceInputSchema.safeParse({
    id: formData.get('id')?.toString() || undefined,
    insurerName: formData.get('insurerName')?.toString() ?? '',
    policyNumber: formData.get('policyNumber')?.toString() ?? undefined,
    validUntil: formData.get('validUntil')?.toString() ?? undefined,
  })
  if (!parsed.success) {
    return failure(L.errors.checkFields, parsed.error.flatten().fieldErrors)
  }

  const { id, ...values } = parsed.data
  try {
    if (id) {
      const owned = await db.query.clientInsurance.findFirst({
        where: and(eq(clientInsurance.id, id), eq(clientInsurance.residentId, me.id)),
        columns: { id: true },
      })
      if (!owned) return failure(L.errors.notYours)
      await db
        .update(clientInsurance)
        .set({ ...values, ...PENDING_AGAIN })
        .where(eq(clientInsurance.id, id))
    } else {
      await db.insert(clientInsurance).values({ ...values, residentId: me.id })
    }
  } catch (error) {
    logger.errorWithCause('Saving client insurance failed', error, { residentId: me.id })
    return failure(L.errors.saveFailed)
  }

  await logAudit({
    action: id ? 'UPDATE' : 'CREATE',
    entity: AUDIT_ENTITY.INSURANCE,
    entityId: id ?? me.id,
    reason: L.audit.selfEntered,
  })
  revalidatePath('/portal/unterlagen')
  return { ok: true }
}

export async function saveHealthContact(
  _prev: ClientFactFormState,
  formData: FormData,
): Promise<ClientFactFormState> {
  const me = await getPortalResident()
  if (!me) return failure(L.errors.signedOut)

  const parsed = healthContactInputSchema.safeParse({
    id: formData.get('id')?.toString() || undefined,
    name: formData.get('name')?.toString() ?? '',
    profession: formData.get('profession')?.toString() ?? '',
    phone: formData.get('phone')?.toString() ?? undefined,
    address: formData.get('address')?.toString() ?? undefined,
    note: formData.get('note')?.toString() ?? undefined,
  })
  if (!parsed.success) {
    return failure(L.errors.checkFields, parsed.error.flatten().fieldErrors)
  }

  const { id, ...values } = parsed.data
  try {
    if (id) {
      const owned = await db.query.clientHealthContact.findFirst({
        where: and(eq(clientHealthContact.id, id), eq(clientHealthContact.residentId, me.id)),
        columns: { id: true },
      })
      if (!owned) return failure(L.errors.notYours)
      await db
        .update(clientHealthContact)
        .set({ ...values, ...PENDING_AGAIN })
        .where(eq(clientHealthContact.id, id))
    } else {
      await db.insert(clientHealthContact).values({ ...values, residentId: me.id })
    }
  } catch (error) {
    logger.errorWithCause('Saving client health contact failed', error, { residentId: me.id })
    return failure(L.errors.saveFailed)
  }

  await logAudit({
    action: id ? 'UPDATE' : 'CREATE',
    entity: AUDIT_ENTITY.HEALTH_CONTACT,
    entityId: id ?? me.id,
    reason: L.audit.selfEntered,
  })
  revalidatePath('/portal/unterlagen')
  return { ok: true }
}

/** One permit per person, so this upserts rather than appending. */
export async function savePermit(
  _prev: ClientFactFormState,
  formData: FormData,
): Promise<ClientFactFormState> {
  const me = await getPortalResident()
  if (!me) return failure(L.errors.signedOut)

  const parsed = permitInputSchema.safeParse({
    type: formData.get('type')?.toString() ?? 'UNSPECIFIED',
    validUntil: formData.get('validUntil')?.toString() ?? undefined,
  })
  if (!parsed.success) {
    return failure(L.errors.checkFields, parsed.error.flatten().fieldErrors)
  }

  try {
    const existing = await db.query.clientPermit.findFirst({
      where: eq(clientPermit.residentId, me.id),
      columns: { id: true },
    })
    if (existing) {
      await db
        .update(clientPermit)
        .set({ ...parsed.data, ...PENDING_AGAIN })
        .where(eq(clientPermit.id, existing.id))
    } else {
      await db.insert(clientPermit).values({ ...parsed.data, residentId: me.id })
    }
  } catch (error) {
    logger.errorWithCause('Saving client permit failed', error, { residentId: me.id })
    return failure(L.errors.saveFailed)
  }

  await logAudit({
    action: 'UPDATE',
    entity: AUDIT_ENTITY.PERMIT,
    entityId: me.id,
    reason: L.audit.selfEntered,
  })
  revalidatePath('/portal/unterlagen')
  return { ok: true }
}

/** The client may remove anything they entered. It is their record. */
export async function deleteClientFact(
  kind: ClientFactKind,
  id: string,
): Promise<ClientFactFormState> {
  const me = await getPortalResident()
  if (!me) return failure(L.errors.signedOut)

  const table = TABLES[kind]
  try {
    const owned = await db.query[
      kind === 'INSURANCE'
        ? 'clientInsurance'
        : kind === 'HEALTH_CONTACT'
          ? 'clientHealthContact'
          : 'clientPermit'
    ].findFirst({
      where: and(eq(table.id, id), eq(table.residentId, me.id)),
      columns: { id: true },
    })
    if (!owned) return failure(L.errors.notYours)
    await db.delete(table).where(eq(table.id, id))
  } catch (error) {
    logger.errorWithCause('Deleting client fact failed', error, { residentId: me.id, kind })
    return failure(L.errors.saveFailed)
  }

  await logAudit({ action: 'DELETE', entity: AUDIT_ENTITY[kind], entityId: id })
  revalidatePath('/portal/unterlagen')
  return { ok: true }
}

/**
 * A member of staff records that they have SEEN this — not that it is true.
 *
 * The permission is checked against the seats this person holds FOR THIS
 * CLIENT, not against their role in the abstract: a Jobcoach may read a permit
 * and may not confirm one, because confirming is a statement Betreuung makes.
 */
export async function reviewClientFact(
  _prev: ClientFactFormState,
  formData: FormData,
): Promise<ClientFactFormState> {
  const parsed = reviewInputSchema.safeParse({
    id: formData.get('id')?.toString() ?? '',
    kind: formData.get('kind')?.toString() ?? '',
    decision: formData.get('decision')?.toString() ?? '',
    staffNote: formData.get('staffNote')?.toString() ?? undefined,
  })
  if (!parsed.success) {
    return failure(L.errors.checkFields, parsed.error.flatten().fieldErrors)
  }

  const { id, kind, decision, staffNote } = parsed.data
  const viewer = await staffViewerFor()
  if (!viewer) return failure(L.errors.signedOut)

  const table = TABLES[kind]
  try {
    const row = await db
      .select({ residentId: table.residentId })
      .from(table)
      .where(eq(table.id, id))
      .limit(1)
    const residentId = row[0]?.residentId
    if (!residentId) return failure(L.errors.gone)

    const seats = await seatsForClient(viewer.userId, residentId)
    if (!mayReviewFact(kind, { scope: viewer.scope, seatsForClient: seats })) {
      return failure(L.errors.notYourClient)
    }

    await db
      .update(table)
      .set({ status: decision, staffNote, reviewedBy: viewer.userId, reviewedAt: new Date() })
      .where(eq(table.id, id))

    await logAudit({
      action: decision === 'CONFIRMED' ? 'RESOLVE' : 'UPDATE',
      entity: AUDIT_ENTITY[kind],
      entityId: id,
      userId: viewer.userId,
      reason: decision === 'CONFIRMED' ? L.audit.seenByStaff : L.audit.sentBack,
    })
  } catch (error) {
    logger.errorWithCause('Reviewing client fact failed', error, { kind, id })
    return failure(L.errors.saveFailed)
  }

  revalidatePath('/approvals')
  return { ok: true }
}
