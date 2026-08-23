/**
 * Housing-related labels: status, placements, end reasons, compatibility gaps
 */

export const HOUSING_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Verfügbar',
  FULL: 'Voll belegt',
  MAINTENANCE: 'In Wartung',
  CLOSED: 'Geschlossen',
}

/** Names the resident-chosen apartment name where staff see it. */
export const HOUSING_LABELS = {
  residentChosenName: 'Von den Bewohnenden benannt',
} as const

export const HOUSING_STAT_LABELS = {
  total: 'Unterkünfte',
  occupancy: 'Belegung',
} as const

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
  REQUEST: 'Klient*in hat selbst um Verlegung/Beendigung gebeten',
  CAPACITY: 'Platz wird für andere Klient*innen benötigt (Umstrukturierung)',
  UPGRADE: 'Wechsel zu einer besseren Unterkunft (z.B. grösseres Zimmer, Privatzimmer)',
  OTHER: 'Sonstige Gründe (bitte in Notizen erläutern)',
}

export const HOUSING_DANGER_ZONE_LABELS = {
  title: 'Danger Zone — Hard-Delete',
  description: 'Nur für Test-/Demo-Unterkünfte. Diese Aktion ist endgültig und entfernt den Datensatz.',
  notEligible: 'Dieser Unterkunfts-Code ist nicht als Test/Demo markiert. Hard-Delete ist gesperrt.',
  blockerReportTitle: 'Blocker-Report:',
  noDetails: 'Keine Details',
  copyReport: 'Report kopieren',
  copiedToClipboard: 'Blocker-Report in Zwischenablage kopiert',
  confirmPlaceholder: 'Bestätigung: DELETE',
  reasonPlaceholder: 'Grund (mind. 10 Zeichen)',
  deleteButton: 'Endgültig löschen',
  deleteFailed: 'Hard-Delete fehlgeschlagen',
  deleteSuccess: 'Unterkunft wurde endgültig gelöscht',
} as const

export const HOUSING_BLOCKER_LABELS: Record<string, string> = {
  placements: 'Platzierungen',
  incidents: 'Vorfälle',
  maintenanceRequests: 'Wartungsmeldungen',
  spots: 'Spots',
  tasks: 'Aufgaben',
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

export const HOUSING_DETAIL_LABELS = {
  spotsHeading: 'Zimmer & Plätze',
  manageSpots: 'Plätze verwalten',
  residentsHeading: 'Aktuelle Klient*innen',
  defineSpots: 'Plätze definieren',
  noActiveResidents: 'Keine aktiven Klient*innen',
  residentSince: 'Seit',
  avgCompatibility: 'Ø Kompatibilität',
  details: 'Details',
} as const

export const WHO_FITS_HERE_LABELS = {
  heading: 'Wer passt hierher?',
  spaceCountSingular: 'freier Platz',
  spaceCountPlural: 'freie Plätze',
  showAll: 'Alle anzeigen',
  emptyState: 'Keine passenden unplatzierten Klient*innen',
  addResident: 'Neue*n Klient*in erfassen',
  place: 'Platzieren',
} as const
