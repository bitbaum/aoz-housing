/**
 * Handing an already-provisioned colleague their own login.
 *
 * @see src/app/api/auth/handover/route.ts
 */
export const HANDOVER_LABELS = {
  /** The control on the team roster, shown only for someone with no email yet. */
  action: 'Zugang übergeben',
  actionHint: 'Sendet dieser Person ihren Zugangscode per E-Mail.',
  emailField: 'E-Mail-Adresse',
  emailPlaceholder: 'name@aoz.ch',
  submit: 'Senden',
  sending: 'Wird gesendet...',
  cancel: 'Abbrechen',
  success: 'Zugang gesendet an',

  // Failures. Each says which of them happened, because "es hat nicht
  // geklappt" leaves an administrator with no idea whether to fix the address,
  // wait, or go and look at the mail configuration.
  emailInvalid: 'Gültige E-Mail-Adresse erforderlich.',
  emailTaken: 'Diese E-Mail-Adresse wird bereits verwendet.',
  alreadyHasEmail: 'Diese Person hat bereits eine E-Mail-Adresse hinterlegt.',
  unknownUser: 'Konto nicht gefunden.',
  inactiveUser: 'Dieses Konto ist deaktiviert.',
  emailDisabled: 'E-Mail-Versand ist nicht konfiguriert — es wurde nichts gesendet.',
  sendFailed:
    'Die Adresse ist hinterlegt, aber die E-Mail konnte nicht gesendet werden. Die Person kann «Passwort vergessen?» verwenden.',
} as const
