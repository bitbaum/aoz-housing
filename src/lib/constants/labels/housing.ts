/**
 * Housing-related labels: status, placements, end reasons, compatibility gaps
 */

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
