/**
 * Translated names for the activity enums.
 *
 * These leaked German into every translated portal page: a resident reading
 * the portal in Russian saw the filter row render "Sport / Sprache / Kultur /
 * Gemeinschaft / Familie / Unterstützung", and the price of every offer as
 * "Kostenlos". The category and the price are precisely what someone scans a
 * list of offers FOR, so the two load-bearing facts on the page were the two
 * that stayed untranslated.
 *
 * Nothing warned about it, because a German string is a perfectly valid string
 * and the coverage check only measures keys that exist — it cannot see a label
 * that never went through the dictionary at all.
 *
 * Keyed by the config's own id unions, so a new category fails to compile here
 * until it has a key.
 *
 * @see src/lib/i18n/opportunity-labels.ts — same rule, same shape.
 */

import type { MessageKey } from './dictionaries/de'
import type { Translator } from './index'
import type { ActivityCategory, ActivityCost } from '@/lib/config/activities'

const CATEGORY_KEYS: Record<ActivityCategory, MessageKey> = {
  SPORT: 'activities.categorySport',
  LANGUAGE: 'activities.categoryLanguage',
  CULTURE: 'activities.categoryCulture',
  COMMUNITY: 'activities.categoryCommunity',
  FAMILY: 'activities.categoryFamily',
  SUPPORT: 'activities.categorySupport',
}

const COST_KEYS: Record<ActivityCost, MessageKey> = {
  FREE: 'activities.costFree',
  REDUCED: 'activities.costReduced',
  PAID: 'activities.costPaid',
}

export function activityCategoryLabel(t: Translator, category: ActivityCategory): string {
  return t(CATEGORY_KEYS[category])
}

export function activityCostLabel(t: Translator, cost: ActivityCost): string {
  return t(COST_KEYS[cost])
}

/** Category filter options, translated, in the order the config declares them. */
export function activityCategoryOptions(
  t: Translator,
  categories: readonly ActivityCategory[],
): { value: ActivityCategory; label: string }[] {
  return categories.map((value) => ({ value, label: activityCategoryLabel(t, value) }))
}
