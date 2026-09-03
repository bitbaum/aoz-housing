/**
 * Copy for the per-domain KPI section. @see lib/analytics/role-kpis.ts
 */
export const ROLE_KPI_LABELS = {
  eyebrow: 'Wirkung',
  jobTitle: 'Arbeitsmarkt-Integration',
  volunteeringTitle: 'Engagement & Teilhabe',

  /** Says whose numbers these are — a personal caseload or the whole pilot. */
  scopeOwn: 'Ihre begleiteten Personen.',
  scopeAll: 'Alle Klient*innen — ohne Demo-Daten.',

  unitDays: 'Tage · ',
  denominator: (n: number) => `von ${n} Personen`,
  /**
   * The distinction the whole KPI set turns on. An empty caseload is not a
   * score of nought, and saying "0%" to someone nobody has assigned a client to
   * blames them for an empty seat.
   */
  noCaseload: 'noch niemand zugewiesen',

  basis: 'Grundlage:',

  laggingTitle: 'Wirkungsziele Integrationsagenda Schweiz',
  laggingHelp:
    'Die verbindlichen Fernziele, auf die diese Frühindikatoren hinarbeiten. Sie werden hier nicht gemessen — dafür braucht es Jahre und eine kantonale Definition von «nachhaltig».',
} as const
