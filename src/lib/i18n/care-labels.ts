import type { MessageKey } from './dictionaries/de'
import type { Translator } from './index'
import type { AppointmentStatusId, CareRoleId } from '@/lib/config/care'

/**
 * Translated names for the care enums.
 *
 * The staff side reads the German labels straight out of `lib/config/care.ts`
 * and that is right — staff UI is German by decision. The portal is not, and
 * the translated domain names already existed as `care.housing`,
 * `care.social`, `care.job` and `care.volunteering`. `PortalAppointmentsCard`
 * imported `CARE_ROLE_LABELS` anyway, so a resident reading the portal in
 * Arabic saw their care team's domains in German, beside a correctly
 * translated heading — the display layer acting as a second author for a rule
 * that already had one.
 *
 * Keyed by the config's own id unions, so adding a domain or a status fails to
 * compile here until it has a key.
 */

const DOMAIN_KEYS: Record<CareRoleId, MessageKey> = {
  HOUSING: 'care.housing',
  SOCIAL: 'care.social',
  JOB: 'care.job',
  VOLUNTEERING: 'care.volunteering',
}

/**
 * What a resident calls each state of their own appointment.
 *
 * Not the staff wording. "Stattgefunden" is a record-keeping term; the person
 * who was there does not need telling that the meeting they attended happened.
 * COMPLETED and NO_SHOW therefore read as past rather than as an assessment —
 * a portal that labels someone "Nicht erschienen" is scolding them.
 */
const STATUS_KEYS: Record<AppointmentStatusId, MessageKey> = {
  REQUESTED: 'care.statusRequested',
  SCHEDULED: 'care.statusScheduled',
  COMPLETED: 'care.statusPast',
  CANCELLED: 'care.statusCancelled',
  NO_SHOW: 'care.statusPast',
}

export function careDomainLabel(t: Translator, domain: CareRoleId): string {
  return t(DOMAIN_KEYS[domain])
}

export function appointmentStatusLabel(t: Translator, status: AppointmentStatusId): string {
  return t(STATUS_KEYS[status])
}
