/**
 * Authentication and role labels
 */
import { BRAND } from '@/lib/config/brand'
import { RESIDENT_CODE_PREFIX } from '@/lib/auth/code-prefixes'

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Leitung',
  BETREUUNG: 'Betreuung',
  SOZIALARBEIT: 'Sozialarbeit',
  JOBCOACH: 'Jobcoach',
  FREIWILLIGENARBEIT: 'Freiwilligenarbeit',
}

export const LOGIN_LABELS = {
  title: 'Anmelden',
  subtitle: 'Mit E-Mail und Passwort anmelden',
  email: 'E-Mail',
  emailPlaceholder: 'name@example.ch',
  password: 'Passwort',
  forgotPassword: 'Passwort vergessen?',
  noAccount: 'Noch kein Konto?',
  registerLink: 'Konto erstellen',
  useCode: 'Mit Code anmelden',
  useEmail: 'Mit E-Mail anmelden',
  codeSubtitle: 'Code eingeben, um sich anzumelden',
  code: 'Zugangscode',
  codePlaceholder: `${BRAND.codePrefix}XXXXXX oder ${RESIDENT_CODE_PREFIX}XXXXXX`,
  codeHint: 'Verwenden Sie Ihren persönlichen Zugangscode.',
  emailVerified: 'E-Mail-Adresse bestätigt. Sie können sich jetzt anmelden.',
  emailVerifyFailed: 'Der Bestätigungslink ist ungültig oder abgelaufen.',
  passwordResetDone: 'Passwort gesetzt. Melden Sie sich jetzt damit an.',
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
    title: 'Direkt ausprobieren',
    description:
      'Ohne Konto testen — Sie sehen das echte Produkt, genau so, wie es die Bewohnenden nutzen.',
    staff: `${BRAND.shortName}-Verwaltung`,
    resident: 'Als Bewohner:in ausprobieren',
  },
} as const

export const REGISTER_LABELS = {
  title: 'Konto erstellen',
  subtitle: 'Mit Ihrem Zugangscode registrieren — danach melden Sie sich mit E-Mail und Passwort an.',
  codeHint: 'Der Code, den Sie von der Verwaltung oder Ihrer WG erhalten haben.',
  passwordHint: 'Mindestens 8 Zeichen.',
  submit: 'Konto erstellen',
  submitting: 'Konto wird erstellt...',
  success: 'Konto erstellt — Sie sind angemeldet.',
  // Linking a second role is the same form, so it needs saying out loud —
  // otherwise nobody discovers that one login can hold both sides.
  linkTitle: 'Zwei Rollen, ein Login',
  linkHint:
    'Sie haben bereits ein Konto und einen zweiten Code — etwa als Bewohner und in der Verwaltung? Registrieren Sie den zweiten Code mit derselben E-Mail-Adresse und Ihrem bestehenden Passwort. Beide Rollen liegen danach auf einem Login.',
  successBothRoles: 'Codes verknüpft — Sie sind für beide Rollen angemeldet.',
  hasAccount: 'Bereits ein Konto?',
  loginLink: 'Anmelden',
} as const

export const FORGOT_PASSWORD_LABELS = {
  title: 'Passwort vergessen',
  subtitle: 'Wir senden Ihnen einen Link zum Zurücksetzen.',
  submit: 'Link anfordern',
  submitting: 'Wird gesendet...',
  // Deliberately identical whether the email exists or not (no enumeration).
  success:
    'Falls ein Konto mit dieser E-Mail existiert, haben wir einen Link zum Zurücksetzen gesendet. Prüfen Sie auch den Spam-Ordner.',
  backToLogin: 'Zurück zur Anmeldung',
} as const

export const RESET_PASSWORD_LABELS = {
  title: 'Neues Passwort setzen',
  subtitle: 'Wählen Sie ein neues Passwort für Ihr Konto.',
  newPassword: 'Neues Passwort',
  submit: 'Passwort speichern',
  submitting: 'Wird gespeichert...',
  missingToken: 'Dieser Link ist unvollständig. Öffnen Sie den Link aus der E-Mail erneut.',
  requestNew: 'Neuen Link anfordern',
} as const
