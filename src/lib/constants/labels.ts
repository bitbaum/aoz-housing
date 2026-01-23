/**
 * Single Source of Truth for all UI labels (German)
 *
 * IMPORTANT: All user-facing text should be defined here.
 * This enables future i18n and ensures consistency.
 */

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

export const INCIDENT_SEVERITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  CRITICAL: 'Kritisch',
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
