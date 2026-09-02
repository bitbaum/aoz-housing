/**
 * House event configuration — SSOT.
 *
 * The category and RSVP labels were rebuilt inline on the portal page and
 * again on the staff page, both times as a hand-written object literal keyed by
 * the Prisma enum. Two copies means a category added to the schema renders as
 * `undefined` on whichever page nobody remembered — silently, since indexing a
 * plain object with a missing key is not a type error once the map is inferred
 * rather than declared.
 *
 * Declared as `Record<Enum, MessageKey>` here, so adding a value to the schema
 * fails to compile until it has a word.
 */

import type { EventRsvpStatus, HouseEventCategory } from '@/lib/db'
import type { MessageKey } from '@/lib/i18n'

export const HOUSE_EVENT_CATEGORY_LABEL_KEYS: Record<HouseEventCategory, MessageKey> = {
  HOUSE_MEETING: 'events.categoryHouseMeeting',
  SOCIAL: 'events.categorySocial',
  CULTURE: 'events.categoryCulture',
  SUPPORT: 'events.categorySupport',
}

export const HOUSE_EVENT_CATEGORIES = Object.keys(
  HOUSE_EVENT_CATEGORY_LABEL_KEYS,
) as HouseEventCategory[]

export const EVENT_RSVP_LABEL_KEYS: Record<EventRsvpStatus, MessageKey> = {
  GOING: 'events.rsvpGoing',
  MAYBE: 'events.rsvpMaybe',
  DECLINED: 'events.rsvpDeclined',
}

/** The order the three buttons are offered in, most affirmative first. */
export const EVENT_RSVP_STATUSES: readonly EventRsvpStatus[] = ['GOING', 'MAYBE', 'DECLINED']
