/**
 * Authentication and role labels
 */

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
}

export const LOGIN_LABELS = {
  title: 'Anmelden',
  subtitle: 'Code eingeben, um sich anzumelden',
  code: 'Zugangscode',
  codePlaceholder: 'AOZ-XXXXXX oder RES-XXXXXX',
  codeHint: 'Verwenden Sie Ihren persönlichen Zugangscode.',
  submit: 'Anmelden',
  submitting: 'Anmelden...',
  success: {
    staff: 'Admin-Zugang aktiviert',
    resident: 'Bewohner-Zugang aktiviert',
    redirecting: 'Weiterleitung...',
  },
  error: {
    required: 'Code erforderlich',
    invalid: 'Ungültiger Code',
    rateLimit: 'Zu viele Anmeldeversuche',
    generic: 'Ein Fehler ist aufgetreten',
  },
  help: 'Bei Problemen wenden Sie sich an die AOZ-Verwaltung.',
} as const
