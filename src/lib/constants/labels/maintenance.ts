/**
 * Maintenance request labels: categories, priorities, statuses
 */

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

export const MAINTENANCE_STAT_LABELS = {
  completedThisMonth: 'Diesen Monat erledigt',
} as const

export const MAINTENANCE_PAGE_LABELS = {
  title: 'Wartungsanfragen',
  newRequest: 'Neue Anfrage',
  urgentAlertSuffix: 'dringende Anfragen erfordern sofortige Aufmerksamkeit',
  urgentAlertSuffixSingular: 'dringende Anfrage erfordert sofortige Aufmerksamkeit',
  noRequests: 'Keine Wartungsanfragen gefunden',
  createRequest: 'Anfrage erstellen',
  assignPlaceholder: 'Zuweisen an...',
  assignBtn: 'Zuweisen',
  startBtn: 'Starten',
  completeBtn: 'Abschliessen',

  backToList: '← Zurück zur Liste',
  newTitle: 'Neue Wartungsanfrage',
  sectionLocation: 'Ort',
  fieldUnit: 'Unterkunft *',
  fieldSpot: 'Spezifischer Platz',
  fieldSpotDefault: 'Allgemein / Nicht zugeordnet',
  fieldLocationDetails: 'Standort-Details',
  fieldLocationPlaceholder: 'z.B. Badezimmer, Küche, Flur...',
  sectionRequest: 'Anfrage',
  fieldCategory: 'Kategorie *',
  fieldPriority: 'Priorität *',
  fieldTitle: 'Titel *',
  fieldTitlePlaceholder: 'Kurze Beschreibung des Problems',
  fieldDescription: 'Beschreibung *',
  fieldDescriptionPlaceholder: 'Detaillierte Beschreibung des Problems...',
  sectionReporter: 'Gemeldet von',
  fieldResident: 'Bewohner',
  fieldResidentDefault: 'Nicht zugeordnet',
  fieldReporterName: 'Oder Name eingeben',
  fieldReporterNamePlaceholder: 'z.B. Hauswart, Nachbar...',
  submit: 'Anfrage erstellen',
} as const
