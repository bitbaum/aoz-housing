/**
 * Centralized German error messages for server actions and API routes.
 *
 * Single source of truth: change a message here and every action/route
 * that imports it picks up the change automatically.
 *
 * Naming convention:
 *   ENTITY_ACTION_OUTCOME  e.g. RESIDENT_CREATE_ERROR, SPOT_NOT_FOUND
 */

export const ERROR_MESSAGES = {
  // ─── Auth / Session ────────────────────────────────────────────
  NOT_AUTHENTICATED: 'Nicht angemeldet',
  AUTH_REQUIRED: 'Authentifizierung erforderlich',
  INSUFFICIENT_PERMISSIONS: 'Unzureichende Berechtigungen',
  INVALID_CREDENTIALS: 'Ungültige E-Mail oder Passwort',
  ACCOUNT_NOT_SETUP: 'Konto nicht vollständig eingerichtet',
  SESSION_ERROR: 'Ein Fehler ist aufgetreten',

  // ─── Generic validation ────────────────────────────────────────
  INVALID_INPUT: 'Ungültige Eingabe',
  INVALID_INPUT_DATA: 'Ungültige Eingabedaten',
  INVALID_REQUEST: 'Ungültige Anfrage.',
  INVALID_RATING: 'Ungültige Bewertung',
  INVALID_SATISFACTION_VALUE: 'Ungültiger Zufriedenheitswert',
  INVALID_AOZ_CODE: 'Ungültiger AOZ-Code',

  // ─── Generic operation errors ──────────────────────────────────
  ARCHIVE_ERROR: 'Fehler beim Archivieren',
  RESTORE_ERROR: 'Fehler beim Wiederherstellen',
  SAVE_ERROR: 'Fehler beim Speichern',
  SAVE_FAILED: 'Speichern fehlgeschlagen',
  PLACEMENT_ERROR: 'Fehler bei der Platzierung',
  TRANSFER_ERROR: 'Fehler bei der Verlegung',

  // ─── Resident ──────────────────────────────────────────────────
  RESIDENT_NOT_FOUND: 'Bewohner nicht gefunden',
  /** With trailing period — used inside matching transaction */
  RESIDENT_NOT_FOUND_P: 'Bewohner nicht gefunden.',
  RESIDENT_CREATE_ERROR: 'Fehler beim Erstellen des Bewohners',
  RESIDENT_UPDATE_ERROR: 'Fehler beim Aktualisieren des Bewohners',
  RESIDENT_HAS_ACTIVE_PLACEMENT: 'Bewohner hat bereits eine aktive Platzierung',
  RESIDENT_HAS_ACTIVE_PLACEMENTS: 'Bewohner hat noch aktive Platzierungen. Bitte zuerst beenden.',
  RESIDENT_ALREADY_PLACED: 'Bewohner ist bereits platziert.',
  RESIDENT_ARCHIVE_BLOCKED: 'Archivieren nicht möglich: aktive Platzierung vorhanden',

  // ─── Housing unit ──────────────────────────────────────────────
  UNIT_NOT_FOUND: 'Unterkunft nicht gefunden',
  UNIT_CREATE_ERROR: 'Fehler beim Erstellen der Unterkunft',
  UNIT_UPDATE_ERROR: 'Fehler beim Aktualisieren der Unterkunft',
  UNIT_ARCHIVE_BLOCKED: 'Archivieren nicht möglich: aktive Belegung vorhanden',

  // ─── Placement ─────────────────────────────────────────────────
  PLACEMENT_NOT_FOUND: 'Platzierung nicht gefunden',
  PLACEMENT_NOT_ACTIVE: 'Platzierung ist nicht aktiv',
  PLACEMENT_END_ERROR: 'Fehler beim Beenden der Platzierung',
  NO_ACTIVE_PLACEMENT: 'Keine aktive Platzierung',

  // ─── Spot / Platz ─────────────────────────────────────────────
  SPOT_NOT_FOUND: 'Platz nicht gefunden',
  /** With trailing period — used inside matching transaction */
  SPOT_NOT_FOUND_P: 'Platz nicht gefunden.',
  SPOT_NOT_AVAILABLE: 'Platz ist nicht verfügbar',
  SPOT_NOT_AVAILABLE_ANYMORE: 'Platz ist nicht mehr verfügbar.',
  SPOT_ALREADY_OCCUPIED: 'Platz ist bereits belegt.',
  SPOT_CREATE_ERROR: 'Fehler beim Erstellen des Platzes',
  SPOT_UPDATE_ERROR: 'Fehler beim Aktualisieren des Platzes',
  SPOT_DELETE_ERROR: 'Fehler beim Löschen des Platzes',
  SPOT_DELETE_BLOCKED: 'Platz kann nicht gelöscht werden, da aktive Platzierungen existieren',
  SPOTS_BATCH_CREATE_ERROR: 'Fehler beim Erstellen der Zimmer/Betten',

  // ─── Satisfaction / Check-in ───────────────────────────────────
  CHECKIN_SAVE_ERROR: 'Fehler beim Speichern des Check-ins',

  // ─── Incident ──────────────────────────────────────────────────
  INCIDENT_CREATE_ERROR: 'Fehler beim Erstellen des Vorfalls',
  INCIDENT_RESOLVE_ERROR: 'Fehler beim Auflösen des Vorfalls',
  INCIDENT_UPDATE_MEDIATION_ERROR: 'Fehler beim Speichern der Mediationszeit',
  FOLLOWUP_CREATE_ERROR: 'Fehler beim Erstellen der Nachverfolgung',
  REMINDER_DELETE_ERROR: 'Fehler beim Löschen der Erinnerung',

  // ─── Maintenance ───────────────────────────────────────────────
  MAINTENANCE_CREATE_ERROR: 'Fehler beim Erstellen der Wartungsanfrage',
  MAINTENANCE_STATUS_UPDATE_ERROR: 'Fehler beim Aktualisieren des Status',
  MAINTENANCE_ASSIGN_ERROR: 'Fehler bei der Zuweisung',

  // ─── Household tasks (chores) ──────────────────────────────────
  TASK_NOT_FOUND: 'Aufgabe nicht gefunden',
  TASK_ALREADY_COMPLETED: 'Aufgabe ist bereits abgeschlossen',
  TASK_LOAD_ERROR: 'Aufgabe konnte nicht geladen werden',
  TASKS_LOAD_ERROR: 'Aufgaben konnten nicht geladen werden',
  TASK_CREATE_ERROR: 'Aufgabe konnte nicht erstellt werden',
  TASK_COMPLETE_ERROR: 'Aufgabe konnte nicht als erledigt markiert werden',
  TASK_FLAG_ERROR: 'Markierung konnte nicht gespeichert werden',
  TASK_COMPLAINT_ERROR: 'Problem konnte nicht gemeldet werden',
  TASK_REQUEST_ERROR: 'Anfrage konnte nicht gesendet werden',

  // ─── Transfer requests ─────────────────────────────────────────
  TRANSFER_REQUEST_NOT_FOUND: 'Verlegungsanfrage nicht gefunden',
  TRANSFER_REQUEST_ALREADY_PENDING: 'Du hast bereits eine offene Verlegungsanfrage',
  TRANSFER_REQUEST_NO_PLACEMENT: 'Keine aktive Platzierung vorhanden',
  TRANSFER_REQUEST_CREATE_ERROR: 'Fehler beim Erstellen der Verlegungsanfrage',
  TRANSFER_REQUEST_REVIEW_ERROR: 'Fehler beim Bearbeiten der Verlegungsanfrage',

  // ─── Portal / Registration ─────────────────────────────────────
  PREFERENCES_SAVE_ERROR: 'Einstellungen konnten nicht gespeichert werden',
  REPORT_SAVE_ERROR: 'Meldung konnte nicht gespeichert werden',
  EMAIL_ALREADY_REGISTERED: 'Diese E-Mail ist bereits als AOZ-Profil registriert',
  CODE_GENERATION_ERROR: 'Code-Generierung fehlgeschlagen. Bitte erneut versuchen.',
  RATE_LIMITED: 'Zu viele Versuche. Bitte warte eine Minute.',
  REGISTRATION_FIELDS_REQUIRED: 'Bitte alle Pflichtfelder ausfüllen.',
  REGISTRATION_FIELDS_REQUIRED_CORRECT: 'Bitte alle Pflichtfelder korrekt ausfüllen.',
} as const

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES
