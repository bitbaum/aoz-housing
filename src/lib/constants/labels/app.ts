/**
 * App-level labels: branding, page titles, form/action labels, empty states
 */

export const APP_LABELS = {
  name: 'AOZ Wohnen',
  tagline: 'Platzierungssystem',
  fullTitle: 'AOZ Wohnen - Platzierungssystem',
  metaTitle: 'AOZ Wohnen - Intelligentes Platzierungssystem',
  metaDescription:
    'Konflikte reduzieren und Wohlbefinden verbessern durch kompatibilitätsbasierte Wohnplatzierung',
} as const

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
