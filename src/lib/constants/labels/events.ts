/**
 * Events admin labels (German).
 *
 * The category words are NOT written here: they already exist in the German
 * dictionary, because the resident portal renders the same four. Two copies is
 * two places to add the fifth and one place to forget — and a category missing
 * from an inferred object literal renders `undefined` rather than failing to
 * compile. Derived from the config, which declares the map exhaustively.
 *
 * The staff side is German-only by design (@see CLAUDE.md), so reading the
 * German dictionary directly is honest here rather than an untranslated string.
 */

import { de } from '@/lib/i18n/dictionaries/de'
import { HOUSE_EVENT_CATEGORIES, HOUSE_EVENT_CATEGORY_LABEL_KEYS } from '@/lib/config/events'
import type { HouseEventCategory } from '@/lib/db'

const categoryLabels = Object.fromEntries(
  HOUSE_EVENT_CATEGORIES.map((category) => [
    category,
    de[HOUSE_EVENT_CATEGORY_LABEL_KEYS[category]],
  ]),
) as Record<HouseEventCategory, string>

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
  category: categoryLabels,
  status: {
    DRAFT: 'Entwurf',
    PUBLISHED: 'Veröffentlicht',
    CANCELLED: 'Abgesagt',
  },
} as const
