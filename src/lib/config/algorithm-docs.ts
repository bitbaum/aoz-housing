/**
 * Algorithm Documentation Configuration
 *
 * SSOT for algorithm explanations, scientific basis, and data collection methods.
 * This drives the algorithm explanation page content.
 */

// =============================================================================
// SCIENTIFIC RESEARCH SOURCES
// =============================================================================

export type EvidenceStrength = 'strong' | 'moderate' | 'preliminary'

export interface ResearchSource {
  id: string
  title: string
  authors?: string
  year?: number
  publication?: string
  url?: string
  region: 'CH' | 'DE' | 'INT' // Switzerland, Germany, International
  keyFindings: string[]
  evidenceStrength: EvidenceStrength
}

export const RESEARCH_SOURCES: ResearchSource[] = [
  // ─── Swiss Research (Priority) ───────────────────────────────────────────
  {
    id: 'bfh-mieterkonflikte',
    title: 'Ursachen und Verläufe von Mieterkonflikten',
    publication: 'Berner Fachhochschule, Soziale Arbeit',
    region: 'CH',
    url: 'https://www.bfh.ch',
    keyFindings: [
      'Identifiziert Hauptursachen für Mieterkonflikte in Schweizer Wohnprojekten',
      'Empfiehlt präventive Massnahmen bei der Zusammensetzung von Wohngruppen',
      'Kommunikation als "zentraler Faktor" für erfolgreiches Zusammenleben',
    ],
    evidenceStrength: 'strong',
  },
  {
    id: 'brunnenhof-zuerich',
    title: 'Konfliktprävention in der Siedlung Brunnenhof Zürich',
    publication: 'Domicil Wohnen / BFH Soziale Arbeit',
    year: 2010,
    region: 'CH',
    url: 'https://domicilwohnen.ch/application/files/5015/6656/3112/Konfliktpraevention_in_der_Siedlung_Brunnenhof_Zuerich_01032010.pdf',
    keyFindings: [
      'Entwicklung des Wohnmodells "die Welt im Brunnenhof"',
      'Projekt zur Konfliktprävention und Integrationsförderung',
      'Finanziert durch Bundesamt für Wohnungswesen',
      'Nächtlicher Lärm als häufigster Beschwerdegrund',
    ],
    evidenceStrength: 'moderate',
  },
  {
    id: 'bfh-hslu-wohnen-2024',
    title: 'Wohnen statt Unterbringung: Private Unterbringung von Geflüchteten',
    publication: 'BFH / HSLU Soziale Arbeit',
    year: 2024,
    region: 'CH',
    keyFindings: [
      "Grösste Schweizer Studie: 1'000 Gastfamilien + 24 Tiefeninterviews",
      'Professionelles Matching reduziert Konflikte signifikant',
      'Ausreichende persönliche Rückzugsräume als "kritisch" identifiziert',
      'Nicht übereinstimmende Erwartungen sind der #1 Grund für Scheitern',
      'Kommunikation über Bedürfnisse muss VOR Platzierung stattfinden',
    ],
    evidenceStrength: 'strong',
  },
  {
    id: 'nccr-migration',
    title: 'Chancen und Herausforderungen der privaten Unterbringung von Geflüchteten',
    publication: 'nccr – on the move (Nationales Forschungszentrum Migration)',
    year: 2024,
    region: 'CH',
    keyFindings: [
      'Matching-Kriterien für Geflüchteten-Platzierungen evaluiert',
      'Lebensstil-Kompatibilität als Schlüsselfaktor bestätigt',
      'Empfiehlt strukturierte Matching-Prozesse statt Ad-hoc-Platzierungen',
    ],
    evidenceStrength: 'moderate',
  },

  // ─── German Research ─────────────────────────────────────────────────────
  {
    id: 'wuppertal-gemeinschaftswohnen',
    title: 'Analyse Gemeinschaftswohnen',
    publication: 'Wuppertal Institut',
    year: 2022,
    region: 'DE',
    url: 'https://wupperinst.org/fa/redaktion/downloads/projects/OptiWohn_Analyse_Gemeinschaftswohnen.pdf',
    keyFindings: [
      'Soziale Konflikte entstehen aus Verhaltensunterschieden, nicht nur ökonomischen Faktoren',
      'Rauchen als "nicht-verhandelbarer Faktor mit hohem Eskalationspotenzial"',
      'Bewusstes Konfliktmanagement reduziert Spannungen',
      'Probezeiträume für neue Mitbewohner ermöglichen gegenseitiges Kennenlernen',
    ],
    evidenceStrength: 'moderate',
  },
  {
    id: 'gdw-nachbarschaften',
    title: 'Überforderte Nachbarschaften',
    publication: 'GdW Bundesverband deutscher Wohnungs- und Immobilienunternehmen',
    region: 'DE',
    url: 'https://www.gdw.de/media/2019/11/m10c_3_3_2_gdw-schriften-48-ueberforderte-nachbarschaften.pdf',
    keyFindings: [
      'Zwei sozialwissenschaftliche Studien zu Nachbarschaftskonflikten',
      'Etablierte Gruppen vs. Neuankömmlinge als Konfliktdynamik',
      'Lärm in Top-5 der Konflikttreiber',
    ],
    evidenceStrength: 'moderate',
  },

  // ─── International Research ──────────────────────────────────────────────
  {
    id: 'pmc-sleep-intervention',
    title: 'Dormitory Environment and Roommate Intervention for Sleep Quality',
    publication: 'PMC / BMC Public Health',
    year: 2022,
    region: 'INT',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9691206/',
    keyFindings: [
      'Signifikanter Zusammenhang zwischen Mitbewohner-Verhalten und Schlafqualität',
      'Schlafregeln und Augenmasken als effektive Interventionen',
      "Cluster-randomisierte kontrollierte Studie (n=3'098)",
    ],
    evidenceStrength: 'strong',
  },
  {
    id: 'pmc-sleep-conflict',
    title: 'Sleep Deprivation and Interpersonal Conflict',
    publication: 'PMC / Sleep Medicine',
    year: 2022,
    region: 'INT',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9249692/',
    keyFindings: [
      'Schlafentzug erhöht Cortisol um 72% bei Konflikten (βz=0.72)',
      'Positive Affekte um 129% reduziert (βz=-1.29)',
      'Schlafentzug als #1 umweltbedingter Konfliktauslöser',
      'Verminderte Fähigkeit zur konstruktiven Konfliktlösung',
    ],
    evidenceStrength: 'strong',
  },
  {
    id: 'sciencedaily-cleaning',
    title: 'Cleaning Conflict in Shared Living',
    publication: 'Kansas State University / Arizona State University',
    year: 2012,
    region: 'INT',
    url: 'https://www.sciencedaily.com/releases/2012/07/120724114707.htm',
    keyFindings: [
      'Unterschiedliche Sauberkeitsstandards führen zu negativen Zuschreibungen',
      'Menschen mit anderer Toleranz sind nicht "faul" – Standards unterscheiden sich',
      'Haushaltsaufteilung beeinflusst Beziehungszufriedenheit signifikant',
    ],
    evidenceStrength: 'strong',
  },
  {
    id: 'researchgate-matching',
    title: 'Personality-Based Roommate Matching Systems: A Systematic Review',
    publication: 'ResearchGate',
    year: 2024,
    region: 'INT',
    url: 'https://www.researchgate.net/publication/385378643',
    keyFindings: [
      'Persönlichkeitsbasierte Systeme übertreffen traditionelle Methoden signifikant',
      'Extraversion und Gewissenhaftigkeit korrelieren mit besseren Ergebnissen',
      'Bis zu 25% der Studierenden berichten von schweren Mitbewohner-Konflikten',
    ],
    evidenceStrength: 'strong',
  },
  {
    id: 'pmc-cultural-conflict',
    title: 'Cultural Modes of Conflict Resolution and Roommate Satisfaction',
    publication: 'PMC / Journal of Cross-Cultural Psychology',
    year: 2024,
    region: 'INT',
    keyFindings: [
      'Kulturelle Konfliktlösungsstile beeinflussen Mitbewohner-Zufriedenheit',
      'Kooperative Strategien führen zu höherer Zufriedenheit und Zugehörigkeitsgefühl',
      'Vermeidende Stile in Kombination mit direkten Stilen erhöhen Frustration',
    ],
    evidenceStrength: 'moderate',
  },
  {
    id: 'sciencedirect-crossnational',
    title: 'Satisfaction in Cross-National Roommate Relationships',
    publication: 'ScienceDirect / Journal of Social and Personal Relationships',
    year: 2023,
    region: 'INT',
    keyFindings: [
      'Ähnlichkeit in Werten prädiktiver als Ähnlichkeit in Gewohnheiten',
      'Gemeinsame Sprache als Grundvoraussetzung für Zufriedenheit',
      'Kulturübergreifende Wohngemeinschaften profitieren von expliziter Kommunikation',
    ],
    evidenceStrength: 'moderate',
  },
  {
    id: 'ijip-bigfive-roommates',
    title: 'Effect Size of Big Five on Roommate Satisfaction',
    publication: 'International Journal of Indian Psychology (IJIP)',
    year: 2023,
    region: 'INT',
    keyFindings: [
      'Verträglichkeit hat "grossen" Effekt auf Mitbewohner-Zufriedenheit',
      'Gewissenhaftigkeit und Offenheit ebenfalls mit "grossen" Effektstärken',
      'Hohe Verträglichkeit → konstruktive Taktiken; niedrige → konfrontative Taktiken',
      'Neurotizismus als negativer Prädiktor für Wohnzufriedenheit',
    ],
    evidenceStrength: 'moderate',
  },
  {
    id: 'jphsc-negative-roommates',
    title: 'Negative Roommate Relationships and Health/Wellbeing',
    publication: 'Journal of Postsecondary Health Sciences and Counseling (JPHSC)',
    year: 2024,
    region: 'INT',
    keyFindings: [
      'Negative Mitbewohner-Beziehungen verursachen Angst, Schlafstörungen, Ernährungsänderungen',
      'Betroffene entwickeln Vermeidungsverhalten in eigener Wohnung',
      'Gesundheitsbeeinträchtigung auch bei moderaten Konflikten nachweisbar',
    ],
    evidenceStrength: 'moderate',
  },
  {
    id: 'national-roommate-survey',
    title: "National Student Roommate Conflict Survey (31'500 Studierende)",
    publication: 'National Student Housing Survey',
    region: 'INT',
    keyFindings: [
      '47.9% berichten von häufigen/gelegentlichen Mitbewohner-Konflikten',
      '50.1% der Frauen vs. 44.1% der Männer betroffen',
      'Besucher/Gäste konsistent unter Top-5 Beschwerden',
      '"Menschen mitbringen, bei denen man sich unwohl fühlt" als häufiger Grund',
    ],
    evidenceStrength: 'strong',
  },
]

// =============================================================================
// FACTOR SCIENTIFIC BASIS
// =============================================================================

export interface FactorScientificBasis {
  factorId: string
  whyItMatters: string
  researchFindings: string[]
  sourceIds: string[] // References to RESEARCH_SOURCES
  dataCollectionMethod: string
  swissContext?: string // Specific relevance for Swiss asylum context
  evidenceStrength: EvidenceStrength
  evidenceNote: string // Brief explanation of evidence quality
}

export const FACTOR_SCIENCE: Record<string, FactorScientificBasis> = {
  sleepSchedule: {
    factorId: 'sleepSchedule',
    whyItMatters:
      'Unterschiedliche Schlafzeiten sind einer der häufigsten Konfliktauslöser. Wenn eine Person früh schlafen möchte während die andere aktiv ist, entstehen chronische Störungen.',
    researchFindings: [
      'Schlafentzug erhöht Cortisol um 72% während Konflikten (βz=0.72) und reduziert positive Affekte um 129% (βz=-1.29)',
      'Störungen nach dem Schlafengehen sind der #1 Grund für Schlafmangel in geteilten Zimmern',
      "Mitbewohner-Verhalten hat signifikanten Einfluss auf Schlafqualität (cluster-randomisierte Studie, n=3'098)",
    ],
    sourceIds: ['pmc-sleep-intervention', 'pmc-sleep-conflict'],
    dataCollectionMethod:
      'Selbstauskunft bei der Aufnahme: "Wann gehen Sie normalerweise schlafen?" mit Optionen für Frühaufsteher, Normal, Nachtmensch, Unregelmässig.',
    swissContext:
      'Wichtig für Asylunterkünfte mit geteilten Zimmern. Schichtarbeiter (z.B. in Reinigung) haben oft unregelmässige Zeiten.',
    evidenceStrength: 'strong',
    evidenceNote:
      'Experimentelle Evidenz: RCT-Studien belegen kausalen Zusammenhang zwischen Schlaf und Konfliktverhalten.',
  },

  cleanlinessPractice: {
    factorId: 'cleanlinessPractice',
    whyItMatters:
      'Unterschiedliche Sauberkeitsvorstellungen gehören zu den am häufigsten genannten Konfliktursachen. Was für eine Person akzeptabel ist, kann für eine andere störend sein.',
    researchFindings: [
      'Unterschiedliche Sauberkeitsstandards führen zu negativen Zuschreibungen und Beziehungsproblemen (Kansas State/ASU)',
      '#1-2 meistgenannter Konfliktauslöser über alle Studien hinweg',
      'Extreme Fälle führen zu Schimmel, Maden und Gesundheitsrisiken (JPHSC)',
    ],
    sourceIds: [
      'sciencedaily-cleaning',
      'wuppertal-gemeinschaftswohnen',
      'jphsc-negative-roommates',
    ],
    dataCollectionMethod:
      'Skala 1-5 bei der Aufnahme: "Wie wichtig ist Ihnen Ordnung und Sauberkeit?" von Entspannt bis Sehr ordentlich.',
    swissContext:
      'Schweizer Recycling-System (Glas, PET, Alu, Papier) erfordert besonderes Wissen. Wir erfassen auch Recycling-Erfahrung separat.',
    evidenceStrength: 'strong',
    evidenceNote:
      "Konsistente Ergebnisse über mehrere Studien und Kulturkreise. Survey-Daten von >31'500 Teilnehmenden.",
  },

  noiseTolerance: {
    factorId: 'noiseTolerance',
    whyItMatters:
      'Die Toleranz für Geräusche variiert stark. Unterschiede in der Lärmsensibilität können zu ständigen Spannungen führen.',
    researchFindings: [
      'Lärmbelästigung in Top-5 Konfliktursachen in Wohngemeinschaften',
      'Nächtlicher Lärm besonders schädlich (Brunnenhof Zürich)',
      'Wiederholte Lärmbelastung verursacht chronischen Stress (ScienceDirect)',
      'Betroffene entwickeln Vermeidungsverhalten und Konzentrationsprobleme',
    ],
    sourceIds: ['brunnenhof-zuerich', 'gdw-nachbarschaften', 'jphsc-negative-roommates'],
    dataCollectionMethod:
      'Skala 1-5: "Wie empfindlich sind Sie gegenüber Geräuschen?" von Sehr empfindlich bis Sehr tolerant.',
    evidenceStrength: 'moderate',
    evidenceNote:
      'Mehrere Beobachtungsstudien und Umfragen. Keine experimentelle Evidenz, aber konsistente Muster.',
  },

  guestTolerance: {
    factorId: 'guestTolerance',
    whyItMatters:
      'Unterschiedliche Einstellungen zu Besuchern sind ein häufiger Konfliktauslöser. Manche Klient*innen schätzen Ruhe und Privatsphäre, andere empfangen gerne Gäste.',
    researchFindings: [
      "Top-5 Konfliktauslöser in nationaler Umfrage (31'500 Studierende)",
      '~48% berichten von häufigen/gelegentlichen Konflikten, Besucher als häufiger Grund',
      '"Menschen mitbringen, bei denen man sich unwohl fühlt" als typische Beschwerde',
    ],
    sourceIds: ['national-roommate-survey', 'jphsc-negative-roommates'],
    dataCollectionMethod:
      'Skala 1-5: "Wie stehen Sie zu Besuchern in der Wohnung?" von Lieber keine Besucher bis Besucher willkommen.',
    swissContext:
      'In Asylunterkünften können Besuche durch externe Personen Sicherheitsbedenken auslösen. Klare Besucherregeln sind wichtig.',
    evidenceStrength: 'moderate',
    evidenceNote:
      "Konsistente Umfrageergebnisse. Grosse Stichprobe (31'500), aber primär aus studentischem Kontext.",
  },

  languages: {
    factorId: 'languages',
    whyItMatters:
      'Kommunikation ist fundamental für Konfliktlösung. Ohne gemeinsame Sprache können selbst kleine Missverständnisse eskalieren.',
    researchFindings: [
      'BFH: Kommunikation als "zentraler Faktor" für erfolgreiches Zusammenleben',
      'BFH-HSLU 2024: Kommunikation über Bedürfnisse muss vor Platzierung stattfinden',
      'Gemeinsame Sprache als Grundvoraussetzung für Zufriedenheit in internationalen Wohngruppen (ScienceDirect)',
    ],
    sourceIds: ['bfh-mieterkonflikte', 'bfh-hslu-wohnen-2024', 'sciencedirect-crossnational'],
    dataCollectionMethod:
      'Mehrfachauswahl: "Welche Sprachen sprechen Sie?" mit Optionen für DE, EN, FR, AR, FA, TR, TI, UK, RU, PS, Andere.',
    swissContext:
      'Deutsch oder Englisch als Lingua Franca wichtig. Wir priorisieren Überlappung bei mindestens einer Sprache.',
    evidenceStrength: 'strong',
    evidenceNote:
      "Mehrere Schweizer und internationale Studien bestätigen. BFH-HSLU mit 1'000 Gastfamilien besonders relevant.",
  },

  socialStyle: {
    factorId: 'socialStyle',
    whyItMatters:
      'Introvertierte brauchen Rückzugszeit, Extrovertierte suchen Interaktion. Extreme Unterschiede können zu Frustration auf beiden Seiten führen.',
    researchFindings: [
      'Big Five: Verträglichkeit und Gewissenhaftigkeit haben "grossen" Effekt auf Mitbewohner-Zufriedenheit (IJIP)',
      'Extraversion-Korrelation bestätigt (ResearchGate Systematic Review)',
      '64% der Menschen bevorzugen Mitbewohner, mit denen sie auch sozial Zeit verbringen können',
    ],
    sourceIds: ['researchgate-matching', 'ijip-bigfive-roommates'],
    dataCollectionMethod:
      'Einfachauswahl: "Wie viel Kontakt mit Mitbewohnern wünschen Sie?" mit Optionen Introvertiert, Ausgeglichen, Extrovertiert.',
    evidenceStrength: 'moderate',
    evidenceNote:
      'Big Five-Forschung belegt Zusammenhang. Operationalisierung als 3-Punkte-Skala verliert Differenzierungsfähigkeit.',
  },

  privacyNeed: {
    factorId: 'privacyNeed',
    whyItMatters:
      'Menschen haben unterschiedliche Bedürfnisse nach persönlichem Raum. Wenn Grenzen nicht respektiert werden, entsteht erheblicher Stress.',
    researchFindings: [
      'BFH-HSLU 2024: "Ausreichende persönliche Rückzugsräume erweisen sich als kritisch"',
      'Besonders wichtig für traumatisierte Personen (BFH Trauma-Forschung)',
      '"Privatsphäre ermöglichen und respektieren" als Schlüsselfaktor',
    ],
    sourceIds: ['bfh-hslu-wohnen-2024', 'gdw-nachbarschaften'],
    dataCollectionMethod:
      'Skala 1-5: "Wie viel Rückzugsort benötigen Sie?" von Offen bis Viel Privatsphäre.',
    swissContext:
      'Für Asylsuchende mit Flucht-Trauma oft besonders wichtig. BFH-HSLU bestätigt: Privatheit ist kritisch für geflüchtete Familien.',
    evidenceStrength: 'strong',
    evidenceNote:
      "BFH-HSLU 2024 (1'000 Familien) liefert starke Schweizer Evidenz. Durch internationale Studien bestätigt.",
  },

  conflictStyle: {
    factorId: 'conflictStyle',
    whyItMatters:
      'Wie Menschen mit Meinungsverschiedenheiten umgehen, bestimmt, ob Konflikte eskalieren oder gelöst werden. Unvereinbare Stile (vermeidend + direkt) führen zu Frustration.',
    researchFindings: [
      'IJIP: Verträglichkeit hat "grossen" Effekt – hohe Verträglichkeit → konstruktive Taktiken, niedrige → konfrontative',
      'PMC 2024: Kulturelle Konfliktlösungsstile beeinflussen Zufriedenheit und Zugehörigkeitsgefühl',
      'Kooperative Strategien konsistent mit höherer Mitbewohner-Zufriedenheit assoziiert',
    ],
    sourceIds: ['ijip-bigfive-roommates', 'pmc-cultural-conflict'],
    dataCollectionMethod:
      'Einfachauswahl: "Wie gehen Sie mit Meinungsverschiedenheiten um?" mit Optionen Vermeidend, Kooperativ, Direkt.',
    swissContext:
      'Bei kulturell diversen Wohngruppen besonders relevant. Verschiedene Kulturen haben unterschiedliche Konfliktlösungsmodi.',
    evidenceStrength: 'moderate',
    evidenceNote:
      'Gut dokumentierte Zusammenhänge in Big Five-Forschung und kulturvergleichenden Studien. 3-Punkte-Skala ist Vereinfachung.',
  },

  smokingStatus: {
    factorId: 'smokingStatus',
    whyItMatters:
      'Rauchen in Innenräumen ist für viele inakzeptabel. Dies ist ein nicht-verhandelbarer Faktor mit hohem Eskalationspotenzial.',
    researchFindings: [
      'Wuppertal Institut: "Nicht-verhandelbarer Faktor mit hohem Eskalationspotenzial"',
      'Gesundheitsrisiken von Passivrauchen machen dies zu einem kritischen Faktor',
      'Best Practices empfehlen grundsätzliche Trennung von Rauchern und Nichtrauchern',
    ],
    sourceIds: ['wuppertal-gemeinschaftswohnen'],
    dataCollectionMethod:
      'Einfachauswahl: Nichtraucher / Raucht nur draussen / Raucht auch drinnen.',
    swissContext:
      'In Schweizer Unterkünften oft Rauchverbot in Innenräumen. Gesetzliches Indoor-Rauchverbot in den meisten Kantonen.',
    evidenceStrength: 'strong',
    evidenceNote:
      'Nicht-verhandelbar per Gesundheitsrecht und Hausordnung. Starker Expertenkonsens trotz weniger formaler Studien.',
  },

  choresContribution: {
    factorId: 'choresContribution',
    whyItMatters:
      'Unterschiedliche Vorstellungen von Haushaltsaufgaben sind eine häufige Konfliktquelle. Wer macht was, wie oft?',
    researchFindings: [
      'Kansas State/ASU: Haushaltsaufteilung beeinflusst Beziehungszufriedenheit signifikant',
      'Wahrgenommene Ungerechtigkeit bei Hausarbeit führt zu Groll und Resentiment',
      'Ähnliche Erwartungen reduzieren Reibung',
    ],
    sourceIds: ['sciencedaily-cleaning'],
    dataCollectionMethod:
      'Skala 1-5: "Wie aktiv beteiligen Sie sich an gemeinsamen Aufgaben?" von Wenig aktiv bis Sehr aktiv.',
    swissContext:
      'Schweizer Recycling-System erfordert aktive Beteiligung. Kombiniert mit Recycling-Wissens-Erfassung.',
    evidenceStrength: 'moderate',
    evidenceNote:
      'Survey-basierte Evidenz. Konsistente Ergebnisse aber weniger spezifisch als bei Sleep/Cleanliness.',
  },

  roomSharingStatus: {
    factorId: 'roomSharingStatus',
    whyItMatters:
      'Manche Menschen können kein Zimmer teilen (Trauma, PTSD, medizinische Gründe). Dies ist eine harte Anforderung.',
    researchFindings: [
      'Brunnenhof Zürich: Erzwungene Zimmerteilung kann bei vulnerablen Personen zu Krisen führen',
      'BFH Trauma-Forschung: Privater Raum als psychologische Notwendigkeit für Betroffene',
    ],
    sourceIds: ['brunnenhof-zuerich', 'bfh-hslu-wohnen-2024'],
    dataCollectionMethod:
      'Einfachauswahl: Kann teilen / Bevorzugt Einzelzimmer / Benötigt Einzelzimmer (medizinisch/psychologisch).',
    swissContext:
      'NEEDS_PRIVATE wird als harte Anforderung behandelt – System blockiert Platzierung wenn nicht erfüllbar.',
    evidenceStrength: 'strong',
    evidenceNote:
      'Schweizer Studien und klinische Evidenz. BFH-HSLU bestätigt Kritikalität für Geflüchtete.',
  },
}

// =============================================================================
// COMPATIBILITY RULES DOCUMENTATION
// =============================================================================

export interface RuleDocumentation {
  rule: string
  name: string
  description: string
  example: string
  scoringLogic: string
}

export const RULE_DOCUMENTATION: RuleDocumentation[] = [
  {
    rule: 'SAME_IS_BETTER',
    name: 'Gleich ist besser',
    description: 'Identische Werte ergeben den höchsten Score. Unterschiede reduzieren den Score.',
    example: 'Zwei Frühaufsteher: 100 Punkte. Frühaufsteher + Nachtmensch: 30 Punkte.',
    scoringLogic: 'Gleich = 100, Benachbart = 70, Gegensätzlich = 30',
  },
  {
    rule: 'SIMILAR_IS_BETTER',
    name: 'Ähnlich ist besser',
    description: 'Je näher die Werte auf der Skala, desto höher der Score.',
    example: 'Sauberkeit 4 + 4 = 100 Punkte. Sauberkeit 1 + 5 = 20 Punkte.',
    scoringLogic: 'Differenz 0 = 100, pro Stufe -20 Punkte. Bei 3+ Stufen: Blockierung möglich.',
  },
  {
    rule: 'OVERLAP_IS_BETTER',
    name: 'Überlappung ist besser',
    description: 'Mehr gemeinsame Elemente ergeben einen höheren Score.',
    example: 'Beide sprechen DE + EN: 100 Punkte. Keine gemeinsame Sprache: 25 Punkte.',
    scoringLogic: '2+ gemeinsame = 100, 1 gemeinsame = 75, Keine = 25 (+ Risiko-Warnung)',
  },
  {
    rule: 'MUST_HAVE',
    name: 'Muss vorhanden sein',
    description: 'Eine harte Anforderung - wenn nicht erfüllt, wird Platzierung blockiert.',
    example: 'Benötigt Rollstuhlzugang → Wohnung muss rollstuhlgerecht sein.',
    scoringLogic: 'Erfüllt = normal weiter, Nicht erfüllt = BLOCKIERT',
  },
  {
    rule: 'MUST_ALLOW',
    name: 'Muss erlaubt sein',
    description: 'Die Unterkunft muss das Verhalten/Bedürfnis erlauben.',
    example: 'Person raucht draussen → Wohnung muss Rauchen erlauben.',
    scoringLogic: 'Erlaubt = normal weiter, Nicht erlaubt = BLOCKIERT oder starke Reduktion',
  },
]

// =============================================================================
// ALGORITHM VERSION HISTORY
// =============================================================================

export interface AlgorithmVersion {
  version: string
  date: string
  changes: string[]
}

export const ALGORITHM_VERSIONS: AlgorithmVersion[] = [
  {
    version: '2.0',
    date: '2026-02-10',
    changes: [
      'Lifestyle-Gewicht erhöht (30% → 35%) basierend auf Schlaf/Sauberkeits-Evidenz',
      'Practical-Gewicht reduziert (25% → 20%) – weniger Konfliktevidenz für sekundäre Faktoren',
      'Neuer Faktor: Besuchertoleranz (Lifestyle, 10%) – Top-5 Konfliktauslöser',
      'Neuer Faktor: Konfliktlösungsstil (Sozial, 10%) – Big Five Verträglichkeits-Evidenz',
      'Privatsphäre-Gewicht erhöht (25% → 30%) basierend auf BFH-HSLU 2024',
      '7 neue Forschungsquellen hinzugefügt (inkl. BFH-HSLU 2024, nccr-on the move)',
      'Evidenzstärke-Bewertung für alle Faktoren eingeführt',
    ],
  },
  {
    version: '1.0',
    date: '2025-12-01',
    changes: [
      'Initiale Version mit 4 Dimensionen und 22 Faktoren',
      'Gewichtung basierend auf Schweizer und internationaler Wohnforschung',
      '8 Forschungsquellen (3 CH, 2 DE, 3 INT)',
    ],
  },
]

// =============================================================================
// EVIDENCE STRENGTH LABELS
// =============================================================================

export const EVIDENCE_STRENGTH_CONFIG: Record<
  EvidenceStrength,
  {
    label: string
    color: string
    description: string
  }
> = {
  strong: {
    label: 'Stark',
    color: 'green',
    description:
      'Mehrere Studien, experimentelle oder grosse Umfrage-Evidenz, Schweizer Bestätigung',
  },
  moderate: {
    label: 'Moderat',
    color: 'yellow',
    description: 'Konsistente Umfrageergebnisse, Beobachtungsstudien, Expertenkonsens',
  },
  preliminary: {
    label: 'Vorläufig',
    color: 'gray',
    description: 'Einzelstudie, indirekte Evidenz oder Expertenmeinung',
  },
}

// =============================================================================
// RESEARCH METHODOLOGY
// =============================================================================

export const RESEARCH_METHODOLOGY = [
  {
    type: 'Experimentell',
    strength: 'strong' as EvidenceStrength,
    description: 'Randomisierte kontrollierte Studien (RCT) mit kausaler Aussagekraft',
    example: 'PMC Schlafentzug-Studie: Cortisol-Messung unter kontrollierten Bedingungen',
  },
  {
    type: 'Grosse Umfrage',
    strength: 'strong' as EvidenceStrength,
    description: "Studien mit 1'000+ Teilnehmenden und systematischer Methodik",
    example: "BFH-HSLU 2024: 1'000 Gastfamilien + 24 Tiefeninterviews",
  },
  {
    type: 'Beobachtungsstudie',
    strength: 'moderate' as EvidenceStrength,
    description: 'Fallstudien, qualitative Forschung, Praxisberichte',
    example: 'Brunnenhof Zürich: Konfliktprävention in Wohnsiedlung',
  },
  {
    type: 'Expertenkonsens',
    strength: 'preliminary' as EvidenceStrength,
    description: 'Professionelle Einschätzung basierend auf Praxiserfahrung',
    example: 'Recycling-Faktor: Basierend auf Erfahrung Schweizer Wohnprojekte',
  },
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getSourceById(id: string): ResearchSource | undefined {
  return RESEARCH_SOURCES.find((s) => s.id === id)
}

export function getSourcesByRegion(region: 'CH' | 'DE' | 'INT'): ResearchSource[] {
  return RESEARCH_SOURCES.filter((s) => s.region === region)
}

export function getFactorScience(factorId: string): FactorScientificBasis | undefined {
  return FACTOR_SCIENCE[factorId]
}
