/**
 * App-level labels: branding, page titles, form/action labels, empty states
 */
import { BRAND } from '@/lib/config/brand'

export const APP_LABELS = {
  name: `${BRAND.shortName} Wohnen`,
  tagline: 'Platzierungssystem',
  fullTitle: `${BRAND.shortName} Wohnen - Platzierungssystem`,
  metaTitle: `${BRAND.shortName} Wohnen - Intelligentes Platzierungssystem`,
  metaDescription:
    'Konflikte reduzieren und Wohlbefinden verbessern durch kompatibilitätsbasierte Wohnplatzierung',
  // Layout navigation section headers and utility links
  navSection: 'Navigation',
  systemSection: 'System',
  algorithm: 'Algorithmus',
  statistics: 'Statistiken',
  help: 'Hilfe',
} as const

/**
 * Page titles / page-level action labels.
 *
 * Deliberately NOT typed as `Record<string, string>`: that type makes every
 * key lookup type-check, so a typo or a missing entry silently renders
 * `undefined` (an empty button/link with no accessible name). `as const`
 * makes the compiler reject unknown keys instead.
 */
export const PAGE_TITLES = {
  dashboard: 'Dashboard',
  residents: 'Bewohner',
  housing: 'Unterkünfte',
  newHousing: 'Neue Unterkunft',
  incidents: 'Vorfälle',
  matching: 'Matching',
  placements: 'Platzierungen',
  analytics: 'Auswertung',
  settings: 'Einstellungen',
  chores: 'Haushaltsaufgaben',
  transferRequests: 'Verlegungsanfragen',
} as const

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
  noHousingArchived: 'Keine archivierten Unterkünfte',
  createResident: 'Neuen Bewohner erfassen',
  createHousing: 'Neue Unterkunft erfassen',
  createHousingFirst: 'Erste Unterkunft erstellen',
  algorithmLink: 'Wie funktioniert der Algorithmus?',
}

export const FORM_LABELS: Record<string, string> = {
  save: 'Speichern',
  cancel: 'Abbrechen',
  create: 'Erstellen',
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
