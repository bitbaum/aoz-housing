export type ActivityCategory = 'sport' | 'language' | 'culture' | 'community' | 'family' | 'support'
export type ActivityCost = 'free' | 'reduced' | 'paid'

export interface Activity {
  id: string
  category: ActivityCategory
  title: string
  description: string
  cost: ActivityCost
  costNote?: string
  location?: string
  website?: string
  phone?: string
  schedule?: string
  highlight?: boolean
}

export const ACTIVITY_CATEGORIES: Record<ActivityCategory, { label: string; icon: string }> = {
  sport:     { label: 'Sport & Bewegung',             icon: '⚽' },
  language:  { label: 'Deutsch lernen',               icon: '📖' },
  culture:   { label: 'Kultur & Freizeit',            icon: '🎨' },
  community: { label: 'Treffpunkte & Gemeinschaft',   icon: '🤝' },
  family:    { label: 'Kinder & Familie',             icon: '👨‍👩‍👧' },
  support:   { label: 'Beratung & Unterstützung',     icon: '💬' },
}

export const ACTIVITIES: Activity[] = [
  // Sport & Bewegung
  {
    id: 'uetliberg',
    category: 'sport',
    title: 'Wandern auf dem Uetliberg',
    description: 'Kostenlose Wanderwege auf Zürichs Hausberg mit herrlichem Blick über die Stadt und den See.',
    cost: 'free',
    location: 'Uetliberg, Zürich (S10 ab HB)',
    schedule: 'Jederzeit zugänglich',
    highlight: true,
  },
  {
    id: 'seeufer',
    category: 'sport',
    title: 'Spazierwege am Zürichsee',
    description: 'Schöne kostenlose Wander- und Joggingstrecken direkt am See — in der ganzen Stadt erreichbar.',
    cost: 'free',
    location: 'Zürichsee-Ufer, Quai',
    schedule: 'Jederzeit zugänglich',
    highlight: false,
  },
  {
    id: 'hallenbad',
    category: 'sport',
    title: 'Hallenbäder der Stadt Zürich',
    description: 'Öffentliche Hallenbäder an verschiedenen Standorten. Ermässigte Eintritte für Sozialhilfeempfängerinnen und -empfänger.',
    cost: 'reduced',
    costNote: 'Ab CHF 5 — Ermässigung auf Anfrage',
    location: 'Verschiedene Standorte in Zürich',
    website: 'https://www.stadt-zuerich.ch/ssd/de/index/sport/schwimmen.html',
    highlight: false,
  },

  // Deutsch lernen
  {
    id: 'vhs-deutsch',
    category: 'language',
    title: 'Deutschkurse — Volkshochschule Zürich',
    description: 'Grosses Kursangebot für alle Niveaus (A1 bis C2). Auch Konversationskurse und Prüfungsvorbereitung. Fördergelder möglich.',
    cost: 'paid',
    costNote: 'Ab CHF 180 — Subventionen für Berechtigte',
    location: 'Zürich Zentrum und weitere Standorte',
    website: 'https://www.vhs.ch',
    phone: '044 205 84 84',
    schedule: 'Laufende Kurse — Anmeldung jederzeit möglich',
    highlight: true,
  },
  {
    id: 'caritas-deutsch',
    category: 'language',
    title: 'Deutschkurse — Caritas Zürich',
    description: 'Günstige Deutschkurse speziell für Migrantinnen und Migranten, auch Alphabetisierungskurse. Keine Kosten für Sozialhilfeempfängerinnen und -empfänger.',
    cost: 'reduced',
    costNote: 'Kostenlos oder stark ermässigt',
    location: 'Zürich',
    website: 'https://www.caritas-zurich.ch',
    phone: '044 366 66 66',
    highlight: false,
  },
  {
    id: 'bibliothek-lernen',
    category: 'language',
    title: 'Stadtbibliotheken Zürich — Lernen & WLAN',
    description: 'Kostenloser Bibliotheksausweis, Deutschbücher, E-Learning-Ressourcen und gratis WLAN. Ruhiger Lernort in deiner Nähe.',
    cost: 'free',
    location: 'Verschiedene Standorte in Zürich',
    website: 'https://www.bibliotheken-zuerich.ch',
    schedule: 'Mo–Fr 10:00–20:00, Sa 10:00–17:00 (je nach Standort)',
    highlight: true,
  },

  // Kultur & Freizeit
  {
    id: 'kulturlegi',
    category: 'culture',
    title: 'Kulturlegi Zürich',
    description: 'Ermässigungskarte für Kultur, Sport und Freizeit. Bis zu 50% Rabatt bei Museen, Kinos, Theatern, Schwimmbädern und mehr.',
    cost: 'reduced',
    costNote: 'CHF 20/Jahr — danach grosse Rabatte auf Hunderte von Angeboten',
    location: 'Gültig im Kanton Zürich',
    website: 'https://kulturlegi.ch',
    phone: '044 217 86 50',
    highlight: true,
  },
  {
    id: 'stadtbibliothek-kultur',
    category: 'culture',
    title: 'Veranstaltungen in den Bibliotheken',
    description: 'Kostenlose Lesungen, Ausstellungen und Veranstaltungen in allen Stadtbibliotheken — für Erwachsene und Kinder.',
    cost: 'free',
    location: 'Verschiedene Standorte in Zürich',
    website: 'https://www.bibliotheken-zuerich.ch',
    highlight: false,
  },
  {
    id: 'kunsthaus-gratis',
    category: 'culture',
    title: 'Kunsthaus Zürich — Freier Eintritt',
    description: 'Jeden ersten Mittwoch im Monat ist der Eintritt ins Kunsthaus kostenlos. Führungen auf Anmeldung.',
    cost: 'free',
    location: 'Heimplatz 1, 8001 Zürich',
    website: 'https://www.kunsthaus.ch',
    schedule: 'Erster Mittwoch im Monat, 10:00–20:00',
    highlight: false,
  },
  {
    id: 'seebad',
    category: 'culture',
    title: 'Freibäder am Zürichsee',
    description: 'Im Sommer kostenlos oder sehr günstig am See schwimmen. Viele Badestellen sind gratis zugänglich.',
    cost: 'free',
    costNote: 'Viele Seezugänge gratis — Badi-Eintritt ab CHF 2',
    location: 'Verschiedene Standorte am See',
    schedule: 'Sommer (Juni–September)',
    highlight: false,
  },

  // Treffpunkte & Gemeinschaft
  {
    id: 'quartiertreffs',
    category: 'community',
    title: 'Quartiertreffs der Stadt Zürich',
    description: 'Offene Begegnungsorte in vielen Stadtquartieren — Veranstaltungen, Beratung, Austausch. Offen für alle.',
    cost: 'free',
    location: 'Verteilt über alle Stadtquartiere',
    website: 'https://www.stadt-zuerich.ch/sd/de/index/unterstuetzung_beratung/soziokultur/quartiertreffs.html',
    schedule: 'Je nach Standort verschieden',
    highlight: false,
  },
  {
    id: 'aoz-angebote',
    category: 'community',
    title: 'AOZ Integrations- und Beschäftigungsangebote',
    description: 'Kurse, Beschäftigungsprogramme und soziale Angebote speziell für Asylsuchende und anerkannte Flüchtlinge.',
    cost: 'free',
    location: 'Zürich, verschiedene Standorte',
    website: 'https://www.aoz.ch',
    phone: '044 415 66 66',
    schedule: 'Mo–Fr 8:00–17:00 (Auskunft)',
    highlight: true,
  },
  {
    id: 'sah-zuerich',
    category: 'community',
    title: 'SAH Zürich — Integration & Beschäftigung',
    description: 'Das Schweizerische Arbeiterhilfswerk bietet Unterstützung bei Integration, Arbeit und Alltagsfragen für Migrantinnen und Migranten.',
    cost: 'free',
    location: 'Zürich',
    website: 'https://www.sah-zuerich.ch',
    highlight: false,
  },

  // Kinder & Familie
  {
    id: 'pro-juventute',
    category: 'family',
    title: 'Pro Juventute — Elternberatung',
    description: 'Kostenlose Beratung für Eltern zu Erziehung, Entwicklung und Familienthemen. Angebot in mehreren Sprachen.',
    cost: 'free',
    location: 'Telefonisch und vor Ort in Zürich',
    website: 'https://www.projuventute.ch',
    phone: '147 (Mo–Fr 9:00–20:00, kostenlos)',
    highlight: false,
  },
  {
    id: 'spielgruppen',
    category: 'family',
    title: 'Spielgruppen der Stadt Zürich',
    description: 'Günstige Spielgruppen für Kinder zwischen 2 und 5 Jahren. Förderung der Entwicklung und Begegnung mit anderen Familien.',
    cost: 'reduced',
    costNote: 'Einkommensabhängige Tarife — ab CHF 0 möglich',
    location: 'Verschiedene Quartiere in Zürich',
    website: 'https://www.stadt-zuerich.ch/ssd/de/index/volksschule/kindergarten/spielgruppe.html',
    highlight: false,
  },
  {
    id: 'kinderbuecherei',
    category: 'family',
    title: 'Kinderbüchereien der Stadt Zürich',
    description: 'Kostenlose Bibliotheken für Kinder — Bücher in vielen Sprachen, Vorlesenachmittage und Veranstaltungen.',
    cost: 'free',
    location: 'Verschiedene Standorte in Zürich',
    website: 'https://www.bibliotheken-zuerich.ch',
    highlight: true,
  },

  // Beratung & Unterstützung
  {
    id: 'dargebotene-hand',
    category: 'support',
    title: 'Die Dargebotene Hand — Tel 143',
    description: 'Kostenlose telefonische Krisenberatung, rund um die Uhr erreichbar. Vertraulich und auf Wunsch anonym.',
    cost: 'free',
    location: 'Telefonisch (kostenlos)',
    phone: '143',
    website: 'https://www.143.ch',
    schedule: '24 Stunden täglich, 365 Tage im Jahr',
    highlight: false,
  },
  {
    id: 'caritas-beratung',
    category: 'support',
    title: 'Caritas Zürich — Sozialberatung',
    description: 'Beratung zu Sozialversicherungen, Finanzen, Wohnen und Alltag. Kostenlos für Menschen in schwierigen Situationen.',
    cost: 'free',
    location: 'Zürich',
    website: 'https://www.caritas-zurich.ch',
    phone: '044 366 66 66',
    schedule: 'Mo–Fr nach Vereinbarung',
    highlight: false,
  },
  {
    id: 'psychologische-beratung',
    category: 'support',
    title: 'AOZ Psychologische Beratung',
    description: 'Vertrauliche Beratung für Bewohnerinnen und Bewohner bei psychischen Belastungen. Wende dich an dein Betreuungsteam.',
    cost: 'free',
    location: 'Über die AOZ-Betreuung anfragen',
    phone: '044 415 66 66',
    website: 'https://www.aoz.ch',
    highlight: false,
  },
]
