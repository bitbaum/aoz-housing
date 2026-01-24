/**
 * Single Source of Truth for all UI labels (German)
 *
 * IMPORTANT: All user-facing text should be defined here.
 * This enables future i18n and ensures consistency.
 */

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
// RESIDENT LABELS
// =============================================================================

export const AGE_RANGE_LABELS: Record<string, string> = {
  YOUNG_ADULT: '18-25',
  ADULT: '26-40',
  MIDDLE_AGED: '41-55',
  SENIOR: '56+',
}

export const AGE_RANGE_LABELS_LONG: Record<string, string> = {
  YOUNG_ADULT: '18-25 Jahre',
  ADULT: '26-40 Jahre',
  MIDDLE_AGED: '41-55 Jahre',
  SENIOR: '56+ Jahre',
}

export const GENDER_LABELS: Record<string, string> = {
  MALE: 'Männlich',
  FEMALE: 'Weiblich',
  OTHER: 'Andere',
  PREFER_NOT_SAY: 'Keine Angabe',
}

export const GENDER_LABELS_SHORT: Record<string, string> = {
  MALE: 'M',
  FEMALE: 'W',
  OTHER: 'A',
  PREFER_NOT_SAY: '-',
}

export const FAMILY_STATUS_LABELS: Record<string, string> = {
  SINGLE: 'Alleinstehend',
  COUPLE: 'Paar',
  FAMILY_WITH_CHILDREN: 'Familie mit Kindern',
  SINGLE_PARENT: 'Alleinerziehend',
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

export const SMOKING_STATUS_LABELS: Record<string, string> = {
  NON_SMOKER: 'Nichtraucher',
  OUTDOOR_SMOKER: 'Raucher (draussen)',
  INDOOR_SMOKER: 'Raucher',
}

export const MOBILITY_NEED_LABELS: Record<string, string> = {
  NONE: 'Keine',
  GROUND_FLOOR: 'Erdgeschoss',
  WHEELCHAIR: 'Rollstuhlgerecht',
}

export const RESIDENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktiv',
  PLACED: 'Platziert',
  TRANSFERRED: 'Umgezogen',
  EXITED: 'Ausgetreten',
}

// =============================================================================
// HEALTH / SUPPORT LABELS
// =============================================================================

export const ROOM_SHARING_STATUS_LABELS: Record<string, string> = {
  CAN_SHARE: 'Kann Zimmer teilen',
  PREFERS_PRIVATE: 'Bevorzugt Einzelzimmer',
  NEEDS_PRIVATE: 'Benötigt Einzelzimmer',
}

export const SUPPORT_LEVEL_LABELS: Record<string, string> = {
  STANDARD: 'Standard',
  ELEVATED: 'Erhöht',
  INTENSIVE: 'Intensiv',
}

export const RECYCLING_KNOWLEDGE_LABELS: Record<string, string> = {
  NONE: 'Keine Kenntnisse',
  BASIC: 'Grundkenntnisse',
  GOOD: 'Gute Kenntnisse',
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
// LANGUAGE LABELS
// =============================================================================

export const LANGUAGE_LABELS: Record<string, string> = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
  ar: 'العربية',
  tr: 'Türkçe',
  uk: 'Українська',
  ru: 'Русский',
  fa: 'فارسی',
  ti: 'ትግርኛ',
  es: 'Español',
  pt: 'Português',
  so: 'Soomaali',
  ps: 'پښتو',
}

export const DIET_LABELS: Record<string, string> = {
  halal: 'Halal',
  kosher: 'Koscher',
  vegetarian: 'Vegetarisch',
  vegan: 'Vegan',
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

export const EMPTY_STATE_LABELS: Record<string, string> = {
  noResidents: 'Keine Bewohner erfasst',
  noHousing: 'Keine Unterkünfte erfasst',
  noIncidents: 'Keine Vorfälle dokumentiert',
  noPlacements: 'Keine Platzierungen vorhanden',
  noMatches: 'Keine passenden Ergebnisse',
  noData: 'Keine Daten verfügbar',
}

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
