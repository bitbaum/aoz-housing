/**
 * Authentication and role labels
 */

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
}

export const LOGIN_LABELS = {
  title: 'Anmelden',
  subtitle: 'Geben Sie Ihren persönlichen Code ein',
  code: 'Ihr Code',
  codePlaceholder: 'z.B. RES-123456',
  // Addresses residents directly, therefore informal "du"
  residentHint: 'Bewohner: Deinen Code findest du auf deinem Willkommensbrief.',
  staffHint: 'Mitarbeitende melden sich mit ihrem AOZ-Code an.',
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
  help: 'Kein Code oder Probleme beim Anmelden? Wenden Sie sich an die AOZ-Verwaltung oder Ihre Betreuungsperson.',
  demo: {
    title: 'Demo-Zugang',
    description: 'Für Präsentationen und Produkttests.',
    staff: 'AOZ-Verwaltung',
    resident: 'Bewohner-Portal',
  },
} as const
