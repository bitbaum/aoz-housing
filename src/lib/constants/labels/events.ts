/**
 * Events admin labels (German)
 */

export const EVENTS_ADMIN_LABELS = {
  pageTitle: 'Veranstaltungen',
  pageDescription: 'Hausversammlungen und gemeinsame Anlässe — für alle Einheiten.',
  emptyTitle: 'Noch keine Veranstaltungen geplant.',
  newAction: 'Veranstaltung',
  formTitle: 'Titel',
  formDescription: 'Beschreibung',
  formLocation: 'Ort',
  formStartsAt: 'Beginn',
  formUnit: 'Einheit',
  formCategory: 'Kategorie',
  submit: 'Erstellen',
  cancel: 'Absagen',
  cancelled: 'Abgesagt',
  unit: 'Einheit',
  rsvps: 'Zusagen',
  category: {
    HOUSE_MEETING: 'Hausversammlung',
    SOCIAL: 'Geselliges',
    CULTURE: 'Kultur',
    SUPPORT: 'Unterstützung',
  },
  status: {
    DRAFT: 'Entwurf',
    PUBLISHED: 'Veröffentlicht',
    CANCELLED: 'Abgesagt',
  },
} as const

/** Badge class per HouseEventStatus — co-located with the label map above so
 *  a future second usage site (e.g. a portal events badge) reuses this
 *  instead of redefining it. */
export const EVENTS_STATUS_BADGE: Record<string, string> = {
  DRAFT: 'badge-pending',
  PUBLISHED: 'badge-active',
  CANCELLED: 'badge-ended',
}
