/**
 * Authentication and role labels
 */

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  CASE_WORKER: 'Sachbearbeiter',
  VIEWER: 'Betrachter',
}

export const LOGIN_LABELS = {
  title: 'Anmelden',
  subtitle: 'AOZ Wohnen - Platzierungssystem',
  tabs: {
    login: 'Anmelden',
    register: 'Registrieren',
  },
  email: 'E-Mail',
  emailPlaceholder: 'ihre.email@aoz.ch',
  password: 'Passwort',
  passwordPlaceholder: 'Passwort eingeben',
  submit: 'Anmelden',
  submitting: 'Anmelden...',
  register: {
    name: 'Name',
    namePlaceholder: 'Vor- und Nachname',
    email: 'E-Mail',
    emailPlaceholder: 'ihre.email@aoz.ch',
    password: 'Passwort',
    passwordPlaceholder: 'Mindestens 8 Zeichen',
    inviteCode: 'AOZ-Code (optional)',
    inviteCodePlaceholder: 'Nur für AOZ-Profil eingeben',
    inviteCodeHelp: 'Ohne Code wird ein Bewohnerprofil erstellt.',
    submit: 'Registrieren',
    submitting: 'Registrieren...',
    error: {
      generic: 'Registrierung fehlgeschlagen',
      emailExists: 'Diese E-Mail ist bereits registriert',
      invalidCode: 'Ungültiger AOZ-Code',
    },
  },
  error: {
    required: 'E-Mail und Passwort erforderlich',
    invalid: 'Ungültige E-Mail oder Passwort',
    rateLimit: 'Zu viele Anmeldeversuche',
    generic: 'Ein Fehler ist aufgetreten',
  },
  help: 'Bei Problemen wenden Sie sich an die IT-Abteilung.',
  portalLink: 'Bewohner? Zum Bewohnerportal',
} as const
