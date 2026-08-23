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
  LOW: 'bg-ui-subtle text-ui-muted',
  NORMAL: 'bg-status-info/15 text-status-info-text',
  HIGH: 'bg-status-warning/15 text-status-warning-text',
  URGENT: 'bg-status-error/15 text-status-error-text',
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
  ASSIGNED: 'bg-status-info/15 text-status-info-text',
  IN_PROGRESS: 'bg-status-warning/15 text-status-warning-text',
  ON_HOLD: 'bg-ui-subtle text-ui-muted',
  COMPLETED: 'badge-active',
  CANCELLED: 'bg-ui-border text-ui-muted',
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
  descriptionTitle: 'Beschreibung',
  updateStatusTitle: 'Status aktualisieren',
  fieldNewStatus: 'Neuer Status',
  fieldAssignedTo: 'Zugewiesen an',
  fieldAssignedPlaceholder: 'Name des Mitarbeiters',
  fieldResolution: 'Lösung / Erledigte Arbeiten',
  fieldResolutionPlaceholder: 'Beschreibung der durchgeführten Arbeiten...',
  fieldCost: 'Kosten (CHF)',
  fieldNotes: 'Notizen',
  fieldNotesPlaceholder: 'Interne Notizen...',
  updateStatusBtn: 'Status aktualisieren',
  resolutionTitle: 'Lösung',
  costPrefix: 'Kosten: CHF ',
  locationTitle: 'Ort',
  spotLabel: 'Platz',
  locationLabel: 'Standort',
  reporterTitle: 'Gemeldet von',
  notAngegeben: 'Nicht angegeben',
  assignedTitle: 'Zugewiesen an',
  assignedSince: (date: string) => `Seit ${date}`,
  timelineTitle: 'Zeitlinie',
  timelineCreated: 'Erstellt',
  timelineAssigned: 'Zugewiesen',
  timelineStarted: 'Gestartet',
  timelineCompleted: 'Abgeschlossen',
  notesTitle: 'Notizen',
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
  fieldResident: 'Klient*in',
  fieldResidentDefault: 'Nicht zugeordnet',
  fieldReporterName: 'Oder Name eingeben',
  fieldReporterNamePlaceholder: 'z.B. Hauswart, Nachbar...',
  submit: 'Anfrage erstellen',
} as const
