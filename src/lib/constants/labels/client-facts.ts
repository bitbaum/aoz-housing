/**
 * Staff-side copy for a client's own admin facts.
 *
 * The resident portal reads its strings from `lib/i18n` — this file is the
 * German staff surface (the approval queue and the client detail page), which
 * per CLAUDE.md stays German.
 *
 * One word choice here is load-bearing: nothing says *gültig*. Staff record
 * that they have SEEN a document, and the product must not upgrade that into a
 * claim that the insurance is valid or the permit current — neither of which
 * anyone here can check.
 */

export const CLIENT_FACT_LABELS = {
  queueTitle: 'Freigaben',
  queueSubtitle: 'Angaben, die Klient*innen selbst erfasst haben und die noch niemand gesehen hat.',
  queueEmpty: 'Nichts offen.',
  queueEmptyHint: 'Neue Angaben von Klient*innen erscheinen hier.',

  // Renewals sit ABOVE the queue: a lapsing insurance costs someone their
  // cover, which outranks reading an entry from last week.
  renewalsTitle: 'Läuft demnächst ab',
  renewalsHint:
    'Krankenversicherungen und Ausweise, die in den nächsten 60 Tagen ablaufen oder bereits abgelaufen sind.',

  kinds: {
    INSURANCE: 'Krankenversicherung',
    HEALTH_CONTACT: 'Gesundheitsfachperson',
    PERMIT: 'Aufenthaltsstatus',
  } as Record<string, string>,

  status: {
    PENDING: 'Noch nicht geprüft',
    CONFIRMED: 'Von der Betreuung gesehen',
    REJECTED: 'Zurückgewiesen',
  } as Record<string, string>,

  /** What the badge means, said once where staff can read it. */
  confirmMeaning:
    'Geprüft heisst: eine Person aus der Betreuung hat die Angabe gesehen. Es heisst nicht, dass sie bei der Kasse oder beim Amt überprüft wurde.',

  permitTypes: {
    N: 'Ausweis N (Asylsuchend)',
    F: 'Ausweis F (Vorläufig aufgenommen)',
    B: 'Ausweis B (Aufenthaltsbewilligung)',
    C: 'Ausweis C (Niederlassungsbewilligung)',
    S: 'Ausweis S (Schutzstatus)',
    OTHER: 'Anderer Ausweis',
    UNSPECIFIED: 'Keine Angabe',
  } as Record<string, string>,

  fields: {
    insurer: 'Krankenkasse',
    policyNumber: 'Versichertennummer',
    validUntil: 'Gültig bis',
    name: 'Name',
    profession: 'Funktion',
    phone: 'Telefon',
    address: 'Adresse',
    note: 'Notiz',
    permitType: 'Ausweis',
  },

  renewal: {
    due: (days: number) => (days === 1 ? 'Läuft morgen ab' : `Läuft in ${days} Tagen ab`),
    expired: (days: number) =>
      days === 1 ? 'Seit gestern abgelaufen' : `Seit ${days} Tagen abgelaufen`,
    none: 'Kein Datum hinterlegt',
  },

  review: {
    confirm: 'Gesehen',
    reject: 'Zurückweisen',
    noteLabel: 'Rückmeldung an die Klient*in',
    notePlaceholder: 'Was fehlt oder stimmt nicht?',
    reviewedBy: (name: string) => `Gesehen von ${name}`,
  },

  errors: {
    signedOut: 'Die Sitzung ist abgelaufen. Bitte erneut anmelden.',
    checkFields: 'Bitte die markierten Felder prüfen.',
    notYours: 'Dieser Eintrag gehört nicht zu diesem Konto.',
    notYourClient: 'Für diese Angabe ist eine andere Fachperson zuständig.',
    gone: 'Dieser Eintrag existiert nicht mehr.',
    saveFailed: 'Speichern hat nicht geklappt. Bitte nochmals versuchen.',
  },

  audit: {
    selfEntered: 'Von der Klient*in selbst erfasst',
    seenByStaff: 'Von der Betreuung gesehen',
    sentBack: 'Zur Korrektur zurückgewiesen',
  },
} as const
