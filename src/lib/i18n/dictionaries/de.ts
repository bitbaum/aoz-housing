/**
 * The German dictionary — the shape every other language must fit, and the
 * fallback for every string no other language has yet.
 *
 * WHY THIS IS A FLAT MAP OF DOTTED KEYS rather than the nested objects the rest
 * of the label files use: a translator works through a list, and a missing key
 * must be a single missing line rather than a hole three levels down a tree
 * that TypeScript reports as an incompatible object. Flat also makes coverage
 * countable, which is what decides whether a language may be offered at all.
 *
 * SCOPE. This is the resident portal's chrome — navigation, the reports flow,
 * shared actions. It is deliberately not the whole product: staff surfaces are
 * used by AOZ employees who work in German, and translating those first would
 * spend the effort where it changes nothing. Residents are the people who may
 * not read German at all.
 */

export const de = {
  // Navigation
  'nav.overview': 'Übersicht',
  'nav.apartment': 'Wohnung',
  'nav.expenses': 'Ausgaben',
  'nav.roommates': 'Mitbewohner',
  'nav.chores': 'Aufgaben',
  'nav.rules': 'Regeln',
  'nav.decisions': 'Abstimmen',
  'nav.report': 'Melden',
  'nav.reports': 'Meine Meldungen',
  'nav.messages': 'Nachrichten',
  'nav.housing': 'Unterkünfte',
  'nav.activities': 'Aktivitäten',
  'nav.preferences': 'Einstellungen',
  'nav.profile': 'Profil',
  'nav.transfer': 'Verlegung',
  'nav.help': 'Hilfe',
  'nav.logout': 'Abmelden',
  'nav.more': 'Mehr',
  'nav.moreTitle': 'Alles im Überblick',
  'nav.closeMore': 'Menü schliessen',

  // Sections of the "more" sheet
  'navGroup.living': 'Alltag',
  'navGroup.together': 'Zusammen entscheiden',
  'navGroup.concerns': 'Anliegen & Angebote',
  'navGroup.account': 'Mein Konto',

  // Reports
  'reports.title': 'Deine Meldungen',
  'reports.subtitle': 'Alles, was du gemeldet hast — und was die Betreuung dazu sagt.',
  'reports.showAll': 'Alle Meldungen anzeigen',
  'reports.empty': 'Du hast noch nichts gemeldet.',
  'reports.new': 'Neu melden',
  'reports.open': 'Offen',
  'reports.done': 'Erledigt',
  'reports.pending': 'Das Team prüft diese Meldung aktuell.',
  'reports.answer': 'Antwort der Betreuung',
  'reports.viewYours': 'Deine Meldungen ansehen',

  // Messages
  'messages.title': 'Nachrichten',
  'messages.subtitle': 'Schreib der Betreuung — sie antwortet dir hier.',
  'messages.empty': 'Noch keine Nachrichten. Schreib uns, wenn du etwas brauchst.',
  'messages.placeholder': 'Deine Nachricht …',
  'messages.send': 'Senden',
  'messages.sending': 'Wird gesendet …',
  'messages.you': 'Du',
  'messages.staff': 'Betreuung',
  'messages.unread': 'neu',

  // Shared actions
  'action.save': 'Speichern',
  'action.cancel': 'Abbrechen',
  'action.back': 'Zurück',
  'action.close': 'Schliessen',
  'action.showAll': 'Alle anzeigen',

  // The language picker itself
  'language.label': 'Sprache',
  'language.change': 'Sprache wechseln',
  'language.machineNotice':
    'Diese Übersetzung wurde noch nicht von einer muttersprachlichen Person geprüft.',

  // Safety copy. Translated last and reviewed hardest — this is the text that
  // has to be right at three in the morning.
  'safety.emergency': 'Bei Notfällen: 112 oder Hausverwaltung kontaktieren',
} as const

/** The key set every dictionary is measured against. */
export type MessageKey = keyof typeof de

/**
 * A translation may be incomplete — missing strings fall back to German. What
 * an incomplete translation may NOT do is be offered to residents; that is what
 * `Locale.reviewed` gates, and the test suite ties the two together.
 */
export type Dictionary = Partial<Record<MessageKey, string>>
