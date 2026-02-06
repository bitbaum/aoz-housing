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
  OTHER: 'Sonstiges',
}

export const INCIDENT_CATEGORY_LABELS: Record<string, string> = {
  INTERPERSONAL: 'Zwischenmenschlich',
  MAINTENANCE: 'Wartung',
  SAFETY: 'Sicherheit',
}

export const INCIDENT_CATEGORY_ICONS: Record<string, string> = {
  INTERPERSONAL: '💬',
  MAINTENANCE: '🔧',
  SAFETY: '⚠️',
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
}

// =============================================================================
// PORTAL LABELS (Resident-facing)
// =============================================================================

export const PORTAL_LABELS = {
  title: 'Mein Zuhause',
  nav: {
    overview: 'Übersicht',
    roommates: 'Mitbewohner',
    report: 'Melden',
    preferences: 'Einstellungen',
    help: 'Hilfe',
  },
  emergency: 'Bei Notfällen: 112 oder Hausverwaltung kontaktieren',
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
  email: 'E-Mail',
  emailPlaceholder: 'ihre.email@aoz.ch',
  password: 'Passwort',
  passwordPlaceholder: 'Passwort eingeben',
  submit: 'Anmelden',
  submitting: 'Anmelden...',
  error: {
    required: 'E-Mail und Passwort erforderlich',
    invalid: 'Ungültige E-Mail oder Passwort',
    rateLimit: 'Zu viele Anmeldeversuche',
    generic: 'Ein Fehler ist aufgetreten',
  },
  help: 'Bei Problemen wenden Sie sich an die IT-Abteilung.',
} as const
