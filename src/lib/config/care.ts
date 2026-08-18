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
  workspaceSubtitle:
    'Wohnen, Sozialarbeit, Jobcoach und Freiwilligenarbeit — dieselben vier Sitze, Termine und was für die Arbeit nützt.',
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
  appointmentAdd: 'Termin setzen',
  appointmentTitle: 'Titel',
  appointmentWhen: 'Beginn',
  appointmentWhere: 'Ort',
  appointmentNotes: 'Notiz',
  appointmentNotesHint: 'Keine Diagnosen, keine Verfahrensdetails.',
  markDone: 'Stattgefunden',
  markCancel: 'Absagen',
} as const
