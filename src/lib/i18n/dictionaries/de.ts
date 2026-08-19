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
  'nav.marketplace': 'Marktplatz',
  'nav.events': 'Veranstaltungen',
  'nav.preferences': 'Einstellungen',
  'nav.profile': 'Profil',
  'nav.transfer': 'Verlegung',
  'nav.help': 'Hilfe',
  'nav.learning': 'Lernen',
  'nav.logout': 'Abmelden',
  'nav.more': 'Mehr',
  'nav.moreTitle': 'Alles im Überblick',
  'nav.closeMore': 'Menü schliessen',
  'nav.accountMenu': 'Konto',

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

  'help.title': 'Hilfe & FAQ',
  'help.subtitle': 'Antworten und Kontakt — bei Gefahr zuerst die Notfallnummern.',
  'help.faqTitle': 'Häufig gestellte Fragen',
  'help.contactTitle': 'Kontakt',
  'help.emergencyTitle': 'Notfall',
  'help.emergencyDesc': 'Bei Notfällen oder akuter Gefahr wende dich sofort an:',
  'help.faq.placement.q': 'Wie funktioniert die Zimmerverteilung?',
  'help.faq.placement.a':
    'Wir berücksichtigen Schlafrhythmus, Lärm, Sauberkeit und Sprachen. Je genauer deine Angaben, desto besser die Platzierung.',
  'help.faq.preferences.q': 'Kann ich meine Angaben ändern?',
  'help.faq.preferences.a':
    'Ja, unter Einstellungen. Änderungen gelten für künftige Platzierungen.',
  'help.faq.conflict.q': 'Was passiert bei einem Konflikt?',
  'help.faq.conflict.a':
    'Melde das über «Melden» im Portal. Das Team nimmt jede Meldung ernst.',
  'help.faq.transfer.q': 'Kann ich einen Umzug beantragen?',
  'help.faq.transfer.a':
    'Ja, über «Verlegung» oder deine Betreuungsperson.',
  'help.faq.privacy.q': 'Werden meine Daten geschützt?',
  'help.faq.privacy.a':
    'Ja. Nur Wohnpräferenzen, keine Diagnosen, kein Asylstatus. Du kannst deine Daten einsehen lassen.',
  'help.link.report': 'Problem melden',
  'help.link.rules': 'Hausregeln',

  'report.title': 'Problem melden',
  'report.subtitle': 'Technisches Problem oder Konflikt — das Team sieht die Meldung.',
  'report.emergencyTitle': 'Akute Gefahr?',
  'report.emergencyMessage': 'Bei Notfällen: 112. Notfall ausserhalb der Bürozeiten: 044 415 63 30.',
  'report.noPlacement': 'Du hast noch keine Unterkunft. Melde dich bei der Betreuung.',

  'rules.title': 'Hausregeln',
  'rules.subtitle':
    'Die verbindliche Fassung ist Deutsch — die Fassung, die du unterschreibst. Frag die Betreuung, wenn du etwas nicht verstehst.',
  'rules.noPlacement': 'Sobald du einer Unterkunft zugeteilt bist, findest du hier die Regeln.',
  'rules.toDecisions': 'Zu den Beschlüssen',

  'learning.title': 'Dein Lernen',
  'learning.subtitle':
    'Nachweise, Kurse und Freiwilligenarbeit — du kannst selbst eintragen, was du machst.',
  'learning.achievements': 'Nachweise',
  'learning.achievementsEmpty':
    'Noch keine Nachweise. Abgeschlossene Tests, Kurse und Freiwilligenarbeit erscheinen hier.',
  'learning.inProgress': 'Laufend',
  'learning.offers': 'Kurse und Angebote',
  'learning.offersEmpty': 'Gerade keine Lernangebote. Schau unter Aktivitäten nach.',
  'learning.hours': 'Stunden',

  'care.title': 'Dein Team',
  'care.subtitle': 'Wer für dich zuständig ist — Wohnen, Sozialarbeit, Jobcoach, Freiwilligenarbeit.',
  'care.empty': 'Noch niemand zugewiesen. Die Betreuung trägt das Team ein.',
  'care.housing': 'Wohnen / Betreuung',
  'care.social': 'Sozialarbeit',
  'care.job': 'Jobcoach',
  'care.volunteering': 'Freiwilligenarbeit',
  'care.appointments': 'Termine',
  'care.appointmentsEmpty': 'Keine Termine geplant.',

  'marketplace.title': 'Marktplatz',
  'marketplace.subtitle': 'Verschenken, verleihen oder suchen — innerhalb deiner Unterkunft und darüber hinaus.',
  'marketplace.ownUnit': 'Deine Unterkunft',
  'marketplace.otherUnits': 'Andere Unterkünfte',
  'marketplace.empty': 'Noch keine Meldungen.',
  'marketplace.postNew': 'Neue Meldung',
  'marketplace.formTitle': 'Titel',
  'marketplace.formDescription': 'Beschreibung',
  'marketplace.formKind': 'Art',
  'marketplace.formCategory': 'Kategorie',
  'marketplace.submit': 'Veröffentlichen',
  'marketplace.claim': 'Übernehmen',
  'marketplace.close': 'Abschliessen',
  'marketplace.postedBy': 'Von',
  'marketplace.claimedBy': 'Übernommen von',
  'marketplace.kindGiveAway': 'Verschenken',
  'marketplace.kindLend': 'Verleihen',
  'marketplace.kindWanted': 'Gesucht',
  'marketplace.categoryFurniture': 'Möbel',
  'marketplace.categoryKitchen': 'Küche',
  'marketplace.categoryClothing': 'Kleidung',
  'marketplace.categoryElectronics': 'Elektronik',
  'marketplace.categoryKids': 'Kinder',
  'marketplace.categoryOther': 'Sonstiges',
  'marketplace.statusOpen': 'Offen',
  'marketplace.statusClaimed': 'Übernommen',
  'marketplace.statusClosed': 'Abgeschlossen',

  'events.title': 'Veranstaltungen',
  'events.subtitle': 'Hausversammlungen und gemeinsame Anlässe — sag zu, ab, oder erstelle selbst einen Termin.',
  'events.empty': 'Noch keine Veranstaltungen geplant.',
  'events.createNew': 'Neue Veranstaltung',
  'events.formTitle': 'Titel',
  'events.formDescription': 'Beschreibung',
  'events.formLocation': 'Ort',
  'events.formStartsAt': 'Beginn',
  'events.formCategory': 'Kategorie',
  'events.submit': 'Erstellen',
  'events.rsvpGoing': 'Ich komme',
  'events.rsvpMaybe': 'Vielleicht',
  'events.rsvpDeclined': 'Ich komme nicht',
  'events.cancel': 'Absagen',
  'events.cancelled': 'Abgesagt',
  'events.categoryHouseMeeting': 'Hausversammlung',
  'events.categorySocial': 'Geselliges',
  'events.categoryCulture': 'Kultur',
  'events.categorySupport': 'Unterstützung',

  // Portal dashboard
  'dashboard.welcome': 'Willkommen zurück',
  'dashboard.subtitle': 'Hier siehst du, wie es in deiner Unterkunft läuft.',
  'dashboard.housing': 'Unterkunft',
  'dashboard.active': 'Aktiv',
  'dashboard.moveIn': 'Einzug',
  'dashboard.rooms': 'Zimmer',
  'dashboard.roommatesCount': 'Mitbewohnende',
  'dashboard.compatibility': 'Kompatibilität',
  'dashboard.houseRules': 'Hausregeln',
  'dashboard.quietHours': 'Nachtruhe',
  'dashboard.smokingAllowed': 'Rauchen erlaubt',
  'dashboard.noSmoking': 'Kein Rauchen',
  'dashboard.petsAllowed': 'Haustiere erlaubt',
  'dashboard.noPets': 'Keine Haustiere',
  'dashboard.roommates': 'Mitbewohnende',
  'dashboard.noHousingContact': 'Noch keine Unterkunft zugewiesen.',
  'dashboard.myReports': 'Meine Meldungen',
  'dashboard.newReport': 'Neue Meldung',
  'dashboard.noReports': 'Noch keine Meldungen.',
  'dashboard.quickChores': 'Aufgaben',
  'dashboard.taskSingular': 'Aufgabe',
  'dashboard.taskPlural': 'Aufgaben',
  'dashboard.quickPreferences': 'Präferenzen',
  'dashboard.nextDesc': 'Nächste Aufgabe',
  'dashboard.quickReport': 'Melden',
  'dashboard.quickLearning': 'Kurse',
  'dashboard.now': 'Jetzt',
  'dashboard.onboarding.title': 'Erste Schritte',
  'dashboard.onboarding.subtitle': 'So startest du im Portal durch.',
  'dashboard.onboarding.step1': 'Profil vervollständigen',
  'dashboard.onboarding.step2': 'Präferenzen angeben',
  'dashboard.onboarding.step3': 'Unterkunft erkunden',
  'dashboard.onboarding.step4': 'Mitbewohnende kennenlernen',
  'dashboard.onboarding.completePreferences': 'Präferenzen angeben',
  'dashboard.onboarding.completePreferencesHint': 'Damit wir dir die passende Unterkunft zeigen können.',
  'dashboard.onboarding.browseHousing': 'Unterkunft erkunden',
  'dashboard.onboarding.browseHousingHint': 'Sieh dir an, wo du untergebracht bist.',

  // Activities card
  'activities.dashboardTitle': 'Aktivitäten & Kurse',
  'activities.dashboardSubtitle': 'Empfehlungen für dich.',
  'activities.noResults': 'Keine aktuellen Angebote.',
  'activities.dashboardCta': 'Alle Angebote ansehen',

  // Expenses card
  'expenses.dashboardTitle': 'Gemeinsame Ausgaben',
  'expenses.dashboardCta': 'Ausgaben verwalten',
  'expenses.dashboardBalance': 'Dein Saldo',
  'expenses.balanceSettled': 'Alles beglichen',
  'expenses.balancePositive': 'Du bekommst noch Geld',
  'expenses.balanceNegative': 'Du bist noch schuldig',

  // Reports
  'reports.showAllCount': 'Alle Meldungen anzeigen',

  // Satisfaction rating (resident-facing widget)
  'satisfaction.title': 'Wie geht es dir?',
  'satisfaction.subtitle': 'Dein Feedback hilft uns, die Unterkunft zu verbessern.',
  'satisfaction.privacyNote': 'Deine Angaben werden vertraulich behandelt.',
  'satisfaction.thankYouTitle': 'Danke für dein Feedback!',
  'satisfaction.thankYouMessage': 'Wir haben deine Rückmeldung erhalten.',
  'satisfaction.concernsForwarded': 'Deine Anliegen wurden an das Betreuungsteam weitergeleitet.',
  'satisfaction.today': 'Heute',
  'satisfaction.lastFeedback': 'Letztes Feedback',
  'satisfaction.newFeedback': 'Neues Feedback geben',

  // Nav group labels
  'navGroup.living': 'Alltag & Wohnen',
  'navGroup.together': 'Miteinander',
  'navGroup.integration': 'Integration & Beruf',
  'navGroup.account': 'Mein Konto',
} as const

/** The key set every dictionary is measured against. */
export type MessageKey = keyof typeof de

/**
 * A translation may be incomplete — missing strings fall back to German. What
 * an incomplete translation may NOT do is be offered to residents; that is what
 * `Locale.reviewed` gates, and the test suite ties the two together.
 */
export type Dictionary = Partial<Record<MessageKey, string>>
