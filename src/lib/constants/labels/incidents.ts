/**
 * Incident-related labels: types, categories, severity, follow-up
 */

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
  // Wellbeing
  LOW_SATISFACTION: 'Unzufriedenheit gemeldet',
  OTHER: 'Sonstiges',
}

export const INCIDENT_CATEGORY_LABELS: Record<string, string> = {
  INTERPERSONAL: 'Zwischenmenschlich',
  MAINTENANCE: 'Wartung',
  SAFETY: 'Sicherheit',
  WELLBEING: 'Wohlbefinden',
}

export const INCIDENT_CATEGORY_ICONS: Record<string, string> = {
  INTERPERSONAL: '💬',
  MAINTENANCE: '🔧',
  SAFETY: '⚠️',
  WELLBEING: '😟',
}

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
  WELLBEING: [
    'LOW_SATISFACTION',
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

export const INCIDENT_RESOLVED_LABELS = {
  open: 'Offen',
  resolved: 'Gelöst',
} as const

export const INCIDENT_TYPE_LABELS_SHORT: Record<string, string> = {
  NOISE_COMPLAINT: 'Lärm',
  CLEANLINESS_DISPUTE: 'Sauberkeit',
  PERSONAL_CONFLICT: 'Persönlicher Konflikt',
  CULTURAL_FRICTION: 'Kulturelle Spannungen',
  SPACE_DISPUTE: 'Platzmangel',
  SCHEDULE_CONFLICT: 'Zeitkonflikte',
  SAFETY_CONCERN: 'Sicherheit',
  OTHER: 'Sonstiges',
}

export const INCIDENT_PAGE_LABELS = {
  title: 'Vorfälle',
  export: 'Exportieren',
  newIncident: 'Neuer Vorfall',
  createIncident: 'Vorfall erfassen',
  criticalAlertSuffix: 'kritische Vorfälle erfordern sofortige Aufmerksamkeit',
  criticalAlertDesc: 'Diese Vorfälle haben höchste Priorität und sollten umgehend bearbeitet werden',
  noIncidents: 'Keine Vorfälle dokumentiert',
  noIncidentsCategory: (category: string) => `Keine ${category} Vorfälle`,
  overdue: 'Überfällig',
  reportedByTitle: 'Gemeldet von',
  subjectTitle: 'Betrifft',

  backToList: '← Zurück zur Übersicht',
  newSubtitle: 'Dokumentieren Sie einen neuen Vorfall',
  quickCapture: 'Schnellerfassung',
  quickSubtitle: 'Typische Vorfälle mit einem Klick vorbefüllen',
  resetPreset: 'Preset zurücksetzen',
  presets: {
    noiseLabel: '🔊 Lärmkonflikt',
    noiseDesc: 'Lärmbeschwerde: Zeitpunkt, beteiligte Personen und Sofortmassnahmen dokumentieren.',
    escalationLabel: '⚠️ Eskalation',
    escalationDesc: 'Eskalation/verbaler Konflikt: Verlauf, Deeskalation und Sicherheitslage festhalten.',
    safetyLabel: '🚨 Sicherheit',
    safetyDesc: 'Sicherheitsbedenken: Risiko, Betroffene, sofortige Schutzmassnahmen und nächste Schritte notieren.',
  },
  sectionLocation: 'Ort & Beteiligte',
  fieldUnit: 'Unterkunft *',
  fieldReporter: 'Gemeldet von',
  fieldReporterUnknown: 'Unbekannt / Extern',
  fieldReporterHint: 'Wer hat den Vorfall gemeldet?',
  fieldSubject: 'Betrifft',
  fieldSubjectUnknown: 'Keiner / Unbekannt',
  fieldSubjectHint: 'Wen betrifft der Vorfall?',
  sectionCategory: 'Kategorie & Art',
  fieldCategory: 'Kategorie *',
  maintenanceHint: 'Für Wartungsanfragen nutzen Sie bitte',
  maintenanceHintLink: 'Neue Wartungsanfrage',
  fieldType: 'Art des Vorfalls *',
  sectionSeverity: 'Schweregrad',
  sectionDetails: 'Details',
  fieldDate: 'Datum *',
  fieldDescription: 'Beschreibung *',
  fieldDescriptionPlaceholder: 'Beschreiben Sie den Vorfall...',
  submit: 'Vorfall erfassen',
} as const
