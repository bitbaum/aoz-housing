/**
 * Copy for the labour-market integration methodology tab.
 * @see components/algorithm/IntegrationTab.tsx
 */
export const INTEGRATION_TAB_LABELS = {
  tab: 'Integration',

  introTitle: 'Woran sich die Arbeitsintegration orientiert',
  introBody:
    'Dieselbe Offenlegung wie beim Matching: welche Befunde die Begleitung leiten, was daraus für die Arbeit folgt, und woran das System selbst etwas erkennt.',

  /**
   * The honesty this page turns on, and it belongs on the page rather than only
   * in a source file: most supported-employment evidence comes from trials with
   * people with severe mental illness, mostly outside Switzerland. The
   * MECHANISM transfers; the institutions do not.
   */
  transferCaution:
    'Ein Hinweis zur Übertragbarkeit: Die stärkste Evidenz zu «Vermitteln, dann qualifizieren» stammt aus Studien mit anderen Zielgruppen und meist ausserhalb der Schweiz. Der Wirkmechanismus repliziert in europäischen Studien — Bewilligungsregime, Anerkennungsverfahren und Berufsbildung sind jedoch nicht übertragbar.',

  principlesTitle: 'Grundsätze',
  implication: 'Für die Arbeit:',
  basis: 'Grundlage:',

  /** Rendered per principle, so the page never implies more than the software does. */
  statusSignal: 'Das System meldet das',
  statusDocumented: 'Nur dokumentiert',

  kpiTitle: 'Was daraus gemessen wird',
  kpiBody: 'Frühindikatoren über die eigenen begleiteten Personen — sichtbar unter Statistiken.',

  laggingTitle: 'Wirkungsziele Integrationsagenda Schweiz',
  laggingBody:
    'Die verbindlichen Fernziele, auf die diese Frühindikatoren hinarbeiten. Sie werden hier nicht gemessen — dafür braucht es Jahre und eine kantonale Definition von «nachhaltig».',

  strengthTitle: 'Evidenzgrade',
} as const
