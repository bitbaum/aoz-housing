/**
 * Care work — SSOT for the four domains a resident actually meets.
 *
 * Housing, Sozialarbeit, Jobcoach and Freiwilligenarbeit are not four apps.
 * They are four seats on one person, with appointments and a small catalog
 * of operational facts. Adding a field is a line in CARE_ATTRIBUTE_CATALOG,
 * never a new column and never a one-off form. Nothing here is a diagnosis
 * or an asylum status.
 */

import type { StaffRole } from '@/lib/auth/role-policy'

export const CARE_ROLES = ['HOUSING', 'SOCIAL', 'JOB', 'VOLUNTEERING'] as const
export type CareRoleId = (typeof CARE_ROLES)[number]

/** Which staff role owns which seat. Leitung (ADMIN) may work every seat. */
export const CARE_DOMAIN_STAFF_ROLE: Record<CareRoleId, Exclude<StaffRole, 'ADMIN'>> = {
  HOUSING: 'BETREUUNG',
  SOCIAL: 'SOZIALARBEIT',
  JOB: 'JOBCOACH',
  VOLUNTEERING: 'FREIWILLIGENARBEIT',
}

/**
 * The same mapping read the other way: which seat a staff role works in.
 *
 * DERIVED, never written out. This used to be a second hand-maintained literal
 * in `config/care-role-domain.ts` — the inverse of the map above, with nothing
 * deriving it and no test comparing the two. Adding a fifth seat could update
 * one file and ship green, and a role would then write into a domain the other
 * half of the app believed belonged to someone else.
 *
 * ADMIN is absent on purpose. Leitung works every seat, so it has no single
 * domain, and a caller asking "which one is theirs?" must handle that rather
 * than be handed an arbitrary answer.
 */
export const STAFF_ROLE_CARE_DOMAIN: Partial<Record<StaffRole, CareRoleId>> = Object.fromEntries(
  CARE_ROLES.map((domain) => [CARE_DOMAIN_STAFF_ROLE[domain], domain])
)

export const CARE_ROLE_LABELS: Record<CareRoleId, string> = {
  HOUSING: 'Wohnen / Betreuung',
  SOCIAL: 'Sozialarbeit',
  JOB: 'Jobcoach',
  VOLUNTEERING: 'Freiwilligenarbeit',
}

export const APPOINTMENT_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const
export type AppointmentStatusId = (typeof APPOINTMENT_STATUSES)[number]

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatusId, string> = {
  SCHEDULED: 'Geplant',
  COMPLETED: 'Stattgefunden',
  CANCELLED: 'Abgesagt',
  NO_SHOW: 'Nicht erschienen',
}

export type CareAttributeKind = 'text' | 'textarea' | 'select'

export interface CareAttributeOption {
  value: string
  label: string
}

export interface CareAttributeDef {
  key: string
  label: string
  hint?: string
  kind: CareAttributeKind
  options?: readonly CareAttributeOption[]
}

export const CARE_ATTRIBUTE_CATALOG: Record<CareRoleId, readonly CareAttributeDef[]> = {
  HOUSING: [
    {
      key: 'reachability',
      label: 'Erreichbarkeit',
      hint: 'Wann und wie die Person erreichbar ist — keine privaten Nummern ohne Absprache.',
      kind: 'textarea',
    },
    {
      key: 'keys',
      label: 'Schlüssel',
      kind: 'select',
      options: [
        { value: 'received', label: 'Erhalten' },
        { value: 'missing', label: 'Fehlt' },
        { value: 'replacement', label: 'Ersatz unterwegs' },
      ],
    },
    {
      key: 'housing_focus',
      label: 'Aktueller Wohnfokus',
      hint: 'Was als Nächstes im Wohnen zu klären ist.',
      kind: 'textarea',
    },
  ],
  SOCIAL: [
    {
      key: 'next_step',
      label: 'Nächster Schritt',
      hint: 'Konkret und operational — keine Diagnosen, keine Verfahrensdetails.',
      kind: 'textarea',
    },
    {
      key: 'check_in_cadence',
      label: 'Rhythmus',
      kind: 'select',
      options: [
        { value: 'weekly', label: 'Wöchentlich' },
        { value: 'biweekly', label: 'Alle zwei Wochen' },
        { value: 'monthly', label: 'Monatlich' },
        { value: 'as_needed', label: 'Nach Bedarf' },
      ],
    },
  ],
  JOB: [
    {
      key: 'job_goal',
      label: 'Berufsziel',
      kind: 'text',
    },
    {
      key: 'work_status',
      label: 'Stand Arbeit',
      kind: 'select',
      options: [
        { value: 'searching', label: 'Suche' },
        { value: 'course', label: 'Kurs / Qualifikation' },
        { value: 'employed', label: 'Erwerbstätig' },
        { value: 'other', label: 'Anderes' },
      ],
    },
    {
      key: 'german_focus',
      label: 'Deutsch-Fokus',
      kind: 'select',
      options: [
        { value: 'none', label: 'Kein aktueller Fokus' },
        { value: 'A1', label: 'A1' },
        { value: 'A2', label: 'A2' },
        { value: 'B1', label: 'B1' },
        { value: 'B2', label: 'B2+' },
      ],
    },
  ],
  VOLUNTEERING: [
    {
      key: 'interest_area',
      label: 'Interessengebiet',
      hint: 'Wofür sich die Person engagieren möchte oder engagiert.',
      kind: 'text',
    },
    {
      key: 'engagement_status',
      label: 'Stand Engagement',
      kind: 'select',
      options: [
        { value: 'interested', label: 'Interessiert' },
        { value: 'matched', label: 'Vermittelt' },
        { value: 'active', label: 'Aktiv' },
        { value: 'paused', label: 'Pausiert' },
      ],
    },
  ],
}

export function attributeDef(domain: CareRoleId, key: string): CareAttributeDef | undefined {
  return CARE_ATTRIBUTE_CATALOG[domain].find((item) => item.key === key)
}

export function isCatalogKey(domain: CareRoleId, key: string): boolean {
  return CARE_ATTRIBUTE_CATALOG[domain].some((item) => item.key === key)
}

export function canWriteCareDomain(staffRole: StaffRole, domain: CareRoleId): boolean {
  if (staffRole === 'ADMIN') return true
  return CARE_DOMAIN_STAFF_ROLE[domain] === staffRole
}

export function writableCareDomains(staffRole: StaffRole): CareRoleId[] {
  return CARE_ROLES.filter((domain) => canWriteCareDomain(staffRole, domain))
}

export const CARE_LABELS = {
  title: 'Betreuungsteam',
  workspaceTitle: 'Begleitung',
  /**
   * Names the seats actually on the page.
   *
   * This was a fixed sentence — "Wohnen, Sozialarbeit, Jobcoach und
   * Freiwilligenarbeit — dieselben vier Sitze" — printed above a workspace
   * that now renders only the seats the viewer works. A heading naming items
   * the page does not contain is the same failure as the portal group called
   * "Zusammen entscheiden" that held nothing to decide: the list changed, the
   * name stayed, and every check remained green. Deriving it from the rendered
   * domains means it cannot go stale.
   */
  workspaceSubtitle: (domains: readonly CareRoleId[]): string =>
    `${domains.map((domain) => CARE_ROLE_LABELS[domain]).join(' · ')} — Termine und was für die Arbeit nützt.`,
  portalTitle: 'Dein Team',
  portalSubtitle: 'Die Menschen, die für dich zuständig sind.',
  empty: 'Noch niemand zugewiesen.',
  portalEmpty: 'Noch niemand zugewiesen. Die Betreuung trägt das Team ein.',
  assign: 'Zuweisen',
  unassigned: 'Nicht zugewiesen',
  save: 'Speichern',
  saving: 'Wird gespeichert...',
  attributes: 'Für die Arbeit',
  appointments: 'Termine',
  appointmentsEmpty: 'Keine Termine.',
  domainEmpty: 'Noch leer',
  appointmentAdd: 'Termin setzen',
  appointmentTitle: 'Titel',
  appointmentWhen: 'Beginn',
  appointmentWhere: 'Ort',
  appointmentNotes: 'Notiz',
  appointmentNotesHint: 'Keine Diagnosen, keine Verfahrensdetails.',
  markDone: 'Stattgefunden',
  markCancel: 'Absagen',

  // Closing an appointment is the one moment staff have actually spoken with
  // the person, so it is the only honest place to record how they are doing.
  // The scale used to sit on the client page permanently, with no interaction
  // attached to it.
  checkInLegend: 'Wie geht es der Person zurzeit?',
  checkInHint:
    'Optional — nur erfassen, wenn ihr im Termin darüber gesprochen habt. Keine Einschätzung ins Blaue.',
  checkInConcerns: 'Was beschäftigt sie?',
  checkInNotAsked: 'Nicht besprochen',
  completeSubmit: 'Termin abschliessen',
} as const
