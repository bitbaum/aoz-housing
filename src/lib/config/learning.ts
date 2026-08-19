/**
 * Learning records — SSOT for kinds, CEFR, categories, labels.
 *
 * A language test is a communication fact (same reason we store spoken
 * languages). A course or informal note is for Sozialarbeit and Jobcoach,
 * never a grade of the person. No diagnoses, no case details.
 */

import type { StaffRole } from '@/lib/auth/role-policy'
import { BRAND } from './brand'

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export type CefrLevel = (typeof CEFR_LEVELS)[number]

export const LEARNING_KINDS = [
  'LANGUAGE_TEST',
  'COURSE',
  'INFORMAL',
  'QUALIFICATION',
  'VOLUNTEERING',
  'COMMUNITY_SERVICE',
] as const
export type LearningKindId = (typeof LEARNING_KINDS)[number]

/** Completed records staff can award — certificates, courses, service hours. */
export const ACHIEVEMENT_KINDS = [
  'LANGUAGE_TEST',
  'COURSE',
  'QUALIFICATION',
  'VOLUNTEERING',
  'COMMUNITY_SERVICE',
] as const

export function isAchievementRecord(record: {
  status: string
  kind: string
}): boolean {
  return (
    record.status === 'COMPLETED' &&
    (ACHIEVEMENT_KINDS as readonly string[]).includes(record.kind)
  )
}

export function kindTracksHours(kind: string): boolean {
  return kind === 'VOLUNTEERING' || kind === 'COMMUNITY_SERVICE' || kind === 'COURSE'
}

export const LEARNING_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED'] as const
export type LearningStatusId = (typeof LEARNING_STATUSES)[number]

export const LEARNING_CATEGORIES = [
  'language',
  'integration',
  'vocational',
  'digital',
  'community',
  'other',
] as const
export type LearningCategoryId = (typeof LEARNING_CATEGORIES)[number]

export const LEARNING_BOARD_IDS = ['overview', 'job', 'volunteering'] as const
export type LearningBoardId = (typeof LEARNING_BOARD_IDS)[number]

export function boardKinds(board: LearningBoardId): readonly LearningKindId[] {
  switch (board) {
    case 'job':
      return ['LANGUAGE_TEST', 'COURSE', 'QUALIFICATION']
    case 'volunteering':
      return ['VOLUNTEERING', 'COMMUNITY_SERVICE']
    case 'overview':
    default:
      return LEARNING_KINDS
  }
}

export function defaultLearningBoardForRole(role: StaffRole): LearningBoardId {
  if (role === 'JOBCOACH') return 'job'
  if (role === 'FREIWILLIGENARBEIT') return 'volunteering'
  return 'overview'
}

export const LEARNING_KIND_LABELS: Record<LearningKindId, string> = {
  LANGUAGE_TEST: 'Sprachtest',
  COURSE: 'Kurs',
  INFORMAL: 'Informelles Lernen',
  QUALIFICATION: 'Abschluss / Nachweis',
  VOLUNTEERING: 'Freiwilligenarbeit',
  COMMUNITY_SERVICE: 'Gemeinnützige Arbeit',
}

export const LEARNING_STATUS_LABELS: Record<LearningStatusId, string> = {
  PLANNED: 'Geplant',
  IN_PROGRESS: 'Laufend',
  COMPLETED: 'Abgeschlossen',
  EXPIRED: 'Abgelaufen',
}

export const LEARNING_CATEGORY_LABELS: Record<LearningCategoryId, string> = {
  language: 'Sprache',
  integration: 'Integration',
  vocational: 'Beruf',
  digital: 'Digitales',
  community: 'Gemeinschaft',
  other: 'Anderes',
}

export const LEARNING_LANGUAGE_OPTIONS = [
  { code: 'DE', label: 'Deutsch' },
  { code: 'EN', label: 'Englisch' },
  { code: 'FR', label: 'Französisch' },
  { code: 'IT', label: 'Italienisch' },
  { code: 'AR', label: 'Arabisch' },
  { code: 'FA', label: 'Farsi / Dari' },
  { code: 'TR', label: 'Türkisch' },
  { code: 'TI', label: 'Tigrinya' },
  { code: 'UK', label: 'Ukrainisch' },
  { code: 'RU', label: 'Russisch' },
] as const

export const LEARNING_LABELS = {
  title: 'Lernen',
  subtitle: 'Kurse, Sprachtests und was jemand selbst gelernt hat — für Betreuung und Jobcoach.',
  boardTitle: 'Integrationsnachweise',
  boardSubtitle:
    'Was jemand macht, lernt und nachweisen kann — damit Jobcoach, Sozialarbeit und Freiwilligenarbeit schnell sehen, was zählt.',
  boardOverview: 'Alle Nachweise',
  boardJob: 'Beruf & Qualifikation',
  boardVolunteering: 'Freiwilligenarbeit',
  filterMine: 'Meine Klient*innen',
  filterAll: 'Alle',
  filterStatus: 'Stand',
  filterSource: 'Quelle',
  filterCategory: 'Bereich',
  filterSearch: 'Suche',
  filterSearchPlaceholder: 'Name, Code, Titel oder Anbieter…',
  sourceResident: 'Selbst eingetragen',
  sourceStaff: 'Von Fachperson erfasst',
  sourceAll: 'Alle Quellen',
  openResident: 'Zum Dossier',
  unitUnknown: 'Ohne aktuelle Unterkunft',
  noResults: 'Keine passenden Nachweise.',
  noMine: 'Für diese Filter sind noch keine eigenen Klient*innen zugeordnet.',
  filterReset: 'Filter zurücksetzen',
  evidenceTitle: 'Nachweis erfassen',
  evidenceSubtitle:
    'Dokumentiere, was du machst: Kurse, Sprachtests, Freiwilligenarbeit oder andere Schritte, die deine Integration zeigen.',
  evidenceQuickCourse: 'Kurs',
  evidenceQuickLanguage: 'Sprachtest',
  evidenceQuickVolunteering: 'Freiwilligenarbeit',
  evidenceQuickQualification: 'Abschluss',
  assignedToYou: 'Vom Team für dich erfasst',
  selfLogged: 'Von dir eingetragen',
  evidenceHelp:
    'Trag nur Dinge ein, die wirklich stattgefunden haben oder geplant sind. Das hilft dir und deinem Team beim nächsten Schritt.',
  saveError: 'Speichern fehlgeschlagen. Bitte Eingaben prüfen und erneut versuchen.',
  portalTitle: 'Dein Lernen',
  portalSubtitle: 'Sprachtests, Kurse, Weiterbildung. Du kannst selbst eintragen, was du machst.',
  add: 'Eintrag hinzufügen',
  empty: 'Noch keine Einträge.',
  kind: 'Art',
  titleField: 'Bezeichnung',
  titlePlaceholder: 'z.B. Deutschkurs A2, fide-Test, Velomechanik',
  status: 'Stand',
  language: 'Sprache',
  cefr: 'Niveau (GER)',
  provider: 'Anbieter',
  providerPlaceholder: `z.B. ${BRAND.orgName}, EB Zürich, fide`,
  category: 'Bereich',
  hours: 'Stunden',
  startedAt: 'Beginn',
  completedAt: 'Abschluss',
  notes: 'Notizen',
  notesHint: 'Keine Diagnosen, keine Verfahrensdetails — nur was für Wohnen oder Arbeit nützt.',
  save: 'Speichern',
  saving: 'Wird gespeichert...',
  recordedByResident: 'Selbst eingetragen',
  recordedByStaff: 'Von der Betreuung eingetragen',
  germanMissing: 'Kein Deutsch-Test erfasst',
  planned: 'Geplant',
  inProgress: 'Laufend',
  noGermanHint: 'Jobcoach: hier fehlt oft der nächste Deutschkurs.',
} as const
