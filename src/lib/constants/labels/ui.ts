/**
 * Shared UI labels: reusable strings across multiple components.
 * Covers common actions, statuses, and navigation text.
 */

export const UI_LABELS = {
  // Common actions
  cancel: 'Abbrechen',
  confirm: 'Bestätigen',
  save: 'Speichern',
  delete: 'Löschen',
  close: 'Schliessen',
  clickForDetails: 'Klicken für Details',
  sendMessage: 'Nachricht senden',
  actions: 'Aktionen',
  required: 'erforderlich',
  processing: 'Wird verarbeitet...',
  // Statuses
  open: 'Offen',
  resolved: 'Gelöst',
  blocked: 'Blockiert',
  active: 'Aktiv',
  // Common filter tab labels
  all: 'Alle',
  ended: 'Beendet',
  archived: 'Archiviert',
  // Navigation
  menuOpen: 'Menü öffnen',
  menuClose: 'Menü schliessen',
  navigation: 'Navigation',
  userMenu: 'Benutzermenü',
  switchToPortal: 'Zum Portal wechseln',
  switchToAdmin: 'Zur Verwaltung',
  logout: 'Abmelden',
  loggingOut: 'Abmelden...',
  // Form common
  selectPlaceholder: 'Bitte wählen',
  // Incidents common
  solution: 'Lösung:',
} as const

export const FOLLOW_UP_FORM_LABELS = {
  title: 'Neues Follow-up hinzufügen',
  quickTemplates: 'Schnellvorlagen',
  quickTemplatesHint: 'Typische Follow-up-Einträge mit einem Klick vorbefüllen',
  resetTemplate: 'Vorlage zurücksetzen',
  templates: {
    deescalation: {
      title: 'Deeskalationsgespräch durchgeführt',
      action: 'Gespräch mit Beteiligten geführt, Auslöser und Regeln geklärt.',
      outcome: 'Situation aktuell stabil. Weitere Beobachtung vereinbart.',
      label: 'Deeskalation',
    },
    safety: {
      title: 'Sicherheitsprüfung durchgeführt',
      action: 'Risiken vor Ort geprüft und Sofortmassnahmen dokumentiert.',
      outcome: 'Akute Gefahr aktuell nicht festgestellt. Follow-up eingeplant.',
      label: 'Sicherheitscheck',
    },
    houseRules: {
      title: 'Hausregel-Hinweis und Dokumentation',
      action: 'Hausregeln und Konsequenzen erneut erklärt, Verständnis bestätigt.',
      outcome: 'Mündliche Vereinbarung getroffen, nächster Kontrolltermin definiert.',
      label: 'Hausregeln',
    },
  },
  actionLabel: 'Aktion/Massnahme *',
  actionPlaceholder: 'z.B. Gespräch mit Bewohner geführt',
  notesLabel: 'Notizen',
  notesPlaceholder: 'Details zur Massnahme...',
  outcomeLabel: 'Ergebnis',
  outcomePlaceholder: 'Was kam dabei heraus?',
  staffLabel: 'Mitarbeiter',
  staffNamePlaceholder: 'Name',
  nextFollowUpLabel: 'Nächste Follow-up',
  priorityLabel: 'Priorität',
  priorityNone: 'Keine',
  submit: 'Follow-up hinzufügen',
} as const

export const INCIDENT_SIDEBAR_LABELS = {
  location: 'Ort',
  involved: 'Beteiligte',
  reportedBy: 'Gemeldet von',
  subject: 'Betrifft',
  otherInvolved: 'Weitere Beteiligte',
  noResidentsAssigned: 'Keine Bewohner zugeordnet',
  actions: 'Aktionen',
  resolution: 'Lösung',
  resolutionPlaceholder: 'Wie wurde der Vorfall gelöst?',
  markResolved: 'Als gelöst markieren',
  details: 'Details',
  created: 'Erstellt',
  incidentDate: 'Vorfallsdatum',
  followUps: 'Follow-ups',
  resolvedAt: 'Gelöst am',
} as const

export const DANGER_ZONE_LABELS = {
  title: 'Danger Zone — Hard-Delete',
  description: 'Nur für Test-/Demo-Bewohner. Diese Aktion ist endgültig und entfernt den Datensatz.',
  notTestResident: 'Dieser Bewohner-Code ist nicht als Test/Demo markiert. Hard-Delete ist gesperrt.',
  blockerReport: 'Blocker-Report:',
  noDetails: 'Keine Details',
  copiedToClipboard: 'Blocker-Report in Zwischenablage kopiert',
  copyReport: 'Report kopieren',
  confirmLabel: 'Bestätigung: DELETE',
  reasonLabel: 'Grund (mind. 10 Zeichen)',
  deleteFailed: 'Hard-Delete fehlgeschlagen',
  deleteSuccess: 'Bewohner wurde endgültig gelöscht',
  deleteButton: 'Endgültig löschen',
  blockers: {
    placements: 'Platzierungen',
    incidentsReported: 'Vorfälle gemeldet',
    incidentsSubject: 'Vorfälle als betroffene Person',
    incidentInvolvements: 'Vorfallsbeteiligungen',
    maintenanceReports: 'Wartungsmeldungen',
    compatibilityAssessments: 'Kompatibilitäts-Assessments',
  },
} as const

export const PLACEMENT_HISTORY_LABELS = {
  title: 'Platzierungshistorie',
  today: 'heute',
  transferred: 'Verlegt',
} as const

export const UNIT_INCIDENT_LABELS = {
  title: 'Vorfälle & Meldungen',
  newIncident: 'Neuer Vorfall',
  frequentResidents: 'Häufig betroffene Bewohner',
  tabs: {
    all: 'Alle',
    conflicts: 'Konflikte',
    maintenance: 'Wartung',
  },
  noIncidents: 'Keine Vorfälle dokumentiert',
} as const

export const SATISFACTION_SURVEY_LABELS = {
  saveFailed: 'Speichern fehlgeschlagen. Bitte erneut versuchen.',
  groupLabel: 'Zufriedenheit',
  day: 'Tag',
  days: 'Tagen',
  ratings: {
    bad: 'Schlecht',
    okay: 'Okay',
    great: 'Super',
  },
  commentPrompt: 'Möchtest du uns mehr erzählen?',
  optional: '(optional)',
  commentPlaceholder: 'Was können wir verbessern? Was beschäftigt dich?',
  submitting: 'Wird gesendet...',
  submit: 'Absenden',
  submitWithoutComment: 'Ohne Kommentar absenden',
  submitFeedback: 'Feedback absenden',
} as const

export const CHORE_LABELS = {
  openTaskHint: 'Empfohlen: Aufgabe öffnen und zuerst Entscheidung treffen.',
  openTaskAction: 'Aufgabe öffnen und Entscheidung treffen',
  markDoneDirectly: 'Direkt als erledigt markieren',
  done: 'Erledigt',
} as const

export const PROBLEM_DETECTION_LABELS = {
  noProblems: 'Keine Probleme erkannt',
  noProblemsDesc: 'Alle Bewohner passen gut zusammen. Harmonie in der Wohnung.',
  problemsDetected: 'Probleme erkannt',
  adaptationIssues: 'mit Anpassungsproblemen',
  lowerCleanliness: 'niedrigere',
  higherCleanliness: 'höhere',
  higherNoiseTolerance: 'höhere',
  lowerNoiseTolerance: 'niedrigere',
  higherPrivacy: 'höheres',
  lowerPrivacy: 'niedrigeres',
  onlyNightOwl: 'Einzige Nachteule unter Frühaufstehern/Normalen',
  onlyEarlyBird: 'Einziger Frühaufsteher unter Nachteulen/Normalen',
  onlyExtrovert: 'Einziger Extrovertierter unter Introvertierten/Moderaten',
  onlyIntrovert: 'Einziger Introvertierter unter Extrovertierten/Moderaten',
  smokerInNonSmoking: 'Raucher in einer Nichtraucher-Wohnung',
  avgCompatibilityOnly: 'Durchschnittliche Kompatibilität nur',
  tip: 'Tipp:',
  tipMessage: 'Bewohner mit Anpassungsproblemen könnten in einer anderen Wohnung besser passen. Nutzen Sie "Umplatzieren", um passende Alternativen zu finden.',
  relocate: 'Umplatzieren',
} as const
