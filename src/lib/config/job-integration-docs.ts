import type { ResearchSource } from './evidence'

/**
 * The scientific basis for how this product supports labour-market integration.
 *
 * SSOT for the job/integration domain, and the counterpart to
 * `algorithm-docs.ts`. Until this file existed the asymmetry was stark: the
 * housing side could explain every weight it applies and cite the research
 * behind it, while the job side — half of what AOZ is measured on — had no
 * documented basis at all. A Jobcoach could not answer "why does the system
 * think that matters", because the system did not think anything.
 *
 * ## Why this drives behaviour rather than sitting in a docs page
 *
 * A page of citations nobody reads is decoration. Each principle below names
 * the SIGNAL it implies, and `lib/jobcoach/queue.ts` turns those signals into
 * the work a coach actually sees. If a principle here has no signal, it is
 * either not actionable or not implemented — and saying which is the point of
 * the `status` field.
 *
 * ## A caution this file must carry
 *
 * Most of the strongest evidence in supported employment comes from trials
 * with people with severe mental illness, not refugees, and mostly from the US
 * and northern Europe. The MECHANISM (rapid placement into real jobs beats
 * lengthy pre-training) transfers well and is replicated in European trials.
 * The INSTITUTIONS do not: permit regimes, recognition procedures and the
 * structure of Swiss vocational training have no US equivalent. Hence
 * `region`, and hence the honesty about strength — overclaiming here would be
 * worse than the silence it replaces.
 */

export const JOB_RESEARCH_SOURCES: ResearchSource[] = [
  // ─── Switzerland ─────────────────────────────────────────────────────────
  {
    id: 'integrationsagenda-schweiz',
    title: 'Integrationsagenda Schweiz (IAS) — Wirkungsziele',
    publication: 'SEM / KdK — Bund und Kantone',
    year: 2019,
    region: 'CH',
    url: 'https://www.sem.admin.ch/sem/de/home/integration-einbuergerung/integrationsfoerderung/integrationsagenda.html',
    keyFindings: [
      'Verbindliche Wirkungsziele statt blosser Massnahmen — unter anderem: die Hälfte der erwachsenen Geflüchteten ist sieben Jahre nach Einreise nachhaltig im Arbeitsmarkt integriert.',
      'Zwei Drittel der 16- bis 25-Jährigen befinden sich fünf Jahre nach Einreise in einer postobligatorischen Ausbildung.',
      'Erstinformation und Potenzialabklärung sind eigene, frühe Prozessschritte — nicht Nebenprodukte der Unterbringung.',
      'Der Bund finanziert über Integrationspauschalen, gebunden an diese Ziele.',
    ],
    evidenceStrength: 'strong',
  },
  {
    id: 'ch-anerkennung-qualifikationen',
    title: 'Anerkennung ausländischer Qualifikationen und Dequalifizierung',
    publication: 'SBFI / SEM',
    region: 'CH',
    url: 'https://www.sbfi.admin.ch/sbfi/de/home/bildung/diploma.html',
    keyFindings: [
      'Nicht anerkannte Abschlüsse führen systematisch zu Beschäftigung unterhalb des Qualifikationsniveaus ("brain waste").',
      'Das Verfahren dauert Monate; ein früher Start ist der einzige wirksame Hebel.',
      'Berufserfahrung ohne formalen Abschluss kann über Validierung sichtbar gemacht werden.',
    ],
    evidenceStrength: 'moderate',
  },
  // ─── Germany / Austria ───────────────────────────────────────────────────
  {
    id: 'iab-lock-in',
    title: 'Einsperr- bzw. Lock-in-Effekte arbeitsmarktpolitischer Massnahmen',
    publication: 'IAB — Institut für Arbeitsmarkt- und Berufsforschung',
    region: 'DE',
    url: 'https://www.iab.de',
    keyFindings: [
      'Während einer längeren Massnahme sinkt die Suchintensität messbar — Teilnehmende sind kurzfristig SCHLECHTER platziert als Vergleichsgruppen.',
      'Der Effekt kehrt sich erst nach Programmende um, und nur bei arbeitsmarktnahen Massnahmen zuverlässig.',
      'Je arbeitsplatznäher die Massnahme, desto kleiner der Lock-in-Effekt.',
    ],
    evidenceStrength: 'strong',
  },
  {
    id: 'iab-fluchtmigration-erwerbsverlauf',
    title: 'Erwerbsverläufe Geflüchteter: der lange Anstieg',
    publication: 'IAB / SOEP-Geflüchtetenbefragung',
    region: 'DE',
    url: 'https://www.iab.de',
    keyFindings: [
      'Die Erwerbstätigenquote Geflüchteter steigt über Jahre kontinuierlich — nach rund fünf Jahren etwa die Hälfte, danach weiter.',
      'Frühe Sprachförderung UND früher Arbeitsmarktkontakt sagen den späteren Verlauf besser voraus als jede einzelne Massnahme.',
      'Lange Erwerbslosigkeit direkt nach Ankunft wirkt sich über Jahre negativ aus (Narbeneffekt).',
    ],
    evidenceStrength: 'strong',
  },
  // ─── International ───────────────────────────────────────────────────────
  {
    id: 'ips-supported-employment',
    title: 'Individual Placement and Support (IPS) — Supported Employment',
    publication: 'Cochrane / internationale RCT-Evidenz',
    region: 'INT',
    url: 'https://www.cochranelibrary.com',
    keyFindings: [
      '"Place-then-train" schlägt "train-then-place": rasche Vermittlung in reguläre Arbeit mit Begleitung danach führt zu deutlich höheren Beschäftigungsquoten als vorgelagerte Trainingsprogramme.',
      'Wirksame Kernprinzipien: schnelle Stellensuche, Orientierung an den Wünschen der Person, zeitlich unbegrenzte Begleitung nach Stellenantritt, Integration von Beratung und Vermittlung.',
      'Die Evidenz stammt überwiegend aus Studien mit Menschen mit psychischen Erkrankungen; der Mechanismus repliziert in europäischen Studien, die Institutionen sind aber nicht übertragbar.',
    ],
    evidenceStrength: 'strong',
  },
  {
    id: 'language-and-work-parallel',
    title: 'Sprache und Arbeit parallel statt sequenziell',
    publication: 'OECD — Making Integration Work',
    region: 'INT',
    url: 'https://www.oecd.org',
    keyFindings: [
      'Sprachkurs und Arbeitsmarktkontakt gleichzeitig wirken besser als "erst Sprache, dann Arbeit".',
      'Berufsbezogener Sprachunterricht schlägt allgemeinen Unterricht für die Beschäftigungswirkung.',
      'Frühe Kontakte zu Arbeitgebenden bauen genau das Netzwerk auf, das Geflüchteten bei der Stellensuche fehlt.',
    ],
    evidenceStrength: 'moderate',
  },
]

/**
 * Whether the product currently acts on a principle.
 *
 * `signal` means the queue in `lib/jobcoach/queue.ts` raises work from it.
 * `documented` means it shapes how staff should work but the product does not
 * detect it. Marking the second honestly is the whole point — an evidence page
 * that implies more than the software does is worse than none.
 */
export type PrincipleStatus = 'signal' | 'documented'

export interface IntegrationPrinciple {
  id: string
  title: string
  /** What the evidence says, in one sentence a caseworker would recognise. */
  claim: string
  /** What follows for how this product behaves. */
  implication: string
  sourceIds: string[]
  status: PrincipleStatus
}

export const INTEGRATION_PRINCIPLES: IntegrationPrinciple[] = [
  {
    id: 'place-then-train',
    title: 'Vermitteln, dann qualifizieren',
    claim:
      'Rasche Vermittlung in reguläre Arbeit mit Begleitung danach führt zu höherer und stabilerer Beschäftigung als lange vorgelagerte Trainingsprogramme.',
    implication:
      'Eine Person ohne laufende Bewerbung oder Einsatz ist ein Arbeitsauftrag, kein neutraler Zustand — auch dann, wenn sie gerade einen Kurs besucht.',
    sourceIds: ['ips-supported-employment', 'iab-lock-in'],
    status: 'signal',
  },
  {
    id: 'early-contact',
    title: 'Früher Arbeitsmarktkontakt',
    claim:
      'Lange Erwerbslosigkeit direkt nach Ankunft wirkt über Jahre nach; frühe Kontakte sagen den späteren Verlauf besser voraus als einzelne Massnahmen.',
    implication:
      'Die Zeit seit Erfassung ohne Arbeitsmarktkontakt ist selbst ein Signal, nicht nur ein Datum.',
    sourceIds: ['iab-fluchtmigration-erwerbsverlauf', 'integrationsagenda-schweiz'],
    status: 'signal',
  },
  {
    id: 'language-parallel',
    title: 'Sprache und Arbeit parallel',
    claim:
      'Sprachkurs und Arbeitsmarktkontakt gleichzeitig wirken besser als sequenziell; berufsbezogener Unterricht wirkt stärker als allgemeiner.',
    implication:
      'Ein laufender Sprachkurs ohne jeden Arbeitsmarktbezug ist kein Fortschritt, sondern ein Hinweis.',
    sourceIds: ['language-and-work-parallel', 'iab-lock-in'],
    status: 'signal',
  },
  {
    id: 'recognition-early',
    title: 'Anerkennung früh anstossen',
    claim:
      'Nicht anerkannte Abschlüsse führen zu Beschäftigung unter dem Qualifikationsniveau; das Verfahren dauert Monate.',
    implication:
      'Eine mitgebrachte Qualifikation ohne begonnene Anerkennung ist ein Verlust, der mit jedem Monat teurer wird.',
    sourceIds: ['ch-anerkennung-qualifikationen'],
    status: 'documented',
  },
  {
    id: 'support-after-start',
    title: 'Begleitung nach Stellenantritt',
    claim:
      'In IPS ist die Begleitung NACH dem Stellenantritt zeitlich unbegrenzt; die Abbruchgefahr ist in den ersten Wochen am höchsten.',
    implication: 'Ein begonnener Einsatz ist der Anfang der Begleitung, nicht ihr Abschluss.',
    sourceIds: ['ips-supported-employment'],
    status: 'documented',
  },
  {
    id: 'client-preference',
    title: 'Wunsch der Person zuerst',
    claim:
      'Orientierung an den Präferenzen der Person ist ein Wirkprinzip von IPS, kein Zugeständnis — Passung sagt Verbleib voraus.',
    implication:
      'Ein erfasstes Berufsziel ist eine Arbeitsgrundlage; sein Fehlen ist eine offene Frage.',
    sourceIds: ['ips-supported-employment'],
    status: 'documented',
  },
]

/**
 * What each signal is called, and what a coach should do about it.
 *
 * Here rather than in the queue module because these are UI copy, and the
 * queue is pure logic with no opinion about how it is rendered. `action` is
 * the sentence a coach reads under the count — a tile that names a problem
 * without naming the next move is a nag.
 */
export const JOB_SIGNAL_COPY = {
  NO_LABOUR_MARKET_CONTACT: {
    title: 'Noch kein Arbeitsmarktkontakt',
    action: 'Bewerbung oder Einsatz anstossen — Vermittlung wirkt vor Qualifizierung.',
    principleId: 'place-then-train',
  },
  COURSE_WITHOUT_WORK: {
    title: 'Kurs ohne Arbeitsmarktbezug',
    action: 'Parallel zum Kurs einen Einsatz suchen, nicht danach.',
    principleId: 'language-parallel',
  },
  STALLED_RECORD: {
    title: 'Eintrag seit Wochen unverändert',
    action: 'Stand nachführen oder abschliessen.',
    principleId: 'early-contact',
  },
} as const

export const JOB_INTEGRATION_LABELS = {
  areaTitle: 'Wissenschaftliche Grundlage: Arbeitsintegration',
  areaIntro:
    'Woran sich die Arbeit mit Klient*innen orientiert, und woher die Evidenz stammt. Schweizer und deutschsprachige Quellen zuerst, weil sich Institutionen — Bewilligungen, Anerkennungsverfahren, Berufsbildung — nicht übertragen lassen.',
  principlesTitle: 'Prinzipien',
  sourcesTitle: 'Quellen',
  statusSignal: 'Das System meldet dies aktiv',
  statusDocumented: 'Fachlich massgebend, vom System nicht erkannt',
  transferCaution:
    'Ein Teil der stärksten Evidenz stammt aus Studien mit anderen Zielgruppen und aus anderen Ländern. Der Wirkmechanismus repliziert; die Verfahren sind nicht übertragbar. Diese Einschränkung wird hier bewusst mitgeführt.',
} as const

/** Sources for a principle, in the order they are declared. */
export function sourcesForPrinciple(principle: IntegrationPrinciple): ResearchSource[] {
  return principle.sourceIds
    .map((id) => JOB_RESEARCH_SOURCES.find((source) => source.id === id))
    .filter((source): source is ResearchSource => source !== undefined)
}
