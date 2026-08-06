/**
 * Household Task Configuration - SSOT
 *
 * All task types, categories, priorities, statuses, templates, and labels.
 * UI and validation derive from this config.
 */

// =============================================================================
// TASK TYPE
// =============================================================================

export const TASK_TYPE_LABELS: Record<string, string> = {
  ONE_TIME: 'Einmalig',
  RECURRING_SCHEDULED: 'Regelmässig',
  RECURRING_AS_NEEDED: 'Nach Bedarf',
}

export const TASK_TYPE_DESCRIPTIONS: Record<string, string> = {
  ONE_TIME: 'Einmal erledigen, dann fertig',
  RECURRING_SCHEDULED: 'Regelmässiger Zeitplan (z.B. wöchentlich)',
  RECURRING_AS_NEEDED: 'Erledigen wenn nötig (z.B. Abfall rausbringen)',
}

// =============================================================================
// TASK CATEGORY
// =============================================================================

export const TASK_CATEGORY_LABELS: Record<string, string> = {
  CLEANING: 'Reinigung',
  SHOPPING: 'Einkauf',
  MAINTENANCE: 'Unterhalt',
  COOKING: 'Kochen',
  TRASH: 'Abfall',
  OTHER: 'Sonstiges',
}

export const TASK_CATEGORY_ICONS: Record<string, string> = {
  CLEANING: '🧹',
  SHOPPING: '🛒',
  MAINTENANCE: '🔧',
  COOKING: '🍳',
  TRASH: '♻️',
  OTHER: '📋',
}

// =============================================================================
// TASK PRIORITY
// =============================================================================

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  NORMAL: 'Normal',
  HIGH: 'Hoch',
  URGENT: 'Dringend',
}

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-ui-subtle text-ui-muted',
  NORMAL: 'bg-status-info/15 text-status-info-text',
  HIGH: 'bg-status-warning/15 text-status-warning-text',
  URGENT: 'bg-status-error/15 text-status-error-text',
}

// =============================================================================
// TASK STATUS
// =============================================================================

export const TASK_STATUS_LABELS: Record<string, string> = {
  IDLE: 'Bereit',
  NEEDS_ATTENTION: 'Achtung',
  REQUESTED: 'Angefragt',
  IN_PROGRESS: 'In Arbeit',
}

export const TASK_STATUS_COLORS: Record<string, string> = {
  IDLE: 'bg-ui-subtle text-ui-muted',
  NEEDS_ATTENTION: 'bg-status-warning/15 text-status-warning-text',
  REQUESTED: 'bg-brand-primary/10 text-brand-primary',
  IN_PROGRESS: 'bg-status-info/15 text-status-info-text',
}

// =============================================================================
// REQUEST STATUS
// =============================================================================

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Offen',
  ACCEPTED: 'Angenommen',
  DECLINED: 'Abgelehnt',
  COMPLETED: 'Erledigt',
}

// =============================================================================
// TASK TEMPLATES (Pre-defined common chores)
// =============================================================================

export interface TaskTemplate {
  title: string
  category: string
  taskType: string
  instructions?: string
  estimatedMinutes?: number
  scheduleHuman?: string
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    title: 'Badezimmer putzen',
    category: 'CLEANING',
    taskType: 'RECURRING_SCHEDULED',
    instructions: 'WC, Lavabo und Dusche reinigen. Boden wischen.',
    estimatedMinutes: 30,
    scheduleHuman: 'Wöchentlich',
  },
  {
    title: 'Küche aufräumen',
    category: 'CLEANING',
    taskType: 'RECURRING_AS_NEEDED',
    instructions: 'Abwaschen, Herd und Arbeitsflächen reinigen.',
    estimatedMinutes: 20,
  },
  {
    title: 'Toilettenpapier kaufen',
    category: 'SHOPPING',
    taskType: 'RECURRING_AS_NEEDED',
    estimatedMinutes: 15,
  },
  {
    title: 'Abfall rausbringen',
    category: 'TRASH',
    taskType: 'RECURRING_AS_NEEDED',
    instructions: 'Abfall zum Container bringen. Recycling beachten.',
    estimatedMinutes: 10,
  },
  {
    title: 'Boden wischen',
    category: 'CLEANING',
    taskType: 'RECURRING_SCHEDULED',
    instructions: 'Alle gemeinsamen Räume (Küche, Flur, Bad).',
    estimatedMinutes: 25,
    scheduleHuman: 'Wöchentlich',
  },
  {
    title: 'Recycling sortieren',
    category: 'TRASH',
    taskType: 'RECURRING_AS_NEEDED',
    instructions: 'PET, Glas, Papier und Karton trennen und zum Sammelplatz bringen.',
    estimatedMinutes: 15,
  },
]

// =============================================================================
// COMPLAINT → INCIDENT CATEGORY MAPPING
// =============================================================================

import type { HouseholdTaskCategory, IncidentType } from '@prisma/client'

export const CHORE_COMPLAINT_INCIDENT_MAP: Record<HouseholdTaskCategory, IncidentType> = {
  CLEANING: 'CLEANLINESS_DISPUTE',
  SHOPPING: 'PERSONAL_CONFLICT',
  MAINTENANCE: 'GENERAL_MAINTENANCE',
  COOKING: 'SPACE_DISPUTE',
  TRASH: 'CLEANLINESS_DISPUTE',
  OTHER: 'PERSONAL_CONFLICT',
}

// =============================================================================
// PORTAL LABELS (all German text for chore feature)
// =============================================================================

export const CHORE_LABELS = {
  nav: 'Aufgaben',
  pages: {
    list: 'Haushaltsaufgaben',
    listSubtitle: 'Gemeinsame Aufgaben für eure Wohnung',
    create: 'Neue Aufgabe',
    createSubtitle: 'Erstelle eine Aufgabe für die Wohnung',
    detail: 'Aufgabe',
  },
  filter: {
    all: 'Alle',
  },
  card: {
    lastCompleted: 'Zuletzt erledigt',
    never: 'Noch nie',
    by: 'von',
    completed: 'Erledigt',
  },
  actions: {
    complete: 'Erledigt!',
    completing: 'Wird gespeichert...',
    request: 'Anfragen',
    attention: 'Aufmerksamkeit',
    complaint: 'Problem melden',
    create: 'Neue Aufgabe',
    useTemplate: 'Vorlage verwenden',
  },
  form: {
    title: 'Titel',
    titlePlaceholder: 'z.B. Küche aufräumen',
    description: 'Beschreibung (optional)',
    descriptionPlaceholder: 'Zusätzliche Details...',
    instructions: 'Anleitung (optional)',
    instructionsPlaceholder: 'Wie soll die Aufgabe erledigt werden...',
    category: 'Kategorie',
    taskType: 'Art',
    priority: 'Priorität',
    schedule: 'Zeitplan (optional)',
    schedulePlaceholder: 'z.B. Jeden Montag',
    estimatedMinutes: 'Geschätzte Dauer (Min.)',
    submit: 'Aufgabe erstellen',
    submitting: 'Wird erstellt...',
  },
  complete: {
    title: 'Aufgabe erledigt',
    notes: 'Notizen (optional)',
    notesPlaceholder: 'Was hast du gemacht?',
    duration: 'Dauer in Minuten (optional)',
  },
  request: {
    title: 'Hilfe anfragen',
    selectRoommate: 'Mitbewohner auswählen',
    broadcast: 'Alle fragen',
    broadcastDesc: 'Anfrage an alle Mitbewohner senden',
    message: 'Nachricht (optional)',
    messagePlaceholder: 'z.B. Könntest du das heute machen?',
    submit: 'Anfrage senden',
    submitting: 'Wird gesendet...',
  },
  attention: {
    title: 'Aufmerksamkeit nötig',
    message: 'Nachricht (optional)',
    messagePlaceholder: 'z.B. Das Bad ist schon wieder schmutzig...',
    submit: 'Markieren',
    submitting: 'Wird markiert...',
  },
  complaint: {
    title: 'Problem mit Aufgabe melden',
    description: 'Beschreibe das Problem',
    descriptionPlaceholder: 'z.B. Mitbewohner macht nie sauber...',
    submit: 'Problem melden',
    submitting: 'Wird gemeldet...',
    note: 'Deine Meldung wird an die Hausverwaltung weitergeleitet.',
  },
  fairness: {
    title: 'Beiträge',
    completions: 'Erledigungen',
  },
  detail: {
    description: 'Beschreibung',
    instructions: 'Anleitung',
    schedule: 'Zeitplan',
    estimatedMinutes: 'Geschätzte Dauer',
    minutes: 'Min.',
    history: 'Letzte Erledigungen',
    activeRequests: 'Offene Anfragen',
    attentionFlags: 'Aufmerksamkeits-Meldungen',
    noHistory: 'Noch keine Erledigungen',
    noRequests: 'Keine offenen Anfragen',
    noFlags: 'Keine Meldungen',
  },
  success: {
    created: 'Aufgabe erstellt!',
    completed: 'Aufgabe als erledigt markiert!',
    flagged: 'Aufmerksamkeit markiert!',
    requested: 'Anfrage gesendet!',
    complained: 'Problem wurde gemeldet.',
  },
  errors: {
    generic: 'Ein Fehler ist aufgetreten. Bitte erneut versuchen.',
    notFound: 'Aufgabe nicht gefunden.',
    noPlacement: 'Du hast noch keine Unterkunft zugewiesen bekommen.',
  },
  empty: {
    title: 'Noch keine Aufgaben',
    message: 'Erstelle die erste Aufgabe für eure Wohnung.',
  },
  sections: {
    urgentNow: 'Jetzt wichtig',
    urgentDesc: 'Diese Aufgaben brauchen zuerst eine Entscheidung.',
    after: 'Danach',
  },
  // Card-level action hints (previously in lib/constants/labels/ui.ts)
  openTaskHint: 'Empfohlen: Aufgabe öffnen und zuerst Entscheidung treffen.',
  openTaskAction: 'Aufgabe öffnen und Entscheidung treffen',
  markDoneDirectly: 'Direkt als erledigt markieren',
  done: 'Erledigt',
  // Admin chores page stats
  statTotal: 'Total Aufgaben',
  statActive: 'Aktive Aufgaben',
  statNeedsAttention: 'Braucht Aufmerksamkeit',
  statCompletions: 'Erledigungen',
  admin: {
    pageTitle: 'Haushaltsaufgaben',
    perUnitTitle: 'Aufgaben pro Unterkunft',
    noUnits: 'Keine Unterkünfte mit Aufgaben gefunden',
    attention: 'Achtung',
    colUnit: 'Unterkunft',
    colAddress: 'Adresse',
    colResidents: 'Bewohner',
    colTasks: 'Aufgaben',
    colActive: 'Aktiv',
  },
} as const
