/**
 * Marketplace admin labels (German).
 *
 * The words for kinds and categories are NOT written here. They already exist,
 * in the German dictionary, because the resident portal renders exactly the
 * same vocabulary — and two copies of "Verschenken" is two places to add the
 * next one and one place to forget. So this file derives them from the
 * marketplace config, which names the message key for each value.
 *
 * The staff side is German-only by design (@see CLAUDE.md: admins work in
 * German), which is why reading the German dictionary directly is honest here
 * rather than a missing translation.
 */

import { de } from '@/lib/i18n/dictionaries/de'
import {
  MARKETPLACE_KINDS,
  MARKETPLACE_KIND_VALUES,
  MARKETPLACE_CATEGORY_LABEL_KEYS,
  MARKETPLACE_CATEGORY_VALUES,
  MARKETPLACE_NATURE_LABEL_KEYS,
  natureOfKind,
  type MarketplaceNature,
} from '@/lib/config/marketplace'
import type { MarketplacePostKind } from '@/lib/db'

const kindLabels = Object.fromEntries(
  MARKETPLACE_KIND_VALUES.map((kind) => [kind, de[MARKETPLACE_KINDS[kind].labelKey]]),
) as Record<MarketplacePostKind, string>

const categoryLabels = Object.fromEntries(
  MARKETPLACE_CATEGORY_VALUES.map((category) => [
    category,
    de[MARKETPLACE_CATEGORY_LABEL_KEYS[category]],
  ]),
) as Record<string, string>

const natureLabels = Object.fromEntries(
  (Object.keys(MARKETPLACE_NATURE_LABEL_KEYS) as MarketplaceNature[]).map((nature) => [
    nature,
    de[MARKETPLACE_NATURE_LABEL_KEYS[nature]],
  ]),
) as Record<MarketplaceNature, string>

export const MARKETPLACE_ADMIN_LABELS = {
  pageTitle: 'Marktplatz',
  pageDescription:
    'Sachen und Hilfe unter Klient*innen — verschenken, verleihen, suchen, helfen. Moderation für alle Einheiten.',
  emptyTitle: 'Noch keine Meldungen.',
  hide: 'Ausblenden',
  unhide: 'Wieder einblenden',
  hiddenBadge: 'Ausgeblendet',
  hiddenReasonLabel: 'Grund (optional)',
  hiddenReasonPlaceholder: 'Warum wird die Meldung ausgeblendet?',
  postedBy: 'Von',
  claimedBy: 'Übernommen von',
  unit: 'Einheit',
  kind: kindLabels,
  category: categoryLabels,
  nature: natureLabels,
  natureOf: natureOfKind,
  status: {
    OPEN: 'Offen',
    CLAIMED: 'Übernommen',
    CLOSED: 'Abgeschlossen',
  },
} as const
