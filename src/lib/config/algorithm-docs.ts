/**
 * Algorithm Documentation Configuration
 *
 * SSOT for algorithm explanations, scientific basis, and data collection methods.
 * This drives the algorithm explanation page content.
 */

// =============================================================================
// SCIENTIFIC RESEARCH SOURCES
// =============================================================================

export interface ResearchSource {
  id: string
  title: string
  authors?: string
  year?: number
  publication?: string
  url?: string
  region: 'CH' | 'DE' | 'INT' // Switzerland, Germany, International
  keyFindings: string[]
}

export const RESEARCH_SOURCES: ResearchSource[] = [
  {
    id: 'bfh-mieterkonflikte',
    title: 'Ursachen und Verläufe von Mieterkonflikten',
    publication: 'Berner Fachhochschule, Soziale Arbeit',
    region: 'CH',
    url: 'https://www.bfh.ch',
    keyFindings: [
      'Identifiziert Hauptursachen für Mieterkonflikte in Schweizer Wohnprojekten',
      'Empfiehlt präventive Massnahmen bei der Zusammensetzung von Wohngruppen',
    ],
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
    ],
  },
  {
    id: 'wuppertal-gemeinschaftswohnen',
    title: 'Analyse Gemeinschaftswohnen',
    publication: 'Wuppertal Institut',
    year: 2022,
    region: 'DE',
    url: 'https://wupperinst.org/fa/redaktion/downloads/projects/OptiWohn_Analyse_Gemeinschaftswohnen.pdf',
    keyFindings: [
      'Soziale Konflikte entstehen aus Verhaltensunterschieden, nicht nur ökonomischen Faktoren',
      'Bewusstes Konfliktmanagement reduziert Spannungen',
      'Probezeiträume für neue Mitbewohner ermöglichen gegenseitiges Kennenlernen',
    ],
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
    ],
  },
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
      'Cluster-randomisierte kontrollierte Studie aus China',
    ],
  },
  {
    id: 'pmc-sleep-conflict',
    title: 'Sleep Deprivation and Interpersonal Conflict',
    publication: 'PMC / Sleep Medicine',
    year: 2022,
    region: 'INT',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9249692/',
    keyFindings: [
      'Schlafentzug korreliert mit mehr Konflikten am folgenden Tag',
      'Schlechter Schlaf reduziert positive Emotionen',
      'Verminderte Fähigkeit zur konstruktiven Konfliktlösung',
    ],
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
      'Menschen mit anderer Toleranz sind nicht "faul" - Standards unterscheiden sich',
      'Haushaltsaufteilung beeinflusst Beziehungszufriedenheit',
    ],
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
}

export const FACTOR_SCIENCE: Record<string, FactorScientificBasis> = {
  sleepSchedule: {
    factorId: 'sleepSchedule',
    whyItMatters:
      'Unterschiedliche Schlafzeiten sind einer der häufigsten Konfliktauslöser. Wenn eine Person früh schlafen möchte während die andere aktiv ist, entstehen chronische Störungen.',
    researchFindings: [
      'Störungen nach dem Schlafengehen sind der #1 Grund für Schlafmangel in geteilten Zimmern (Psychology Reports, 2013)',
      'Schlafentzug führt zu mehr Konflikten und reduzierter Konfliktlösungsfähigkeit am folgenden Tag',
      'Mitbewohner-Verhalten hat signifikanten Einfluss auf Schlafqualität in geteilten Räumen',
    ],
    sourceIds: ['pmc-sleep-intervention', 'pmc-sleep-conflict'],
    dataCollectionMethod:
      'Selbstauskunft bei der Aufnahme: "Wann gehen Sie normalerweise schlafen?" mit Optionen für Frühaufsteher, Normal, Nachtmensch, Unregelmässig.',
    swissContext:
      'Wichtig für Asylunterkünfte mit geteilten Zimmern. Schichtarbeiter (z.B. in Reinigung) haben oft unregelmässige Zeiten.',
  },

  cleanlinessLevel: {
    factorId: 'cleanlinessLevel',
    whyItMatters:
      'Unterschiedliche Sauberkeitsvorstellungen gehören zu den am häufigsten genannten Konfliktursachen. Was für eine Person akzeptabel ist, kann für eine andere störend sein.',
    researchFindings: [
      'Unterschiedliche Sauberkeitsstandards führen zu negativen Zuschreibungen und Beziehungsproblemen',
      'Menschen mit anderer Toleranz sind nicht "faul" - aber unterschiedliche Standards führen zu Missverständnissen',
      'Sauberkeit ist eine der Hauptursachen für moderaten bis schweren Mitbewohner-Stress',
    ],
    sourceIds: ['sciencedaily-cleaning', 'wuppertal-gemeinschaftswohnen'],
    dataCollectionMethod:
      'Skala 1-5 bei der Aufnahme: "Wie wichtig ist Ihnen Ordnung und Sauberkeit?" von Entspannt bis Sehr ordentlich.',
    swissContext:
      'Schweizer Recycling-System (Glas, PET, Alu, Papier) erfordert besonderes Wissen. Wir erfassen auch Recycling-Erfahrung separat.',
  },

  noiseTolerance: {
    factorId: 'noiseTolerance',
    whyItMatters:
      'Die Toleranz für Geräusche variiert stark. Unterschiede in der Lärmsensibilität können zu ständigen Spannungen führen.',
    researchFindings: [
      'Lärmbelästigung gehört zu den Top-5 Konfliktursachen in Wohngemeinschaften',
      'Wiederkehrende Lärmkonflikte sagen Stressniveau vorher und beeinträchtigen Gesamtzufriedenheit',
      'Betroffene entwickeln häufig Vermeidungsverhalten und Konzentrationsprobleme',
    ],
    sourceIds: ['brunnenhof-zuerich', 'gdw-nachbarschaften'],
    dataCollectionMethod:
      'Skala 1-5: "Wie empfindlich sind Sie gegenüber Geräuschen?" von Sehr empfindlich bis Sehr tolerant.',
  },

  languages: {
    factorId: 'languages',
    whyItMatters:
      'Kommunikation ist fundamental für Konfliktlösung. Ohne gemeinsame Sprache können selbst kleine Missverständnisse eskalieren.',
    researchFindings: [
      'Kommunikation ist kritischer Faktor für erfolgreiche Wohngemeinschaften',
      'Fehlende Kommunikationsmöglichkeiten führen zu Isolation und erhöhtem Konfliktpotenzial',
      'Mindestens eine gemeinsame Sprache ist für effektive Konfliktbewältigung nötig',
    ],
    sourceIds: ['researchgate-matching', 'brunnenhof-zuerich'],
    dataCollectionMethod:
      'Mehrfachauswahl: "Welche Sprachen sprechen Sie?" mit Optionen für DE, EN, FR, AR, FA, TR, TI, UK, RU, PS, Andere.',
    swissContext:
      'Deutsch oder Englisch als Lingua Franca wichtig. Wir priorisieren Überlappung bei mindestens einer Sprache.',
  },

  socialStyle: {
    factorId: 'socialStyle',
    whyItMatters:
      'Introvertierte brauchen Rückzugszeit, Extrovertierte suchen Interaktion. Extreme Unterschiede können zu Frustration auf beiden Seiten führen.',
    researchFindings: [
      'Persönlichkeitsmerkmale beeinflussen signifikant die Wohnkompatibilität',
      'Ähnlichkeit in Extraversion/Gewissenhaftigkeit korreliert mit Zufriedenheit',
      '64% der Menschen bevorzugen Mitbewohner, mit denen sie auch sozial Zeit verbringen können',
    ],
    sourceIds: ['researchgate-matching'],
    dataCollectionMethod:
      'Einfachauswahl: "Wie viel Kontakt mit Mitbewohnern wünschen Sie?" mit Optionen Introvertiert, Ausgeglichen, Extrovertiert.',
  },

  smokingStatus: {
    factorId: 'smokingStatus',
    whyItMatters:
      'Rauchen in Innenräumen ist für viele inakzeptabel. Dies ist ein nicht-verhandelbarer Faktor mit hohem Eskalationspotenzial.',
    researchFindings: [
      'Raucher-Konflikte werden als hochriskanter Faktor eingestuft',
      'Gesundheitsrisiken von Passivrauchen machen dies zu einem kritischen Faktor',
      'Best Practices empfehlen grundsätzliche Trennung von Rauchern und Nichtrauchern',
    ],
    sourceIds: ['wuppertal-gemeinschaftswohnen'],
    dataCollectionMethod:
      'Einfachauswahl: Nichtraucher / Raucht nur draussen / Raucht auch drinnen.',
    swissContext:
      'In Schweizer Unterkünften oft Rauchverbot in Innenräumen. Wir matchen Raucher mit rauchfreundlichen Einheiten.',
  },

  privacyNeed: {
    factorId: 'privacyNeed',
    whyItMatters:
      'Menschen haben unterschiedliche Bedürfnisse nach persönlichem Raum. Wenn Grenzen nicht respektiert werden, entsteht erheblicher Stress.',
    researchFindings: [
      'Mangelnde Grenzen sind eine Hauptursache für Mitbewohner-Stress',
      'Menschen die konfliktreiche Situationen verlassen zeigen schnelle Verbesserung in emotionaler Regulation',
      'Besonders wichtig für Menschen mit Trauma-Erfahrungen',
    ],
    sourceIds: ['gdw-nachbarschaften'],
    dataCollectionMethod:
      'Skala 1-5: "Wie viel Rückzugsort benötigen Sie?" von Offen bis Viel Privatsphäre.',
    swissContext:
      'Für Asylsuchende mit Flucht-Trauma oft besonders wichtig. Wir kombinieren dies mit der Frage nach Einzelzimmer-Bedarf.',
  },

  choresContribution: {
    factorId: 'choresContribution',
    whyItMatters:
      'Unterschiedliche Vorstellungen von Haushaltsaufgaben sind eine häufige Konfliktquelle. Wer macht was, wie oft?',
    researchFindings: [
      'Haushaltsaufteilung beeinflusst Beziehungszufriedenheit signifikant',
      'Gefühl von Ungerechtigkeit bei Hausarbeit führt zu Groll',
      'Ähnliche Erwartungen reduzieren Reibung',
    ],
    sourceIds: ['sciencedaily-cleaning'],
    dataCollectionMethod:
      'Skala 1-5: "Wie aktiv beteiligen Sie sich an gemeinsamen Aufgaben?" von Wenig aktiv bis Sehr aktiv.',
    swissContext:
      'Schweizer Recycling-System erfordert aktive Beteiligung. Kombiniert mit Recycling-Wissens-Erfassung.',
  },

  roomSharingStatus: {
    factorId: 'roomSharingStatus',
    whyItMatters:
      'Manche Menschen können kein Zimmer teilen (Trauma, PTSD, medizinische Gründe). Dies ist eine harte Anforderung.',
    researchFindings: [
      'Privater Raum ist für manche Menschen eine psychologische Notwendigkeit',
      'Erzwungene Zimmerteilung kann bei vulnerablen Personen zu Krisen führen',
    ],
    sourceIds: ['brunnenhof-zuerich'],
    dataCollectionMethod:
      'Einfachauswahl: Kann teilen / Bevorzugt Einzelzimmer / Benötigt Einzelzimmer (medizinisch/psychologisch).',
    swissContext:
      'NEEDS_PRIVATE wird als harte Anforderung behandelt - System blockiert Platzierung wenn nicht erfüllbar.',
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
// HELPER FUNCTIONS
// =============================================================================

export function getSourceById(id: string): ResearchSource | undefined {
  return RESEARCH_SOURCES.find(s => s.id === id)
}

export function getSourcesByRegion(region: 'CH' | 'DE' | 'INT'): ResearchSource[] {
  return RESEARCH_SOURCES.filter(s => s.region === region)
}

export function getFactorScience(factorId: string): FactorScientificBasis | undefined {
  return FACTOR_SCIENCE[factorId]
}
