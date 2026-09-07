/**
 * Insurances and permits that are running out.
 *
 * The half of the client-facts feature that closes the original complaint:
 * "my insurance has to be extended every 6 months, and for that I need to
 * write Franziska." Recording the date lets a client SEE it; this is what
 * makes the date reach the person who can act before it lapses.
 *
 * ⚠️ THIS IS IN-APP, NOT EMAIL, and that was forced by the deployment rather
 * than chosen for convenience. `STAFF_EMAIL_RECIPIENTS` is unset on the live
 * box, so `notifyStaff()` returns false without sending — every staff email
 * this product composes today reaches nobody. Staff also have no accounts, so
 * there is no per-person address to fall back on. A reminder mailed into that
 * is a reminder that does not exist, which is the failure this whole area of
 * the codebase keeps producing. The four people who use this product open it
 * daily; the surface they open is where the reminder belongs.
 */

import { and, isNotNull, lte } from 'drizzle-orm'

import { clientInsurance, clientPermit, db } from '@/lib/db'
import { RESIDENT_NAME_SELECT } from '@/lib/utils/resident-name'

import { daysUntil, RENEWAL_NOTICE_DAYS, type ClientFactKind } from './policy'

export interface ExpiringFact {
  id: string
  kind: Extract<ClientFactKind, 'INSURANCE' | 'PERMIT'>
  resident: { id: string; code: string; displayName: string | null }
  /** What is running out — the insurer's name, or the permit letter. */
  label: string
  validUntil: Date
  /** Negative once it has lapsed. */
  daysLeft: number
  status: string
}

/**
 * Everything expiring inside the notice window, and everything already lapsed,
 * most urgent first.
 *
 * Health contacts are absent by construction: a dentist does not expire. Only
 * the two dated kinds can appear here, which is why `kind` is narrowed rather
 * than reusing `ClientFactKind` whole — a future dated fact has to opt in
 * deliberately instead of arriving here by accident.
 */
export async function expiringFacts(now: Date): Promise<ExpiringFact[]> {
  const horizon = new Date(now.getTime() + RENEWAL_NOTICE_DAYS * 24 * 60 * 60 * 1000)

  const [insurances, permits] = await Promise.all([
    db.query.clientInsurance.findMany({
      where: and(isNotNull(clientInsurance.validUntil), lte(clientInsurance.validUntil, horizon)),
      columns: { id: true, insurerName: true, validUntil: true, status: true },
      with: { resident: { columns: RESIDENT_NAME_SELECT } },
    }),
    db.query.clientPermit.findMany({
      where: and(isNotNull(clientPermit.validUntil), lte(clientPermit.validUntil, horizon)),
      columns: { id: true, type: true, validUntil: true, status: true },
      with: { resident: { columns: RESIDENT_NAME_SELECT } },
    }),
  ])

  const facts: ExpiringFact[] = [
    ...insurances.map((row) => ({
      id: row.id,
      kind: 'INSURANCE' as const,
      resident: row.resident,
      label: row.insurerName,
      validUntil: row.validUntil!,
      daysLeft: daysUntil(row.validUntil, now) ?? 0,
      status: row.status,
    })),
    ...permits.map((row) => ({
      id: row.id,
      kind: 'PERMIT' as const,
      resident: row.resident,
      label: row.type,
      validUntil: row.validUntil!,
      daysLeft: daysUntil(row.validUntil, now) ?? 0,
      status: row.status,
    })),
  ]

  // Most urgent first, so an already-lapsed insurance outranks one with a
  // month to go. Ties broken by name for a stable order between renders.
  return facts.sort(
    (a, b) => a.daysLeft - b.daysLeft || a.resident.code.localeCompare(b.resident.code),
  )
}

/**
 * The days-out at which a reminder is worth SAYING something again.
 *
 * A daily message for sixty days is how a warning becomes wallpaper — this
 * codebase already learned that alerts need a cooldown per subject rather than
 * per detection. Firing only on these crossings needs no `lastNotifiedAt`
 * column and no state at all: the check runs daily, so each milestone happens
 * exactly once per document.
 *
 * 60 is the notice window opening, 30 and 14 are "book the appointment now",
 * 7 and 1 are the last honest chances, 0 is the day it lapses.
 */
export const RENEWAL_MILESTONE_DAYS: readonly number[] = [60, 30, 14, 7, 1, 0]

/** Whether today is a day this document deserves to be raised again. */
export function isMilestoneDay(daysLeft: number): boolean {
  return RENEWAL_MILESTONE_DAYS.includes(daysLeft)
}
