/**
 * Marketplace admin labels (German)
 */

export const MARKETPLACE_ADMIN_LABELS = {
  pageTitle: 'Marktplatz',
  pageDescription: 'Meldungen der Bewohner:innen — geben, leihen, suchen. Moderation für alle Einheiten.',
  emptyTitle: 'Noch keine Meldungen.',
  hide: 'Ausblenden',
  unhide: 'Wieder einblenden',
  hiddenBadge: 'Ausgeblendet',
  hiddenReasonLabel: 'Grund (optional)',
  hiddenReasonPlaceholder: 'Warum wird die Meldung ausgeblendet?',
  postedBy: 'Von',
  claimedBy: 'Übernommen von',
  unit: 'Einheit',
  kind: {
    GIVE_AWAY: 'Verschenken',
    LEND: 'Verleihen',
    WANTED: 'Gesucht',
  },
  category: {
    FURNITURE: 'Möbel',
    KITCHEN: 'Küche',
    CLOTHING: 'Kleidung',
    ELECTRONICS: 'Elektronik',
    KIDS: 'Kinder',
    OTHER: 'Sonstiges',
  },
  status: {
    OPEN: 'Offen',
    CLAIMED: 'Übernommen',
    CLOSED: 'Abgeschlossen',
  },
} as const

/** Badge class per MarketplacePostStatus — the one definition, shared by the
 *  admin moderation table and the portal listing (previously copy-pasted in
 *  both). */
export const MARKETPLACE_STATUS_BADGE: Record<string, string> = {
  OPEN: 'badge-active',
  CLAIMED: 'badge-pending',
  CLOSED: 'badge-ended',
}
