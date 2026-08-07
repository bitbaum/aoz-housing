/**
 * Authentication and role labels
 */
import { BRAND } from '@/lib/config/brand'
import { RESIDENT_CODE_PREFIX } from '@/lib/auth/code-prefixes'

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
}

export const LOGIN_LABELS = {
  title: 'Anmelden',
  subtitle: 'Code eingeben, um sich anzumelden',
  code: 'Zugangscode',
  codePlaceholder: `${BRAND.codePrefix}XXXXXX oder ${RESIDENT_CODE_PREFIX}XXXXXX`,
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
  help: `Bei Problemen wenden Sie sich an die ${BRAND.shortName}-Verwaltung.`,
  demo: {
    title: 'Demo-Zugang',
    description: 'Für Präsentationen und Produkttests.',
    staff: `${BRAND.shortName}-Verwaltung`,
    resident: 'Bewohner-Portal',
  },
} as const
