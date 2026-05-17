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
  submitting: 'Wird gesendet...',
  // Common stat labels
  total: 'Gesamt',
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
  warning: 'Warnung',
  details: 'Details',
  // AI chat
  aiChatPlaceholder: 'Frage stellen… (Enter zum Senden, Shift+Enter für Zeilenumbruch)',
  aiChatSend: 'Senden',
  // Error boundaries — shared UI text
  errorTitle: 'Etwas ist schiefgelaufen',
  errorRetry: 'Erneut versuchen',
  errorToDashboard: 'Zum Dashboard',
  // Error boundaries — page-specific descriptions
  errorGenericDesc: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
  errorHousingDesc: 'Beim Laden der Unterkunftsdaten ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
  errorResidentsDesc: 'Beim Laden der Bewohnerdaten ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
  errorIncidentsDesc: 'Beim Laden der Vorfälle ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
  errorMaintenanceDesc: 'Beim Laden der Wartungsanfragen ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
  errorAnalyticsDesc: 'Beim Laden der Analysedaten ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
  errorMatchingDesc: 'Beim Laden des Matchings ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
  errorAlgorithmDesc: 'Beim Laden der Algorithmus-Dokumentation ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
  errorChoresDesc: 'Beim Laden der Haushaltsaufgaben ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
  errorTransferRequestsDesc: 'Beim Laden der Verlegungsanfragen ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
  errorPlacementsDesc: 'Beim Laden der Platzierungen ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
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
  mediationTime: 'Mediationszeit',
  mediationTimeEdit: 'Mediationszeit erfassen',
  mediationTimeSave: 'Speichern',
  mediationTimePlaceholder: '0',
  mediationTimeUnit: 'Minuten',
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
  // Stat card labels (admin chores page)
  statTotal: 'Total Aufgaben',
  statActive: 'Aktive Aufgaben',
  statNeedsAttention: 'Braucht Aufmerksamkeit',
  statCompletions: 'Erledigungen',
  admin: {
    pageTitle: 'Haushaltsaufgaben',
    perUnitTitle: 'Aufgaben pro Unterkunft',
    noUnits: 'Keine Unterkünfte mit Aufgaben gefunden',
    attention: 'Achtung',
    colUnit: 'Unterkunft',
    colAddress: 'Adresse',
    colResidents: 'Bewohner',
    colTasks: 'Aufgaben',
    colActive: 'Aktiv',
  },
} as const

export const TRANSFER_ACTION_LABELS = {
  notesPlaceholder: 'Notiz (optional)',
  approve: 'Genehmigen',
  deny: 'Ablehnen',
  processing: 'Wird bearbeitet...',
  success: 'Erfolgreich bearbeitet',
  emptyPending: 'Keine offenen Verlegungsanfragen',
  emptyOther: 'Keine Verlegungsanfragen in dieser Kategorie',
  noteLabel: 'Notiz:',
  fromUnit: 'Von:',
  toUnit: 'Nach:',
} as const

export const PLACEMENT_LIST_LABELS = {
  title: 'Platzierungen',
  export: 'Exportieren',
  newPlacement: 'Neue Platzierung',
  searchPlaceholder: 'Suchen: Bewohner, Unterkunft, Adresse',
  filterOverdue: 'Nur überfällige Check-ins',
  filterConflicts: 'Nur konfliktbedingt beendet',
  filterApply: 'Filter anwenden',
  filterReset: 'Filter zurücksetzen',
  emptyActive: 'Keine aktiven Platzierungen',
  emptyEnded: 'Keine beendeten Platzierungen',
  emptyAll: 'Keine Platzierungen vorhanden',
  createPlacement: 'Neue Platzierung erstellen',
  since: 'Seit',
  duration: 'Aufenthalt',
  day: 'Tag',
  days: 'Tage',
  checkInOverdue: 'Überfällig!',
  checkInCapture: 'Erfassen →',
  checkInSaved: 'Gespeichert ✓',
  checkInUpdate: 'Check-in aktualisieren',
  checkInNone: 'Noch kein Check-in',
  checkInStart: 'Check-in starten',
  concerns: '⚠️ Anliegen:',
  dateStart: 'Start:',
  dateEnd: 'Ende:',
} as const

export const RESIDENT_LIST_LABELS = {
  title: 'Bewohner',
  export: 'Exportieren',
  addResident: '+ Bewohner',
  unplacedBannerSuffix: 'Bewohner warten auf Platzierung',
  unplacedBannerDesc: 'Starten Sie den Matching-Prozess um passende Unterkünfte zu finden',
  startMatching: 'Matching starten',
  emptyArchived: 'Keine archivierten Bewohner',
  emptyFirst: 'Ersten Bewohner erfassen',
  searchPlaceholder: 'Bewohner suchen...',
  statusFilter: 'Status',
  allStatus: 'Alle Status',
  emptyDefault: 'Noch keine Bewohner vorhanden',
  emptyFiltered: 'Keine Bewohner für diese Filter',
  notPlaced: 'Nicht platziert',
  filterReset: 'Filter zurücksetzen',
  recentIncidentsSuffix: 'Vorfälle',
} as const

export const SATISFACTION_HISTORY_LABELS = {
  roommateRelations: 'Mitbewohner:',
  facilitySatisfaction: 'Einrichtung:',
  safetyFeeling: 'Sicherheit:',
  concerns: 'Anliegen:',
  improvements: 'Verbesserungen:',
  positives: 'Positives:',
  collectedBy: (name: string) => `Erfasst von: ${name}`,
  weekPrefix: 'Woche',
  title: (count: number) => `Zufriedenheits-Check-ins (${count})`,
  titleEmpty: 'Zufriedenheits-Check-ins',
  empty: 'Noch keine Check-ins erfasst.',
} as const

export const HOUSING_LIST_LABELS = {
  searchPlaceholder: 'Unterkunft suchen...',
  statusFilter: 'Status',
  allStatus: 'Alle Status',
  emptyDefault: 'Noch keine Unterkünfte vorhanden',
  emptyFiltered: 'Keine Unterkünfte für diese Filter',
  filterReset: 'Filter zurücksetzen',
  createHousingFirst: 'Erste Unterkunft erfassen',
  occupancy: 'Belegung',
  wheelchairTitle: 'Rollstuhlgerecht',
} as const

export const BED_GRID_LABELS = {
  noSpots: 'Keine Plätze definiert',
  age: 'Alter',
  languages: 'Sprachen',
  showProfile: 'Profil anzeigen →',
  freeSuffix: 'frei',
  ariaOccupied: (spot: string, resident: string) => `Platz ${spot}: belegt von ${resident}`,
  ariaAvailable: (spot: string) => `Platz ${spot}: verfügbar`,
  ariaUnavailable: (spot: string) => `Platz ${spot}: nicht verfügbar`,
  titleOccupied: (spot: string, resident: string) => `${spot}: ${resident} - Klicken für Details`,
  titleAvailable: (spot: string) => `${spot}: Verfügbar - Klicken zum Platzieren`,
  titleUnavailable: (spot: string) => `${spot}: Nicht verfügbar`,
} as const

export const PLACEMENT_PANEL_LABELS = {
  title: 'Bewohner platzieren',
  noResidents: 'Keine unplatzierten Bewohner verfügbar',
  addResident: 'Neuen Bewohner erfassen',
  foundSuffix: 'passende Bewohner gefunden, nach Kompatibilität sortiert',
  advancedMatching: 'Erweitertes Matching',
  placing: 'Wird platziert...',
  place: 'Platzieren',
  blocked: 'Blockiert',
  compatibilityTitle: 'Kompatibilität:',
} as const

export const COMPATIBILITY_MATRIX_LABELS = {
  heading: 'Kompatibilitätsmatrix',
  clickHint: 'Auf eine Zelle klicken für Kompatibilitätsdetails',
  swipeHint: 'Wischen zum Scrollen',
  legend: 'Legende:',
  legendExcellent: '80+ Sehr gut',
  legendGood: '60-79 Gut',
  legendMedium: '40-59 Mittel',
  legendLow: '20-39 Niedrig',
  legendCritical: '0-19 Kritisch',
  compatibilitySuffix: 'Kompatibilität',
  noScore: 'Keine Bewertung vorhanden',
  noScoreDesc: 'Die Kompatibilität wurde noch nicht berechnet',
} as const

export const PILOT_BASELINE_LABELS = {
  sectionTitle: 'Pilot-Baseline',
  sectionDesc: 'Erfassen Sie die Werte von vor dem System-Einsatz, um den Fortschritt zu messen.',
  startDateLabel: 'Pilot-Startdatum',
  startDateHint: 'Ab wann wird das System für alle Platzzuweisungen verwendet?',
  incidentsLabel: 'Konflikte pro Monat (vor System)',
  incidentsHint: 'Durchschnittliche Anzahl Zimmerkonflikte pro Monat (Phase 1)',
  relocationsLabel: 'Konflikt-Umzüge pro Monat (vor System)',
  relocationsHint: 'Durchschnittliche Anzahl Umzüge wegen Unverträglichkeit pro Monat (Phase 1)',
  mediationHoursLabel: 'Mediationsstunden pro Woche (vor System)',
  mediationHoursHint: 'Durchschnittlich aufgewendete Stunden für Konfliktmediation pro Woche (Phase 1)',
  saveButton: 'Baseline speichern',
  saveSuccess: 'Baseline gespeichert',
  notSet: 'Nicht erfasst',
  comparedToBaseline: (pct: number, direction: 'up' | 'down' | 'same') =>
    direction === 'down'
      ? `${pct}% weniger als Baseline`
      : direction === 'up'
      ? `${pct}% mehr als Baseline`
      : 'Unverändert zur Baseline',
  baselineLabel: 'Baseline',
  currentLabel: 'Aktuell',
  targetLabel: 'Ziel',
  progressLabel: 'Fortschritt',
  noBaselineHint: 'Keine Baseline konfiguriert. Gehen Sie zu Einstellungen, um Vorher-Werte einzutragen.',
} as const

export const SETTINGS_LABELS = {
  title: 'Einstellungen',
  subtitle: 'Teamverwaltung und Systemkonfiguration',
  inviteTitle: 'Mitarbeiter einladen',
  inviteSubtitle: 'Erstellt einen Zugangscode und sendet eine Einladungs-E-Mail.',
  emailWarning: 'E-Mail nicht konfiguriert (kein BREVO_API_KEY). Der Code wird nach dem Senden angezeigt — bitte manuell übermitteln.',
  teamTitle: 'Team',
  lastSeen: 'Zuletzt:',
  neverLoggedIn: 'Noch nie angemeldet',
  emailConfigTitle: 'E-Mail-Konfiguration',
  brevoConnected: 'Brevo API: Verbunden',
  brevoNotConfigured: 'Brevo API: Nicht konfiguriert',
  senderPrefix: 'Absender:',
  notificationsPrefix: 'Benachrichtigungen:',
  noRecipients: 'Keine Empfänger konfiguriert',
  addBrevoHint: 'Fügen Sie BREVO_API_KEY zur .env-Datei hinzu, um E-Mails zu aktivieren.',
} as const

export const INVITE_FORM_LABELS = {
  errorGeneric: 'Fehler beim Einladen',
  errorNetwork: 'Netzwerkfehler – bitte erneut versuchen',
  successTitle: 'Mitarbeiter eingeladen',
  successDesc: (name: string, email: string) => `${name} (${email}) wurde erstellt.`,
  emailSent: 'Einladungs-E-Mail gesendet mit Zugangscode.',
  emailNotSent: 'E-Mail nicht gesendet — Code manuell übermitteln:',
  inviteAnother: 'Weitere Person einladen',
  fieldName: 'Name',
  fieldNamePlaceholder: 'Vorname Nachname',
  fieldEmail: 'E-Mail-Adresse',
  fieldEmailPlaceholder: 'name@example.com',
  sending: 'Wird gesendet...',
  submit: 'Einladung senden',
} as const

export const RESIDENT_PROFILE_SIDEBAR_LABELS = {
  authCardTitle: 'Unterkunftsberechtigung',
  authDocLabel: 'Ärztliche Dokumentation',
  authDocPresent: '✓ Vorhanden',
  authDocAbsent: '✗ Keine',
  authForLabel: 'Berechtigung für',
  roomSharingLabel: 'Zimmerteilung',
  eligibleTypesLabel: 'Erlaubte Platztypen',
  spotTypeBed: 'Bett',
  spotTypePrivate: 'Einzelzimmer',
  spotTypeStudio: 'Studio',
  sectionLifestyle: 'Lebensstil',
  fieldSleepSchedule: 'Schlafrhythmus',
  fieldNoiseTolerance: 'Lärmtoleranz',
  fieldCleanliness: 'Sauberkeit',
  fieldSocialStyle: 'Sozialstil',
  fieldPrivacy: 'Privatsphäre',
  fieldSmoking: 'Rauchen',
  sectionLanguages: 'Sprachen & Herkunft',
  fieldLanguages: 'Sprachen',
  fieldRegion: 'Region',
  sectionHousehold: 'Haushalt & Selbständigkeit',
  fieldChores: 'Haushaltsbereitschaft',
  fieldRecycling: 'Recycling',
  fieldMobility: 'Mobilität',
  fieldSupportLevel: 'Betreuungsstufe',
  sectionNeeds: 'Besondere Bedürfnisse',
  fieldNightDisturbances: 'Nächtliche Unruhe',
  fieldQuietEnv: 'Ruhige Umgebung nötig',
  fieldSleepEquipment: 'Schlafgeräte',
  fieldMedEquipment: 'Med. Geräte',
  fieldDiet: 'Ernährung',
  sectionSharing: 'Teilen & Präferenzen',
  fieldSharedBathroom: 'Geteiltes Bad',
  fieldSharedKitchen: 'Geteilte Küche',
  fieldPets: 'Haustiere',
  notesTitle: 'Notizen',
} as const

export const APARTMENT_PROFILE_LABELS = {
  title: 'Wohnungsprofil',
  emptyState: 'Keine Bewohner - Profil wird erstellt wenn Bewohner platziert werden',
  harmonyLabel: 'Harmonie',
  residentsSuffix: ' Bewohner',
  nonSmokers: ' · Nichtraucher',
  smokerWarning: 'Raucher in der Wohnung: ',
  deviationPrefix: 'Abweichung: ',
  sleepSection: 'Schlafrhythmus',
  socialSection: 'Sozialstil',
  languagesSection: 'Sprachen',
  fieldCleanliness: 'Sauberkeit',
  fieldNoiseTolerance: 'Lärmtoleranz',
  fieldPrivacy: 'Privatsphäre',
  fieldChores: 'Haushaltsbeitrag',
} as const

export const SPOT_ACTIONS_LABELS = {
  setMaintenance: 'In Wartung setzen',
  setAvailable: 'Wieder verfügbar',
  deleteMessage: 'Dieser Platz wird unwiderruflich gelöscht.',
} as const

export const UNIT_SIDEBAR_LABELS = {
  facilitiesTitle: 'Ausstattung',
  rulesTitle: 'Hausregeln',
  locationTitle: 'Lage',
  notesTitle: 'Notizen',
  bathroomLabel: 'Badezimmer',
  bathroomValue: (priv: number, shared: number) => `${priv} privat, ${shared} geteilt`,
  kitchenLabel: 'Küche',
  kitchenPrivate: 'Privat',
  kitchenShared: 'Geteilt',
  kitchenNone: 'Keine',
  accessLabel: 'Barrierefreiheit',
  accessWheelchair: 'Rollstuhlgerecht',
  accessGroundFloor: 'Erdgeschoss',
  accessElevator: 'Lift vorhanden',
  accessLimited: 'Eingeschränkt',
  smokingLabel: 'Rauchen',
  petsLabel: 'Haustiere',
  quietHoursPrefix: 'Ruhezeiten: ',
  ruleAllowed: 'erlaubt',
  ruleNotAllowed: 'nicht erlaubt',
  locationPT: 'ÖV',
  locationHealth: 'Gesundheit',
  locationSchools: 'Schulen',
  locationNearby: 'in der Nähe',
  locationNotNearby: 'nicht in der Nähe',
} as const

export const QUICK_CHECKIN_LABELS = {
  satisfactionLabels: ['', 'Sehr unzufrieden', 'Unzufrieden', 'Neutral', 'Zufrieden', 'Sehr zufrieden'],
  roommateLabels: ['', 'Sehr schlecht', 'Schlecht', 'OK', 'Gut', 'Sehr gut'],
  mainLabel: 'Wie geht es Ihnen hier?',
  lastPrefix: 'Letzter: ',
  savingState: 'Speichern...',
  roommateLabel: 'Wie ist die Beziehung zu Ihren Mitbewohnern?',
  roommateScaleHint: '1 = Sehr schlecht, 5 = Sehr gut',
  concernsLabel: 'Was beschäftigt Sie?',
  concernsPlaceholder: 'Gibt es Probleme oder Anliegen?',
  fullFormLink: 'Alle Details erfassen →',
  saveBtn: 'Speichern',
  successSaved: 'Check-in gespeichert',
  toastSuccess: 'Check-in erfolgreich gespeichert',
  errorSaving: 'Fehler beim Speichern',
  errorGeneric: 'Ein Fehler ist aufgetreten',
  errorValidation: 'Bitte bewerten Sie die Mitbewohner-Beziehung oder beschreiben Sie Ihre Anliegen',
  statsLine: (week: number, count: number) => `Woche ${week} · ${count} Check-in${count !== 1 ? 's' : ''} bisher`,
  detailedLink: 'Detaillierter Check-in →',
} as const

export const HOUSING_NEW_LABELS = {
  backLink: '← Zurück zur Übersicht',
  title: 'Neue Unterkunft erstellen',
  subtitle: 'Schritt 1 von 2: Grunddaten erfassen. Im nächsten Schritt fügen Sie Zimmer und Betten hinzu.',
  step1Label: 'Grunddaten',
  step2Label: 'Zimmer & Betten',
  submit: 'Weiter zu Zimmer & Betten →',
} as const

export const HOUSING_SPOTS_LABELS = {
  backLink: '← Zurück zur Unterkunft',
  titleNew: 'Zimmer & Betten einrichten',
  titleManage: 'Plätze verwalten',
  doneBtn: 'Fertig →',
  welcomeTitle: 'Schritt 2 von 2: Zimmer und Betten einrichten',
  welcomeDescPre: 'Sie haben das Gebäude ',
  welcomeDescPost: ' erstellt. Jetzt fügen Sie die Zimmer und Betten hinzu.',
  hierarchyTitle: 'So funktioniert die Hierarchie:',
  hierarchyBuilding: '🏢 Gebäude',
  hierarchyRoom: '🚪 Zimmer',
  hierarchyBeds: '🛏️ Betten',
  hierarchyRoomDesc: '• Zimmer = gemeinsam genutzter Raum (z.B. Schlafzimmer mit 2-4 Betten)',
  hierarchyBedDesc: '• Betten = einzelne Schlafplätze in einem Zimmer',
  step1: 'Code eingeben (z.B. ',
  step1Code: 'Z1',
  step1Close: ')',
  step2: 'Anzahl Betten wählen',
  step3: '"Zimmer erstellen" klicken',
  addTitleNew: 'Zimmer & Betten erstellen',
  addTitle: 'Plätze hinzufügen',
  roomGroupTitle: 'Gemeinsames Zimmer (mit mehreren Betten)',
  roomGroupDesc: 'Erstellt 1 Zimmer + die angegebene Anzahl Betten darin',
  roomCodeLabel: 'Zimmer-Code *',
  roomCodePlaceholder: 'z.B. R1, Z101',
  bedCountLabel: 'Anzahl Betten *',
  squareMetersLabel: 'Fläche (m²)',
  squareMetersPlaceholder: 'z.B. 18',
  floorLabel: 'Stockwerk',
  floorPlaceholder: 'z.B. 0, 1, 2',
  labelField: 'Bezeichnung',
  roomLabelPlaceholder: 'z.B. Zimmer Nord',
  createRoomBtn: 'Zimmer erstellen',
  singleTitle: 'Privatzimmer oder Studio',
  singleDesc: 'Einzelplatz ohne gemeinsam genutztes Schlafzimmer',
  codeLabel: 'Code *',
  codePlaceholder: 'z.B. EZ1, ST-A',
  typeLabel: 'Typ *',
  singleLabelPlaceholder: 'z.B. Einzelzimmer Süd',
  requiresMedDocs: 'Erfordert med. Dokumentation',
  createSpotBtn: 'Platz erstellen',
  existingTitle: 'Vorhandene Plätze',
  emptySpots: 'Noch keine Plätze definiert',
  emptyRoomView: 'Keine Plätze definiert für diese Unterkunft',
  addSpotsBtn: 'Plätze hinzufügen',
  standaloneSection: 'Einzelne Plätze',
  occupied: 'Belegt',
  available: 'Frei',
} as const

export const RESIDENT_FORM_LABELS = {
  medDocTitle: 'Medizinische Dokumentation',
  medDocDesc: 'Berechtigung für Einzelzimmer oder Studio (erfordert ärztliche Bestätigung)',
  medDocCheckboxLabel: 'Medizinische Dokumentation vorhanden',
  medDocCheckboxDesc: 'Ärztliche Bestätigung für besondere Unterbringungsbedürfnisse',
  medDocTypeLabel: 'Art der Berechtigung',
} as const

export const RESIDENT_DETAIL_LABELS = {
  breadcrumb: 'Bewohner',
  transferBtn: 'Verlegen',
  editBtn: 'Bearbeiten',
  placeBtn: 'Platzieren',
  currentPlacementTitle: 'Aktuelle Platzierung',
  since: 'Seit ',
  compatibility: 'Kompatibilität',
  quickCheckin: 'Schnell-Check-in',
  notPlaced: 'Nicht platziert',
  findUnit: 'Passende Unterkunft finden',
  toastPlaced: 'Bewohner erfolgreich platziert',
  toastCheckin: 'Check-in erfolgreich gespeichert',
  lifestyleSimilar: 'Ähnlicher Lebensstil',
  lifestyleDifferent: 'Unterschiedlicher Lebensstil',
  socialGood: 'Gute soziale Passung',
  socialDifferent: 'Soziale Unterschiede',
  practicalCompat: 'Praktisch kompatibel',
} as const

export const CHECKIN_FORM_LABELS = {
  backLink: (code: string) => `← Zurück zu ${code}`,
  title: 'Zufriedenheits-Check-in',
  week: (n: number) => `Woche ${n}`,
  previousTitle: 'Letzte Check-ins',
  satisfactionScore: (n: number) => `Zufriedenheit: ${n}/5`,
  typeLabel: 'Art des Check-ins *',
  overallLabel: 'Allgemeine Zufriedenheit *',
  scaleHint: '1 = Sehr unzufrieden, 5 = Sehr zufrieden',
  scaleGeneral: ['', 'Sehr schlecht', 'Schlecht', 'OK', 'Gut', 'Sehr gut'],
  scaleSafety: ['', 'Sehr unsicher', 'Unsicher', 'OK', 'Sicher', 'Sehr sicher'],
  notRated: 'Nicht bewertet',
  roommatesLabel: 'Beziehung zu Mitbewohnern',
  facilityLabel: 'Zufriedenheit mit Einrichtung',
  safetyLabel: 'Sicherheitsgefühl',
  concernsLabel: 'Anliegen / Sorgen',
  concernsPlaceholder: 'Was beschäftigt Sie? Gibt es Probleme?',
  improvementsLabel: 'Verbesserungsvorschläge',
  improvementsPlaceholder: 'Was könnte verbessert werden?',
  positivesLabel: 'Positives',
  positivesPlaceholder: 'Was läuft gut? Was gefällt Ihnen?',
  collectedByLabel: 'Erfasst von',
  collectedByPlaceholder: 'Name des Mitarbeiters',
  anonymousLabel: 'Anonym erfassen',
  submit: 'Check-in speichern',
} as const

export const MATCH_RESULTS_LABELS = {
  heading: (code: string) => `Matches für ${code}`,
  modeStandard: 'Standard',
  modeFast: 'Fast Mode',
  cancel: 'Abbrechen',
  quickActionDesc: (code: string, score: number) =>
    `Schnellaktion: Bestes Match ist ${code} (${score}%). Top-Empfehlungen sind unten hervorgehoben.`,
  quickActionBtn: 'Bestes Match platzieren',
  fastModeTitle: 'Fast Mode · Top 5',
  fastModeSubtitle: 'Kompakte Ansicht für schnelle Entscheidungen',
  fitInfo: (score: number, current: number, total: number) =>
    `Fit: ${score}% · Belegung: ${current}/${total}`,
  topMatchesTitle: 'Top Empfehlungen',
  topMatchesSubtitle: 'Schnellste sichere Auswahl',
  otherMatchesTitle: 'Weitere Optionen',
} as const

export const INCIDENT_DETAIL_LABELS = {
  backLink: '← Zurück zur Liste',
  overdueAria: 'Überfällig',
  overdueTitle: (date: string) => `Follow-up überfällig seit ${date}`,
  priorityPrefix: 'Priorität: ',
  clearReminder: 'Erinnerung löschen',
  scheduledAria: 'Geplant',
  scheduledTitle: (date: string) => `Nächste Follow-up: ${date}`,
  descriptionTitle: 'Beschreibung',
  resolutionTitle: 'Lösung',
  resolvedAt: (date: string) => `Gelöst am ${date}`,
  markedResolved: 'Vorfall als gelöst markiert',
  nextScheduledPrefix: 'Nächste:',
} as const

export const RESIDENT_NEW_LABELS = {
  backLink: '← Zurück zur Übersicht',
  title: 'Neuen Bewohner erfassen',
  step1Subtitle: 'Schritt 1 von 2: Profil erfassen. Danach finden wir passende Unterkünfte.',
  step1Label: 'Profil erfassen',
  step2Label: 'Unterkunft finden',
  submit: 'Weiter zum Matching →',
  cancel: 'Abbrechen',
} as const

export const RESIDENT_EDIT_LABELS = {
  backLink: '← Zurück zum Profil',
  title: (code: string) => `${code} bearbeiten`,
  subtitle: 'Aktualisieren Sie die Informationen des Bewohners',
  submit: 'Änderungen speichern',
  cancel: 'Abbrechen',
} as const

export const HOUSING_EDIT_LABELS = {
  backLink: '← Zurück zur Übersicht',
  title: (code: string) => `${code} bearbeiten`,
  subtitle: 'Aktualisieren Sie die Informationen der Unterkunft',
  statusLabel: 'Status',
  statusDescription: 'Betriebsstatus der Unterkunft — beeinflusst Matching und Platzierungen',
  submit: 'Änderungen speichern',
  cancel: 'Abbrechen',
} as const

export const FORM_VALIDATION_UX_LABELS = {
  requiredFields: 'Bitte prüfen Sie die markierten Pflichtfelder.',
  fieldRequired: 'Dieses Feld ist erforderlich',
  readOnly: 'Kann nicht geändert werden',
} as const

export const COMPATIBLE_MATCHES_LABELS = {
  desc: 'Diese Bewohner könnten zusammen platziert werden.',
  unitsTitle: 'Beste Unterkünfte',
  residentsTitle: 'Passende Mitbewohner (unplatziert)',
  emptyUnit: 'Leer',
  residentCount: (count: number) => `${count} Bewohner`,
} as const

export const TOP_COMPATIBILITIES_LABELS = {
  title: 'Top Kompatibilitäten',
} as const

export const AI_ASSISTANT_LABELS = {
  subtitle: 'Stellen Sie Fragen zu Bewohnern, Unterkünften, Vorfällen und Statistiken.',
  componentTitle: 'KI-Assistent für AOZ',
  componentSubtitle: 'Stellen Sie Fragen zu Bewohnern, Unterkünften und Vorfällen.',
} as const

export const AI_SUGGESTED_QUESTIONS = [
  'Wie viele Bewohner sind aktuell im System?',
  'Welche Einheiten haben noch freie Plätze?',
  'Zeige mir die letzten offenen Vorfälle.',
  'Was ist die aktuelle Belegungsrate?',
] as const

export const RESIDENT_INCIDENTS_LABELS = {
  sectionTitle: 'Vorfallstatistik',
  warningMessage: (count: number) => `Diese Person war in ${count} Vorfällen betroffen.`,
  reviewRecommendation: 'Eine Überprüfung der Platzierung wird empfohlen.',
  reportedLabel: 'Gemeldet',
  reportedDesc: 'Vorfälle von dieser Person gemeldet',
  subjectLabel: 'Betroffen',
  subjectDesc: 'Vorfälle über diese Person',
  subjectTitle: (count: number) => `Vorfälle über diese Person (${count})`,
  reportIncident: 'Vorfall melden',
  noIncidents: 'Keine Vorfälle dokumentiert',
} as const

export const TRANSFER_RECOMMENDATIONS_LABELS = {
  noUnitsAvailable: 'Keine Unterkünfte mit geeigneten Plätzen verfügbar.',
  unitsAvailable: (count: number) => `${count} Unterkünfte verfügbar · Sortiert nach Passgenauigkeit`,
  roommateCompatibility: 'Kompatibilität mit Mitbewohnern',
  showMoreUnits: (count: number) => `+${count} weitere Unterkünfte anzeigen`,
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
  scaleCleanliness: (direction: string) => `Deutlich ${direction} Sauberkeit als Durchschnitt`,
  scaleNoise: (direction: string) => `Deutlich ${direction} Lärmtoleranz als Durchschnitt`,
  scalePrivacy: (direction: string) => `Deutlich ${direction} Bedürfnis nach Privatsphäre`,
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
