/**
 * Single Source of Truth for all UI labels (German)
 *
 * IMPORTANT: Enum labels for resident/housing factors are DERIVED from config.
 * @see src/lib/config/resident-factors.ts (SSOT for factor definitions)
 *
 * This file provides:
 * - Derived labels from config (full versions)
 * - Short display variants (e.g., AGE_RANGE_LABELS for compact UI)
 * - Non-factor labels (incidents, maintenance, UI chrome)
 */

import { RESIDENT_FACTORS } from '@/lib/config/resident-factors'

// =============================================================================
// HELPER: Extract optionLabels from config factors
// =============================================================================

type FactorWithOptions = {
  optionLabels: Record<string, string>
}

function getLabelsFromFactor(factorId: keyof typeof RESIDENT_FACTORS): Record<string, string> {
  const factor = RESIDENT_FACTORS[factorId] as FactorWithOptions
  return factor?.optionLabels ?? {}
}

// =============================================================================
// APP LABELS (Branding & Metadata)
// =============================================================================

export const APP_LABELS = {
  name: 'AOZ Wohnen',
  tagline: 'Platzierungssystem',
  fullTitle: 'AOZ Wohnen - Platzierungssystem',
  metaTitle: 'AOZ Wohnen - Intelligentes Platzierungssystem',
  metaDescription:
    'Konflikte reduzieren und Wohlbefinden verbessern durch kompatibilitätsbasierte Wohnplatzierung',
} as const

// =============================================================================
// INCIDENT LABELS
// =============================================================================

export const INCIDENT_TYPE_LABELS: Record<string, string> = {
  // Interpersonal
  NOISE_COMPLAINT: 'Lärmbeschwerde',
  CLEANLINESS_DISPUTE: 'Sauberkeitskonflikt',
  PERSONAL_CONFLICT: 'Persönlicher Konflikt',
  CULTURAL_FRICTION: 'Kulturelle Differenzen',
  SPACE_DISPUTE: 'Platzkonflikt',
  SCHEDULE_CONFLICT: 'Zeitplankonflikt',
  SAFETY_CONCERN: 'Sicherheitsbedenken',
  // Maintenance
  PLUMBING: 'Sanitär',
  ELECTRICAL: 'Elektrik',
  HEATING_COOLING: 'Heizung/Klima',
  APPLIANCE: 'Gerät defekt',
  STRUCTURAL: 'Bauschaden',
  PEST_CONTROL: 'Schädlinge',
  SECURITY_SYSTEM: 'Sicherheitssystem',
  GENERAL_MAINTENANCE: 'Allgemeine Wartung',
  // Wellbeing
  LOW_SATISFACTION: 'Unzufriedenheit gemeldet',
  OTHER: 'Sonstiges',
}

export const INCIDENT_CATEGORY_LABELS: Record<string, string> = {
  INTERPERSONAL: 'Zwischenmenschlich',
  MAINTENANCE: 'Wartung',
  SAFETY: 'Sicherheit',
  WELLBEING: 'Wohlbefinden',
}

export const INCIDENT_CATEGORY_ICONS: Record<string, string> = {
  INTERPERSONAL: '💬',
  MAINTENANCE: '🔧',
  SAFETY: '⚠️',
  WELLBEING: '😟',
}

// Incident types by category (for form grouping)
export const INCIDENT_TYPES_BY_CATEGORY: Record<string, string[]> = {
  INTERPERSONAL: [
    'NOISE_COMPLAINT',
    'CLEANLINESS_DISPUTE',
    'PERSONAL_CONFLICT',
    'CULTURAL_FRICTION',
    'SPACE_DISPUTE',
    'SCHEDULE_CONFLICT',
    'SAFETY_CONCERN',
  ],
  MAINTENANCE: [
    'PLUMBING',
    'ELECTRICAL',
    'HEATING_COOLING',
    'APPLIANCE',
    'STRUCTURAL',
    'PEST_CONTROL',
    'SECURITY_SYSTEM',
    'GENERAL_MAINTENANCE',
  ],
  WELLBEING: [
    'LOW_SATISFACTION',
  ],
}

export const INCIDENT_SEVERITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  CRITICAL: 'Kritisch',
}

export const INVOLVEMENT_ROLE_LABELS: Record<string, string> = {
  INVOLVED: 'Beteiligt',
  WITNESS: 'Zeuge',
  MEDIATOR: 'Vermittler',
}

export const FOLLOW_UP_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig (innerhalb einer Woche)',
  NORMAL: 'Normal (2-3 Tage)',
  HIGH: 'Hoch (innerhalb 24 Std)',
  URGENT: 'Dringend (heute)',
}

export const FOLLOW_UP_PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
}

// =============================================================================
// RESIDENT LABELS (derived from config SSOT)
// =============================================================================

// Full labels derived from config
export const AGE_RANGE_LABELS_LONG: Record<string, string> = getLabelsFromFactor('ageRange')
export const GENDER_LABELS: Record<string, string> = getLabelsFromFactor('gender')
export const FAMILY_STATUS_LABELS: Record<string, string> = getLabelsFromFactor('familyStatus')
export const SLEEP_SCHEDULE_LABELS_LONG: Record<string, string> = getLabelsFromFactor('sleepSchedule')
export const SOCIAL_STYLE_LABELS_LONG: Record<string, string> = getLabelsFromFactor('socialStyle')
export const SMOKING_STATUS_LABELS: Record<string, string> = getLabelsFromFactor('smokingStatus')
export const MOBILITY_NEED_LABELS_LONG: Record<string, string> = getLabelsFromFactor('mobilityNeeds')

// Short display variants (for compact UI like tables, badges)
export const AGE_RANGE_LABELS: Record<string, string> = {
  YOUNG_ADULT: '18-25',
  ADULT: '26-40',
  MIDDLE_AGED: '41-55',
  SENIOR: '56+',
}

export const GENDER_LABELS_SHORT: Record<string, string> = {
  MALE: 'M',
  FEMALE: 'W',
  OTHER: 'A',
  PREFER_NOT_SAY: '-',
}

export const SLEEP_SCHEDULE_LABELS: Record<string, string> = {
  EARLY_BIRD: 'Frühaufsteher',
  STANDARD: 'Normal',
  NIGHT_OWL: 'Nachteule',
  IRREGULAR: 'Unregelmässig',
}

export const SOCIAL_STYLE_LABELS: Record<string, string> = {
  INTROVERTED: 'Ruhig',
  MODERATE: 'Ausgeglichen',
  EXTROVERTED: 'Gesellig',
}

export const MOBILITY_NEED_LABELS: Record<string, string> = {
  NONE: 'Keine',
  GROUND_FLOOR: 'Erdgeschoss',
  WHEELCHAIR: 'Rollstuhlgerecht',
}

// Non-factor resident labels
export const RESIDENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktiv',
  PLACED: 'Platziert',
  TRANSFERRED: 'Umgezogen',
  EXITED: 'Ausgetreten',
}

// =============================================================================
// HEALTH / SUPPORT LABELS (derived from config SSOT)
// =============================================================================

export const ROOM_SHARING_STATUS_LABELS: Record<string, string> = getLabelsFromFactor('roomSharingStatus')
export const SUPPORT_LEVEL_LABELS_LONG: Record<string, string> = getLabelsFromFactor('supportLevel')
export const RECYCLING_KNOWLEDGE_LABELS: Record<string, string> = getLabelsFromFactor('recyclingKnowledge')

// Short display variants
export const SUPPORT_LEVEL_LABELS: Record<string, string> = {
  STANDARD: 'Standard',
  ELEVATED: 'Erhöht',
  INTENSIVE: 'Intensiv',
}

export const CHECK_IN_TYPE_LABELS: Record<string, string> = {
  INITIAL: 'Erstgespräch',
  REGULAR: 'Regelmässig',
  AD_HOC: 'Zwischendurch',
  EXIT: 'Abschluss',
}

// =============================================================================
// HOUSING LABELS
// =============================================================================

export const HOUSING_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Verfügbar',
  FULL: 'Voll belegt',
  MAINTENANCE: 'In Wartung',
  CLOSED: 'Geschlossen',
}

// Re-export spot labels from config (SSOT)
export {
  SPOT_TYPE_LABELS,
  SPOT_TYPE_LABELS_SHORT,
  SPOT_TYPE_ICONS,
  SPOT_STATUS_LABELS,
  MEDICAL_DOC_TYPE_LABELS,
} from '@/lib/config/placement-spots'

export const PLACEMENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktiv',
  ENDED: 'Beendet',
  TRANSFERRED: 'Umgezogen',
}

export const END_REASON_LABELS: Record<string, string> = {
  NATURAL: 'Regulär',
  CONFLICT: 'Konflikt',
  REQUEST: 'Auf Wunsch',
  CAPACITY: 'Kapazität',
  UPGRADE: 'Verbesserung',
  OTHER: 'Sonstiges',
}

export const END_REASON_DESCRIPTIONS: Record<string, string> = {
  NATURAL: 'Planmässiges Ende der Unterbringung (z.B. Auszug, eigene Wohnung)',
  CONFLICT: 'Beendigung aufgrund von Konflikten mit Mitbewohnern oder Regelverstössen',
  REQUEST: 'Bewohner hat selbst um Verlegung/Beendigung gebeten',
  CAPACITY: 'Platz wird für andere Bewohner benötigt (Umstrukturierung)',
  UPGRADE: 'Wechsel zu einer besseren Unterkunft (z.B. grösseres Zimmer, Privatzimmer)',
  OTHER: 'Sonstige Gründe (bitte in Notizen erläutern)',
}

// Compatibility gaps - for conflict analysis when placements end due to CONFLICT
export const COMPATIBILITY_GAP_LABELS: Record<string, string> = {
  NOISE: 'Lärm / Geräusche',
  CLEANLINESS: 'Sauberkeit / Ordnung',
  SLEEP_SCHEDULE: 'Schlafrhythmus',
  SOCIAL_STYLE: 'Soziale Unterschiede',
  LANGUAGE: 'Sprachbarriere',
  SMOKING: 'Rauchen',
  PRIVACY: 'Privatsphäre',
  CHORES: 'Haushaltsaufgaben',
  OTHER: 'Sonstiges',
}

// =============================================================================
// MAINTENANCE REQUEST LABELS
// =============================================================================

export const MAINTENANCE_CATEGORY_LABELS: Record<string, string> = {
  PLUMBING: 'Sanitär',
  ELECTRICAL: 'Elektrik',
  HEATING_COOLING: 'Heizung/Klima',
  APPLIANCE: 'Geräte',
  STRUCTURAL: 'Baulich',
  PEST_CONTROL: 'Schädlinge',
  SECURITY: 'Sicherheit',
  CLEANING: 'Reinigung',
  EXTERIOR: 'Aussenbereich',
  OTHER: 'Sonstiges',
}

export const MAINTENANCE_CATEGORY_ICONS: Record<string, string> = {
  PLUMBING: '🚰',
  ELECTRICAL: '⚡',
  HEATING_COOLING: '🌡️',
  APPLIANCE: '🔌',
  STRUCTURAL: '🏗️',
  PEST_CONTROL: '🐛',
  SECURITY: '🔐',
  CLEANING: '🧹',
  EXTERIOR: '🌳',
  OTHER: '🔧',
}

export const MAINTENANCE_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  NORMAL: 'Normal',
  HIGH: 'Hoch',
  URGENT: 'Dringend',
}

export const MAINTENANCE_PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
}

export const MAINTENANCE_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  ASSIGNED: 'Zugewiesen',
  IN_PROGRESS: 'In Bearbeitung',
  ON_HOLD: 'Wartend',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Abgebrochen',
}

export const MAINTENANCE_STATUS_COLORS: Record<string, string> = {
  OPEN: 'badge-pending',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  ON_HOLD: 'bg-gray-100 text-gray-700',
  COMPLETED: 'badge-active',
  CANCELLED: 'bg-gray-200 text-gray-500',
}

// =============================================================================
// ROLE LABELS (Staff roles)
// =============================================================================

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  CASE_WORKER: 'Sachbearbeiter',
  VIEWER: 'Betrachter',
}

// =============================================================================
// INCIDENT TYPE LABELS - SHORT (for compact UI like dashboard tiles)
// =============================================================================

export const INCIDENT_TYPE_LABELS_SHORT: Record<string, string> = {
  NOISE_COMPLAINT: 'Lärm',
  CLEANLINESS_DISPUTE: 'Sauberkeit',
  PERSONAL_CONFLICT: 'Persönlicher Konflikt',
  CULTURAL_FRICTION: 'Kulturelle Spannungen',
  SPACE_DISPUTE: 'Platzmangel',
  SCHEDULE_CONFLICT: 'Zeitkonflikte',
  SAFETY_CONCERN: 'Sicherheit',
  OTHER: 'Sonstiges',
}

// =============================================================================
// SCORE TYPE LABELS (for score explanation UI)
// =============================================================================

export const SCORE_TYPE_LABELS: Record<string, string> = {
  compatibility: 'Kompatibilität',
  fit: 'Passgenauigkeit',
  harmony: 'Harmonie',
}

// =============================================================================
// SCORE LEVEL EXPLANATIONS (for score explanation popover)
// =============================================================================

export const SCORE_LEVEL_EXPLANATIONS: Record<string, { description: string; recommendation: string }> = {
  excellent: {
    description: 'Sehr hohe Übereinstimmung bei Lebensstil und Präferenzen.',
    recommendation: 'Ideale Platzierung empfohlen.',
  },
  good: {
    description: 'Gute Übereinstimmung mit wenigen Unterschieden.',
    recommendation: 'Gute Option für Platzierung.',
  },
  moderate: {
    description: 'Moderate Übereinstimmung mit einigen Abweichungen.',
    recommendation: 'Mit Vorsicht platzieren, regelmässige Check-ins.',
  },
  low: {
    description: 'Geringe Übereinstimmung, potenzielle Konflikte.',
    recommendation: 'Nur platzieren wenn keine Alternativen.',
  },
  critical: {
    description: 'Sehr geringe Übereinstimmung, hohe Konfliktgefahr.',
    recommendation: 'Nicht zusammen platzieren.',
  },
}

// =============================================================================
// COMPATIBILITY LABELS
// =============================================================================

export const HARMONY_STATUS_LABELS: Record<string, string> = {
  excellent: 'Harmonisch',
  good: 'Gut',
  moderate: 'Aufmerksam',
  concerning: 'Angespannt',
  critical: 'Kritisch',
}

export const COMPATIBILITY_SCORE_LABELS: Record<string, string> = {
  excellent: 'Sehr gut',
  good: 'Gut',
  moderate: 'Mittel',
  low: 'Niedrig',
  critical: 'Kritisch',
}

// Health indicator labels (for system health dashboard)
export const HEALTH_STATUS_LABELS: Record<string, string> = {
  excellent: 'Gut',
  good: 'OK',
  moderate: 'Aufmerksamkeit',
  critical: 'Kritisch',
}

// Trend indicator labels (for metric cards)
export const TREND_LABELS: Record<string, string> = {
  good: 'Positiv',
  warning: 'Warnung',
  neutral: 'Neutral',
}

// =============================================================================
// LANGUAGE & DIET LABELS
// =============================================================================

// LANGUAGE_LABELS derived from config (SSOT)
// Includes both uppercase (from config/form) and lowercase (legacy) for compatibility
export const LANGUAGE_LABELS: Record<string, string> = {
  // From config (SSOT) - uppercase keys
  ...getLabelsFromFactor('languages'),
  // Lowercase aliases for backward compatibility with legacy data
  de: 'Deutsch',
  en: 'Englisch',
  fr: 'Französisch',
  ar: 'Arabisch',
  fa: 'Farsi',
  tr: 'Türkisch',
  ti: 'Tigrinya',
  uk: 'Ukrainisch',
  ru: 'Russisch',
  ps: 'Paschtu',
  // Full language names for legacy seed data
  German: 'Deutsch',
  English: 'Englisch',
  French: 'Französisch',
  Arabic: 'Arabisch',
  Spanish: 'Spanisch',
  Turkish: 'Türkisch',
  Russian: 'Russisch',
  Ukrainian: 'Ukrainisch',
  Italian: 'Italienisch',
}

// DIET_LABELS derived from config (SSOT)
export const DIET_LABELS: Record<string, string> = {
  // From config (SSOT) - uppercase keys
  ...getLabelsFromFactor('dietaryNeeds'),
  // Lowercase aliases for backward compatibility
  halal: 'Halal',
  kosher: 'Koscher',
  vegetarian: 'Vegetarisch',
  vegan: 'Vegan',
  none: 'Keine besonderen',
}

// =============================================================================
// SATISFACTION LABELS
// =============================================================================

export const SATISFACTION_EMOJIS = ['😞', '😕', '😐', '🙂', '😊']

export const SATISFACTION_LABELS = [
  'Sehr unzufrieden',
  'Unzufrieden',
  'Neutral',
  'Zufrieden',
  'Sehr zufrieden',
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// =============================================================================
// PAGE TITLES
// =============================================================================

export const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  residents: 'Bewohner',
  housing: 'Unterkünfte',
  incidents: 'Vorfälle',
  matching: 'Matching',
  placements: 'Platzierungen',
  analytics: 'Auswertung',
  settings: 'Einstellungen',
}

// =============================================================================
// EMPTY STATE LABELS
// =============================================================================

export const EMPTY_STATE_LABELS = {
  noResidents: 'Keine Bewohner erfasst',
  noHousing: 'Keine Unterkünfte erfasst',
  noPlacements: 'Keine Platzierungen vorhanden',
  noIncidents: 'Keine Vorfälle dokumentiert',
  noMaintenance: 'Keine Wartungsanfragen',
  noCheckIns: 'Noch keine Check-ins erfasst',
  noMatches: 'Keine passenden Ergebnisse',
  noData: 'Keine Daten verfügbar',
  // Matching page
  noResidentsAtAll: 'Keine Bewohner vorhanden',
  allResidentsPlaced: 'Alle Bewohner sind platziert',
  noAvailableUnits: 'Keine verfügbaren Unterkünfte',
  createResident: 'Neuen Bewohner erfassen',
  createHousing: 'Neue Unterkunft erfassen',
  algorithmLink: 'Wie funktioniert der Algorithmus?',
}

// =============================================================================
// PORTAL LABELS (Resident-facing)
// =============================================================================

export const PORTAL_LABELS = {
  title: 'Mein Zuhause',
  nav: {
    overview: 'Übersicht',
    roommates: 'Mitbewohner',
    chores: 'Aufgaben',
    report: 'Melden',
    preferences: 'Einstellungen',
    help: 'Hilfe',
    logout: 'Abmelden',
  },
  emergency: 'Bei Notfällen: 112 oder Hausverwaltung kontaktieren',
  // Page titles
  pages: {
    dashboard: 'Willkommen',
    dashboardSubtitle: 'Hier findest du alles zu deiner Unterkunft',
    roommates: 'Deine Mitbewohner',
    report: 'Problem melden',
    reportSubtitle: 'Melde technische Probleme oder Konflikte',
    preferences: 'Deine Einstellungen',
    preferencesSubtitle: 'Diese Angaben helfen uns, passende Mitbewohner zu finden',
    help: 'Hilfe & FAQ',
    helpSubtitle: 'Antworten auf häufig gestellte Fragen und Kontaktinformationen',
  },
  // Common form labels
  form: {
    submit: 'Absenden',
    submitting: 'Wird gesendet...',
    saving: 'Wird gespeichert...',
    saved: 'Gespeichert',
    cancel: 'Abbrechen',
    back: '← Zurück zur Übersicht',
    errorGeneric: 'Ein Fehler ist aufgetreten. Bitte erneut versuchen.',
    successGeneric: 'Erfolgreich gespeichert',
  },
  // Login
  login: {
    title: 'Mein Zuhause',
    subtitle: 'Gib deinen Bewohnercode ein, um fortzufahren',
    placeholder: 'Dein Code (z.B. RES-001)',
    submit: 'Einloggen',
    hint: 'Deinen Code findest du auf deinem Willkommensbrief',
    errors: {
      code_required: 'Bitte Code eingeben',
      invalid_code: 'Code nicht gefunden',
      rate_limited: 'Zu viele Versuche. Bitte warte eine Minute.',
      account_not_found: 'Dein Konto wurde nicht gefunden. Bitte wende dich an deine Betreuungsperson.',
    },
  },
  // Report form
  report: {
    categoryMaintenance: 'Technisches Problem',
    categoryMaintenanceDesc: 'Defekte Geräte, Wasserschäden, Heizung etc.',
    categoryConflict: 'Konflikt melden',
    categoryConflictDesc: 'Probleme mit Mitbewohnern oder Nachbarn',
    titleMaintenance: '🔧 Technisches Problem melden',
    titleConflict: '💬 Konflikt melden',
    conflictSubtitle: 'Bei Problemen mit Mitbewohnern. Deine Meldung wird vertraulich behandelt.',
    typeLabel: 'Art des Problems',
    conflictTypeLabel: 'Art des Konflikts',
    selectPlaceholder: 'Bitte auswählen...',
    locationLabel: 'Wo ist das Problem?',
    involvedLabel: 'Betrifft (optional)',
    involvedPlaceholder: 'Möchte ich nicht sagen',
    involvedExternal: 'Jemand von ausserhalb',
    confidentialNote: 'Diese Information bleibt vertraulich',
    descriptionLabel: 'Beschreibung',
    conflictDescriptionLabel: 'Was ist passiert?',
    descriptionPlaceholder: 'Beschreibe das Problem möglichst genau...',
    conflictDescriptionPlaceholder: 'Beschreibe die Situation...',
    dateLabel: 'Wann ist es passiert?',
    severityLabel: 'Dringlichkeit',
    conflictSeverityLabel: 'Wie schwer wiegt es für dich?',
    mediationLabel: 'Ich wünsche ein Vermittlungsgespräch mit der Hausverwaltung',
    submitMaintenance: 'Problem melden',
    submitConflict: 'Konflikt melden',
    submitting: 'Wird gesendet...',
    successTitle: 'Meldung eingegangen',
    successMessage: 'Wir kümmern uns darum. Du wirst benachrichtigt, sobald es Neuigkeiten gibt.',
    errorGeneric: 'Meldung konnte nicht gesendet werden. Bitte erneut versuchen.',
    emergencyTitle: 'Bei Notfällen',
    emergencyMessage: 'Bei akuter Gefahr oder medizinischen Notfällen rufe sofort 112 an. Diese Meldung ist nicht für Notfälle gedacht.',
    noPlacement: 'Du hast noch keine Unterkunft zugewiesen bekommen.',
    noPlacementContact: 'Kontaktiere uns: 044 415 66 66 (Mo-Fr 8:00-17:00) oder wohnen@aoz.ch',
    maintenanceTypes: [
      { value: 'PLUMBING', label: 'Sanitär (WC, Dusche, Wasserhahn)' },
      { value: 'ELECTRICAL', label: 'Elektrik (Licht, Steckdosen)' },
      { value: 'HEATING_COOLING', label: 'Heizung / Klima' },
      { value: 'APPLIANCE', label: 'Gerät defekt (Kühlschrank, Herd etc.)' },
      { value: 'STRUCTURAL', label: 'Bauschaden (Fenster, Türen, Boden)' },
      { value: 'PEST_CONTROL', label: 'Schädlinge' },
      { value: 'SECURITY_SYSTEM', label: 'Sicherheit (Schloss, Tür)' },
      { value: 'GENERAL_MAINTENANCE', label: 'Sonstiges' },
    ],
    conflictTypes: [
      { value: 'NOISE_COMPLAINT', label: 'Lärm' },
      { value: 'CLEANLINESS_DISPUTE', label: 'Sauberkeit' },
      { value: 'SPACE_DISPUTE', label: 'Platz / Nutzung gemeinsamer Räume' },
      { value: 'SCHEDULE_CONFLICT', label: 'Zeitliche Konflikte (Bad, Küche)' },
      { value: 'PERSONAL_CONFLICT', label: 'Persönlicher Konflikt' },
      { value: 'CULTURAL_FRICTION', label: 'Kulturelle Missverständnisse' },
      { value: 'SAFETY_CONCERN', label: 'Sicherheitsbedenken' },
      { value: 'OTHER', label: 'Sonstiges' },
    ],
    locations: [
      { value: 'room', label: 'Mein Zimmer' },
      { value: 'bathroom', label: 'Badezimmer' },
      { value: 'kitchen', label: 'Küche' },
      { value: 'common', label: 'Gemeinschaftsraum' },
      { value: 'entrance', label: 'Eingang / Flur' },
      { value: 'other', label: 'Anderer Ort' },
    ],
    severityOptions: {
      MAINTENANCE: [
        { value: 'LOW', label: 'Kann warten', icon: '🟢' },
        { value: 'MEDIUM', label: 'Bald beheben', icon: '🟡' },
        { value: 'HIGH', label: 'Dringend', icon: '🟠' },
        { value: 'CRITICAL', label: 'Notfall', icon: '🔴' },
      ],
      INTERPERSONAL: [
        { value: 'LOW', label: 'Störend', desc: 'Aber ich komme zurecht' },
        { value: 'MEDIUM', label: 'Belastend', desc: 'Beeinträchtigt meinen Alltag' },
        { value: 'HIGH', label: 'Sehr belastend', desc: 'Brauche Unterstützung' },
        { value: 'CRITICAL', label: 'Unerträglich', desc: 'Dringende Hilfe nötig' },
      ],
    },
  },
  // Preferences form
  preferences: {
    saving: 'Wird gespeichert...',
    saveButton: 'Einstellungen speichern',
    successTitle: 'Einstellungen gespeichert',
    successMessage: 'Deine Präferenzen wurden aktualisiert.',
    errorGeneric: 'Einstellungen konnten nicht gespeichert werden. Bitte erneut versuchen.',
    privacyTitle: 'Datenschutz',
    privacyMessage: 'Deine Angaben werden nur verwendet, um passende Mitbewohner zu finden. Sie werden nicht an Dritte weitergegeben. Du kannst deine Daten jederzeit ändern oder löschen lassen.',
  },
  // Satisfaction
  satisfaction: {
    title: 'Wie geht es dir in deiner Unterkunft?',
    subtitle: 'Dein vertrauliches Feedback hilft uns, Probleme früh zu erkennen',
    privacyNote: 'Vertraulich gespeichert · Wird nicht mit deinem Namen verknüpft',
    thankYouTitle: 'Danke für dein Feedback!',
    thankYouMessage: 'Deine Rückmeldung hilft uns, die Unterkunft zu verbessern',
    concernsForwarded: 'Wir haben deine Anliegen weitergeleitet',
    newFeedback: 'Neues Feedback',
    lastFeedback: 'Letztes Feedback',
    today: 'Heute',
  },
  // Dashboard
  dashboard: {
    housing: 'Deine Unterkunft',
    noHousing: 'Du hast noch keine Unterkunft zugewiesen bekommen',
    noHousingHint: 'Bitte kontaktiere deinen Betreuer',
    noHousingContact: 'Allgemeine Anfragen: 044 415 66 66 (Mo-Fr 8:00-17:00) oder wohnen@aoz.ch',
    onboarding: {
      title: 'Dein Profil ist erstellt',
      subtitle: 'Wir suchen die passende Unterkunft für dich',
      steps: [
        { label: 'Profil erstellt', done: true },
        { label: 'Einstellungen vervollständigen', done: false },
        { label: 'Unterkunft wird gesucht', done: false },
        { label: 'Einzug', done: false },
      ],
      completePreferences: 'Einstellungen vervollständigen',
      completePreferencesHint: 'Je mehr wir über dich wissen, desto besser können wir passende Mitbewohner finden.',
    },
    houseRules: 'Hausregeln',
    quietHours: 'Ruhezeit',
    smokingAllowed: 'Rauchen erlaubt',
    noSmoking: 'Nichtraucher',
    petsAllowed: 'Haustiere erlaubt',
    noPets: 'Keine Haustiere',
    roommates: 'Mitbewohner',
    showAll: 'Alle anzeigen',
    myReports: 'Deine Meldungen',
    newReport: 'Neu melden',
    noReports: 'Keine Meldungen',
    openMaintenance: 'Offene Wartung im Gebäude',
    resolved: 'Erledigt',
    open: 'Offen',
    reported: 'Gemeldet',
    active: 'Aktiv',
    moveIn: 'Einzug',
    rooms: 'Zimmer',
    compatibility: 'Kompatibilität',
    quickActions: {
      report: { icon: '🔧', title: 'Problem melden', desc: 'Defekte oder Wartung melden' },
      roommates: { icon: '👥', title: 'Mitbewohner', desc: 'Infos zu deinen Mitbewohnern' },
      preferences: { icon: '⚙️', title: 'Einstellungen', desc: 'Deine Präferenzen anpassen' },
    },
  },
  // Landing page
  landing: {
    hero: 'Willkommen bei Mein Zuhause',
    heroSubtitle: 'Hier findest du alles rund um deine Unterkunft — Mitbewohner, Meldungen und Einstellungen an einem Ort.',
    features: [
      {
        icon: '🏠',
        title: 'Deine Unterkunft',
        desc: 'Alle Infos zu deinem Zuhause, deinen Mitbewohnern und den Hausregeln.',
      },
      {
        icon: '💬',
        title: 'Probleme melden',
        desc: 'Defekte, Konflikte oder Anliegen direkt und einfach an die Verwaltung melden.',
      },
      {
        icon: '⚙️',
        title: 'Deine Einstellungen',
        desc: 'Schlafzeiten, Sprachen, Vorlieben — damit wir passende Mitbewohner finden.',
      },
    ],
    loginTitle: 'Bereits registriert?',
    loginDesc: 'Melde dich mit deinem Bewohnercode an',
    registerTitle: 'Neu hier?',
    registerDesc: 'Erstelle in 30 Sekunden dein Profil',
    registerButton: 'Profil erstellen',
    registerSuccess: 'Profil erstellt! Dein Code ist:',
    registerAgeRange: 'Altersgruppe',
    registerGender: 'Geschlecht',
    registerFamilyStatus: 'Familienstatus',
    registerLanguages: 'Sprachen (optional)',
    registerCreating: 'Wird erstellt...',
    registerSelectPlaceholder: 'Bitte auswählen...',
    staffLink: 'Mitarbeitende? Zum Mitarbeiter-Login',
  },
  // Roommates page
  roommates: {
    noRoommates: 'Du hast derzeit keine Mitbewohner',
    aloneMessage: 'Du hast die Unterkunft für dich allein',
    tipsTitle: 'Tipps für das Zusammenleben',
    tips: [
      { icon: '🗣️', title: 'Kommunikation', desc: 'Sprich Probleme frühzeitig an, bevor sie grösser werden' },
      { icon: '🤝', title: 'Respekt', desc: 'Respektiere die Privatsphäre und Ruhezeiten deiner Mitbewohner' },
      { icon: '🧹', title: 'Sauberkeit', desc: 'Halte gemeinsame Räume sauber und räume nach dir auf' },
      { icon: '📅', title: 'Absprachen', desc: 'Trefft klare Vereinbarungen über Küche, Bad und Gemeinschaftsräume' },
    ],
    conflictTitle: 'Bei Konflikten',
    conflictSteps: [
      'Direktes Gespräch: Versuche zuerst, das Problem direkt mit deinem Mitbewohner zu besprechen.',
      'Vermittlung: Wenn das nicht klappt, kann die Hausverwaltung vermitteln.',
    ],
    conflictReport: 'Bei ernsthaften Problemen kannst du einen',
    conflictReportLink: 'Vorfall melden',
    strengths: 'Stärken',
    concerns: 'Achtung',
    compatible: 'kompatibel',
    noPlacement: 'Du hast noch keine Unterkunft zugewiesen bekommen.',
    noPlacementContact: 'Kontaktiere uns: 044 415 66 66 (Mo-Fr 8:00-17:00) oder wohnen@aoz.ch',
  },
} as const

// =============================================================================
// FORM LABELS
// =============================================================================

export const FORM_LABELS: Record<string, string> = {
  save: 'Speichern',
  cancel: 'Abbrechen',
  create: 'Anlegen',
  edit: 'Bearbeiten',
  delete: 'Löschen',
  search: 'Suchen',
  filter: 'Filtern',
  all: 'Alle',
  back: 'Zurück',
  next: 'Weiter',
  submit: 'Absenden',
  reset: 'Zurücksetzen',
  close: 'Schliessen',
  confirm: 'Bestätigen',
  add: 'Hinzufügen',
  remove: 'Entfernen',
  select: 'Auswählen',
  upload: 'Hochladen',
  download: 'Herunterladen',
  export: 'Exportieren',
  import: 'Importieren',
}

// =============================================================================
// ACTION LABELS
// =============================================================================

export const ACTION_LABELS: Record<string, string> = {
  newResident: 'Neuer Bewohner',
  newHousing: 'Neue Unterkunft',
  newIncident: 'Neuer Vorfall',
  newPlacement: 'Neue Platzierung',
  placeResident: 'Bewohner platzieren',
  resolveIncident: 'Vorfall lösen',
  endPlacement: 'Platzierung beenden',
  transferResident: 'Bewohner verlegen',
}

// =============================================================================
// EMPTY STATE LABELS
// =============================================================================

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getLabel(
  labels: Record<string, string>,
  key: string,
  fallback?: string
): string {
  return labels[key] || fallback || key
}

// =============================================================================
// LOGIN LABELS
// =============================================================================

export const LOGIN_LABELS = {
  title: 'Anmelden',
  subtitle: 'AOZ Wohnen - Platzierungssystem',
  tabs: {
    login: 'Anmelden',
    register: 'Registrieren',
  },
  email: 'E-Mail',
  emailPlaceholder: 'ihre.email@aoz.ch',
  password: 'Passwort',
  passwordPlaceholder: 'Passwort eingeben',
  submit: 'Anmelden',
  submitting: 'Anmelden...',
  register: {
    name: 'Name',
    namePlaceholder: 'Vor- und Nachname',
    email: 'E-Mail',
    emailPlaceholder: 'ihre.email@aoz.ch',
    password: 'Passwort',
    passwordPlaceholder: 'Mindestens 8 Zeichen',
    inviteCode: 'Einladungscode',
    inviteCodePlaceholder: 'Code eingeben',
    submit: 'Registrieren',
    submitting: 'Registrieren...',
    error: {
      generic: 'Registrierung fehlgeschlagen',
      emailExists: 'Diese E-Mail ist bereits registriert',
      invalidCode: 'Ungültiger Einladungscode',
    },
  },
  error: {
    required: 'E-Mail und Passwort erforderlich',
    invalid: 'Ungültige E-Mail oder Passwort',
    rateLimit: 'Zu viele Anmeldeversuche',
    generic: 'Ein Fehler ist aufgetreten',
  },
  help: 'Bei Problemen wenden Sie sich an die IT-Abteilung.',
  portalLink: 'Bewohner? Zum Bewohnerportal',
} as const
