/**
 * Resident-related labels: factor labels, status, health/support, languages, diet, satisfaction
 */

import { getLabelsFromFactor } from './helpers'

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

export const RESIDENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktiv',
  PLACED: 'Platziert',
  TRANSFERRED: 'Umgezogen',
  EXITED: 'Archiviert',
}

// Health / Support labels (derived from config SSOT)
export const ROOM_SHARING_STATUS_LABELS: Record<string, string> = getLabelsFromFactor('roomSharingStatus')
export const SUPPORT_LEVEL_LABELS_LONG: Record<string, string> = getLabelsFromFactor('supportLevel')
export const RECYCLING_KNOWLEDGE_LABELS: Record<string, string> = getLabelsFromFactor('recyclingKnowledge')

export const SUPPORT_LEVEL_LABELS: Record<string, string> = {
  STANDARD: 'Standard',
  ELEVATED: 'Erhöht',
  INTENSIVE: 'Intensiv',
}

export const TRANSFER_REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Offen',
  APPROVED: 'Genehmigt',
  DENIED: 'Abgelehnt',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Storniert',
}

export const CHECK_IN_TYPE_LABELS: Record<string, string> = {
  INITIAL: 'Erstgespräch',
  REGULAR: 'Regelmässig',
  AD_HOC: 'Zwischendurch',
  EXIT: 'Abschluss',
}

// Language labels (includes uppercase from config and lowercase aliases for legacy data)
export const LANGUAGE_LABELS: Record<string, string> = {
  ...getLabelsFromFactor('languages'),
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

// Diet labels (includes uppercase from config and lowercase aliases)
export const DIET_LABELS: Record<string, string> = {
  ...getLabelsFromFactor('dietaryNeeds'),
  halal: 'Halal',
  kosher: 'Koscher',
  vegetarian: 'Vegetarisch',
  vegan: 'Vegan',
  none: 'Keine besonderen',
}

// Satisfaction
export const SATISFACTION_EMOJIS = ['😞', '😕', '😐', '🙂', '😊']

export const SATISFACTION_LABELS = [
  'Sehr unzufrieden',
  'Unzufrieden',
  'Neutral',
  'Zufrieden',
  'Sehr zufrieden',
]
