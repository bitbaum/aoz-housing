/**
 * Staff dashboard labels
 */

import { LEARNING_AREA_NAME, LEARNING_PULSE_WINDOW_DAYS } from '@/lib/config/learning'

export const DASHBOARD_LABELS = {
  greetingMorning: 'Guten Morgen',
  greetingDay: 'Guten Tag',
  greetingEvening: 'Guten Abend',

  today: 'heute',
  yesterday: 'gestern',
  daysAgo: 'Tagen',

  allClearSummary: 'Alles unter Kontrolle heute.',
  oneTaskWaiting: '1 Aufgabe wartet auf Sie.',
  tasksWaitingSuffix: 'Aufgaben warten auf Sie.',

  sectionOpenTasks: 'Offene Aufgaben',
  sectionDueSoon: 'Bald fällig',
  sectionQuickActions: 'Schnellaktionen',
  sectionTasks: 'Aufgaben',
  sectionOccupancy: 'Belegung',
  sectionHousing: 'Unterkünfte',

  statFreeBeds: 'Freie Plätze',
  statCheckIns: 'Check-ins',
  statOverdueSuffix: 'überfällig',
  statCurrentSuffix: 'aktuell',
  statNoneCurrent: 'keine aktuell',
  statAllCurrent: 'alle aktuell',
  statHarmony: 'Harmonie',
  statDaysSuffix: 'Tage',
  /** German needs the singular for exactly one. "1 Tage" reads as a bug. */
  statDaySuffixSingular: 'Tag',
  statNoConflicts: 'ohne Konflikte',
  statMaintenance: 'Wartung',
  statOpenSuffix: 'offen',
  statLearning: LEARNING_AREA_NAME,
  statRunningSuffix: 'laufend',
  // Reads the window it reports on: the subtext said "30 Tagen" as a literal
  // while the query behind it read LEARNING_PULSE_WINDOW_DAYS, so changing the
  // window would have left the tile confidently describing the old one.
  statLearningCompletions: (n: number) =>
    n === 1
      ? `1 Abschluss in ${LEARNING_PULSE_WINDOW_DAYS} Tagen`
      : `${n} Abschlüsse in ${LEARNING_PULSE_WINDOW_DAYS} Tagen`,
  statEvents: 'Veranstaltungen',
  statPlannedSuffix: 'geplant',
  // Leitung only — the one stat Betreuung does not see.
  statTeam: 'Team',
  statTeamSuffix: 'aktiv',
  statTeamNeverSignedIn: (n: number) =>
    n === 1 ? '1 Konto war noch nie angemeldet' : `${n} Konten waren noch nie angemeldet`,

  tileCheckIns: 'Check-ins durchführen',
  tilePlaceResidents: 'Klient*innen platzieren',
  tileConflictUnits: 'Einheiten mit Konflikten',
  tileConflictUnitsDesc: 'Wiederholte Vorfälle in den letzten 30 Tagen',
  tileTransferRequests: 'Verlegungsanfragen prüfen',
  tileTransferRequestsDesc: 'Klient*innen warten auf eine Antwort',
  tileProposals: 'Beschlüsse bestätigen',
  tileProposalsDesc: 'Häuser warten auf eine Antwort der Betreuung',
  tileCheckInsThisWeek: 'Check-ins diese Woche',
  tilePlanProactively: 'Proaktiv planen',
  tileWaitingLongestSuffix: 'wartet am längsten',
  tileSincePrefix: 'Seit',
  tileIncidents: 'Vorfälle',

  dueTodayPrefix: 'Heute fällig',
  dueTomorrowPrefix: 'Morgen fällig',
  dueInPrefix: 'In',
  dueInSuffix: 'Tagen',

  showAllPrefix: 'Alle',
  showAllSuffix: 'anzeigen',
  showMoreSuffix: 'weitere',
  showAllLink: 'Alle',

  allClearTitle: 'Alles unter Kontrolle!',
  allClearAllDone: 'Alles erledigt!',
  allClearConflictFreeSuffix: 'Tage ohne Konflikte.',
  allClearBedsReadySuffix: 'Plätze für neue Klient*innen bereit.',
  allClearAllOccupied: 'Alle Plätze belegt.',
  allClearNoDringend: 'Keine dringenden Aufgaben',
  allClearBedsFreeSuffix: 'Plätze frei',

  /**
   * A workspace with nobody in it yet. Deliberately NOT celebratory: this
   * screen used to say "Alles erledigt!" to a team that had not started, and
   * a green tick over an empty database is a false report, not a welcome.
   * @see lib/config/dashboard.ts — workspaceState()
   */
  emptyTitle: 'Noch keine Daten erfasst',
  emptySummary: 'Noch nichts erfasst.',
  emptyBody:
    'Diese Übersicht zeigt Aufgaben, sobald es Klient*innen gibt. Zurzeit ist die Datenbank leer — das ist kein Fehler, sondern der Startpunkt.',
  /** For roles that may not create anything: no button, just the reason. */
  emptyNoSetupRights:
    'Sobald die Leitung Unterkünfte und Klient*innen erfasst hat, erscheint hier Ihre Arbeit.',
  setupCreateHousing: 'Erste Unterkunft erfassen',
  setupCreateResident: 'Erste*n Klient*in erfassen',

  actionNewResident: 'Neue*r Klient*in',
  actionNewUnit: 'Neue Einheit',
  actionStartMatching: 'Matching starten',
  actionReportIncident: 'Vorfall melden',
  actionMaintenanceTicket: 'Wartungsticket',
  actionCreateResident: 'Neue*n Klient*in erfassen',
  actionOpenLearning: `${LEARNING_AREA_NAME} öffnen`,
  actionViewStats: 'Statistiken ansehen',

  /** Names what the hero block is, now that it is no longer a coloured slab. */
  heroEyebrow: 'Als Nächstes',
  heroCriticalIncidentsSuffix: 'kritische Vorfälle',
  heroActionNow: 'Sofort bearbeiten',
  heroCheckInUrgentPrefix: 'Check-in dringend:',
  heroNotSeenSuffix: 'Tagen nicht gesehen',
  heroStartCheckIn: 'Check-in starten',
  heroProposalsTitle: (n: number) =>
    n === 1 ? '1 Beschluss wartet auf Bestätigung' : `${n} Beschlüsse warten auf Bestätigung`,
  heroReviewProposals: 'Jetzt prüfen',
  heroPlaceResidentsSuffix: 'Klient*innen platzieren',
  heroFreeBedsAvailableSuffix: 'freie Plätze verfügbar',
  heroOpenConflictsSuffix: 'offene Konflikte',
  heroMainProblemPrefix: 'Hauptproblem:',
  heroAnalyze: 'Analysieren',
  heroCheckInsPendingSuffix: 'Check-ins anstehend',
  heroNextPrefix: 'Nächster:',
  heroMonitorUnitsSuffix: 'Einheiten beobachten',
  heroHadSuffix: 'hatte',
  heroIncidentsSuffix: 'Vorfälle',
  heroReview: 'Überprüfen',

  alertCriticalAttentionSuffix: 'kritische Vorfälle erfordern sofortige Aufmerksamkeit',
  alertEdit: 'Bearbeiten',

  occupancyOccupied: 'belegt',
  occupancyOf: 'von',
  occupancyPlaces: 'Plätzen',
  occupancyFree: 'frei',
  occupancyAvailable: 'Verfügbar',
  occupancyFull: 'Voll belegt',
  occupancyMaintenance: 'In Wartung',
  occupancyClosed: 'Geschlossen',
  occupancyViewAll: 'Alle Unterkünfte',

  taskCriticalOpenSuffix: 'kritische Vorfälle offen',
  taskNoCritical: 'Keine kritischen Vorfälle',
  taskCheckInsOverdueSuffix: 'Check-ins überfällig',
  taskAllCheckInsCurrent: 'Alle Check-ins aktuell',
  taskWaitingPlacementSuffix: 'Klient*innen warten auf Platzierung',
  taskAllPlaced: 'Alle Klient*innen platziert',
  taskMaintenanceOverdueSuffix: 'Wartungstickets überfällig',
  taskMaintenanceCurrent: 'Wartung aktuell',
  taskWeek: 'Woche',
  taskDaysAgoPrefix: 'Vor',
  taskSincePrefix: 'Seit',

  // Analytics / placement stat cards
  analyticsOccupancyRate: 'Belegungsrate',
  analyticsOverdueCheckIns: 'Überfällige Check-ins',
  analyticsConflictEnded: 'Konfliktbedingt beendet',
  analyticsAvgSatisfaction: 'Ø Zufriedenheit',
  // Analytics page
  analyticsPageSubtitle: 'Übersicht über Belegung, Check-ins und Konflikte',
  analyticsConflictsTitle: (days: number) => `Konflikte (${days} Tage)`,
  analyticsUnresolved: (count: number) => `${count} ungelöst`,
  analyticsEndReasonsTitle: 'Beendigungsgründe (gesamt)',
  analyticsNoEndedPlacements: 'Keine beendeten Platzierungen',
  // Analytics metric card subtitles
  analyticsBedSubtitle: (occupied: number, total: number) => `${occupied} von ${total} Betten`,
  analyticsActiveSuffix: (total: number) => `von ${total} aktiven`,
  analyticsEndingSubtitle: (conflict: number, total: number) =>
    `${conflict} von ${total} Beendungen`,
  // Analytics section headings and empty states
  analyticsHotspotTitle: (days: number) => `Konflikt-Hotspots (${days} Tage)`,
  analyticsNoHotspots: 'Keine Konflikt-Hotspots',
  analyticsConflictCountLabel: 'Konflikte',
  analyticsConflictTypesTitle: (days: number) => `Konfliktarten (${days} Tage)`,
  analyticsNoConflictTypes: 'Keine Konflikte in diesem Zeitraum',
} as const

export const MISSION_KPI_LABELS = {
  conflictsPerMonth: 'Konflikte / Monat',
  relocationsPerMonth: 'Umsiedlungen / Monat',
  conflictsMonthlyChart: 'Konflikte pro Monat',
  relocationsMonthlyChart: 'Konflikt-Umsiedlungen pro Monat',
  currentLabel: 'Dieser Monat',
  daysUnit: 'Tage',
  avgPlacementTime: 'Ø Platzierungszeit',
  last30Days: 'Letzte 30 Tage',
  targetDays: '≤ 2 Tage',
  conflictTrend: 'Konflikt-Trend',
  mediationHoursPerWeek: 'Mediationsstunden / Woche',
  mediationMonthlyChart: 'Mediationszeit pro Monat',
  hoursUnit: 'Std.',
  sectionTitle: 'Missions-KPIs',
  sectionDesc: (months: number) =>
    `Letzte ${months} Monate — Ziel: weniger Konflikte, schnellere Platzierung`,
  trendImproving: 'Verbesserung',
  trendStable: 'Stabil',
  trendWorsening: 'Verschlechterung',
  nudgeToLog: '→ Zeit in Vorfällen eintragen',
} as const

export const MAINTENANCE_CARD_LABELS = {
  newTicket: 'Neues Ticket',
  title: 'Wartung & Service',
  openSuffix: 'offen',
  oldestTicket: (days: number) => `Ältestes Ticket: ${days} Tage`,
  urgentCount: (count: number) => `${count} dringend`,
  allDone: 'Alles erledigt',
  viewAll: 'Alle Tickets →',
} as const

export const SYSTEM_HEALTH_LABELS = {
  title: 'Systemstatus',
  conflictsThirtyDays: 'Konflikte (30 Tage)',
  worstUnit: (code: string, count: number) => `${code}: ${count} Konflikte →`,
  noHotspots: 'Keine Brennpunkte',
  bedsFree: 'Plätze frei',
  ofTotal: (total: number) => `von ${total} total`,
  maintenanceOpen: 'Wartung offen',
  oldest: (days: number) => `Älteste: ${days} Tage →`,
  allDone: 'Alles erledigt',
} as const

export const ALGORITHM_ACCURACY_LABELS = {
  sectionTitle: 'Algorithmus-Genauigkeit',
  empty: 'Noch keine beendeten Platzierungen mit Kompatibilitätsbewertung vorhanden.',
  subtitle: (count: number) =>
    `Vergleich: Kompatibilitätsbewertung vs. tatsächliches Ergebnis (${count} Platzierungen)`,
  avgScoreConflict: 'Ø Score bei Konflikt-Ende',
  avgScoreSuccess: 'Ø Score bei erfolgreichem Ende',
  resultsByTierTitle: 'Ergebnisse nach Kompatibilitätsstufe',
  placementsLabel: 'Platzierungen',
  conflictsLabel: 'Konflikte',
  satisfactionLabel: 'Zufriedenheit',
  avgDurationLabel: 'Ø Dauer',
  colTier: 'Stufe',
  colConflictRate: 'Konfliktrate',
  colAvgSatisfaction: 'Ø Zufriedenheit',
  colAvgDuration: 'Ø Dauer (Tage)',
  satisfactionByTierTitle: 'Zufriedenheit nach Kompatibilitätsstufe',
  checkInsLabel: 'Check-ins',
  predictionTitle: 'Vorhersage-Genauigkeit',
  predictableConflicts: 'Vorhersagbare Konflikte',
  unpredictable: 'Unvorhersagbare',
  notRated: 'Noch nicht bewertet',
  // DashboardMetrics
  statFreeBeds: 'Freie Plätze',
  statCheckInsOverdue: 'Check-ins überfällig',
  statResidents: 'Klient*innen',
  statWaitingForPlacement: (count: number) => `${count} warten auf Platzierung`,
  statAllPlaced: 'Alle platziert',
  statOfTotal: (total: number) => `von ${total} total`,
  statActivePlacements: (count: number) => `von ${count} aktiven Platzierungen`,
  statOpenIncidents: 'Offene Vorfälle',
  statConflictsMaintenance: (conflicts: number, maintenance: number) =>
    `${conflicts} Konflikte, ${maintenance} Wartung`,
  // ConflictCard
  conflictCardTitle: 'Konflikte',
  conflictCardActiveSuffix: 'aktiv (30 Tage)',
  conflictCardOldest: (days: number) => `Ältester: ${days} Tage ungelöst`,
  conflictCardHotspots: 'Brennpunkte',
  conflictCardOccupied: 'belegt',
  conflictCardConflictCount: (count: number) => `${count} Konflikte`,
  conflictCardLast7Days: 'Letzte 7 Tage',
  conflictCardNoneNew: '✓ Keine neuen',
  conflictCardNewCount: (count: number) => `${count} neue`,
  conflictCardAllClear: 'Keine aktiven Konflikte',
  conflictCardViewAll: 'Alle Vorfälle →',
  // RecentPlacementsTable
  checkInOverdueBadge: 'Check-in überfällig',
  checkInPendingBadge: 'Check-in ausstehend',
  tableOverdue: 'Überfällig',
  tablePending: 'Ausstehend',
  tableColDate: 'Datum',
  tableColResident: 'Klient*in',
  tableColUnit: 'Unterkunft',
  tableColLastCheckIn: 'Letzter Check-in',
  tableColStatus: 'Status',
  // ConflictAnalysisSection
  conflictCausesTitle: 'Konfliktursachen',
  conflictCausesEmpty: 'Noch keine detaillierten Konfliktdaten erfasst.',
  conflictCausesEmptyHint: 'Bei zukünftigen Konfliktbeendigungen werden Ursachen dokumentiert.',
  algorithmInsightsTitle: 'Algorithmus-Einsichten',
  predictabilityEmpty: 'Noch keine Vorhersagbarkeits-Daten erfasst.',
  predictableLabel: 'Vorhersehbar',
  unpredictableLabel: 'Nicht vorhersehbar',
  predictabilityRateSuffix: 'der Konflikte waren laut Fallarbeitern vorhersehbar.',
  lowScoreWarningPrefix: 'Konflikte hatten einen Kompatibilitäts-Score unter 60% bei Platzierung.',
  lowScoreHint: '→ Erwägen Sie höhere Schwellenwerte für Platzierungen',
} as const
