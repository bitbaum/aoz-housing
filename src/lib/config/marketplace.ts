/**
 * Marketplace configuration — SSOT.
 *
 * The board started as a giveaway shelf: three kinds, six categories, all of
 * them objects. But the thing people in a shared house actually pass around
 * most is not a toaster — it is half an hour. Translating a letter, watching a
 * child, carrying a wardrobe up three flights, explaining a form. Those
 * exchanges were happening in the corridor with no record, which meant the one
 * person who could help never heard that anyone needed it.
 *
 * So the market has two halves, and they are declared here rather than spread
 * across a schema, a form and a page:
 *
 *   GOODS   — a thing changes hands
 *   SERVICE — someone's time does
 *
 * WHAT THIS BOARD DELIBERATELY HAS NO ROOM FOR: money. No price field, no
 * amount, no currency. That absence is a product decision, not an omission.
 * The people using it hold permits that constrain paid work, and a
 * neighbour-help board that lets one resident quote another a price turns into
 * informal employment nobody has checked, inside a population that cannot
 * afford to have that go wrong. Paid and formal work has its own channel with
 * its own permit gate — `Opportunity` — and the separation between the two is
 * the safeguard. Never add a price to a MarketplacePost; add an Opportunity.
 *
 * WHY CATEGORY IS CONFIG AND KIND IS AN ENUM. They are not the same kind of
 * thing. A category is vocabulary: adding "Fahrrad" should be one line here,
 * never a migration — the same rule the shared-expense categories follow. A
 * kind is BEHAVIOUR: it decides who claims from whom and what the button says,
 * so a new one means new code regardless, and the database may as well refuse
 * a value the code cannot handle.
 */

import type { MarketplacePostKind, MarketplacePostStatus } from '@prisma/client'
import type { MessageKey } from '@/lib/i18n'

/** The two halves of the board. */
export type MarketplaceNature = 'GOODS' | 'SERVICE'

export const MARKETPLACE_NATURES: readonly MarketplaceNature[] = ['GOODS', 'SERVICE']

export const MARKETPLACE_NATURE_LABEL_KEYS: Record<MarketplaceNature, MessageKey> = {
  GOODS: 'marketplace.natureGoods',
  SERVICE: 'marketplace.natureService',
}

interface MarketplaceKindConfig {
  nature: MarketplaceNature
  labelKey: MessageKey
  /**
   * What the OTHER person's button says.
   *
   * The direction reverses with the kind and the words have to follow, or the
   * board asks you to "take" a request for help. On a giveaway the poster has
   * the thing and the claimer wants it; on a WANTED or a NEED_HELP the poster
   * is the one asking, and answering it means offering, not taking.
   */
  claimLabelKey: MessageKey
}

/**
 * Every kind, keyed by the Prisma enum so a value added to the schema without
 * a config entry fails to compile rather than rendering a blank chip.
 */
export const MARKETPLACE_KINDS: Record<MarketplacePostKind, MarketplaceKindConfig> = {
  GIVE_AWAY: {
    nature: 'GOODS',
    labelKey: 'marketplace.kindGiveAway',
    claimLabelKey: 'marketplace.claimTake',
  },
  LEND: {
    nature: 'GOODS',
    labelKey: 'marketplace.kindLend',
    claimLabelKey: 'marketplace.claimBorrow',
  },
  WANTED: {
    nature: 'GOODS',
    labelKey: 'marketplace.kindWanted',
    claimLabelKey: 'marketplace.claimHaveOne',
  },
  OFFER_HELP: {
    nature: 'SERVICE',
    labelKey: 'marketplace.kindOfferHelp',
    claimLabelKey: 'marketplace.claimAcceptHelp',
  },
  NEED_HELP: {
    nature: 'SERVICE',
    labelKey: 'marketplace.kindNeedHelp',
    claimLabelKey: 'marketplace.claimGiveHelp',
  },
}

export const MARKETPLACE_KIND_VALUES = Object.keys(MARKETPLACE_KINDS) as MarketplacePostKind[]

export function kindsOfNature(nature: MarketplaceNature): MarketplacePostKind[] {
  return MARKETPLACE_KIND_VALUES.filter((kind) => MARKETPLACE_KINDS[kind].nature === nature)
}

export function natureOfKind(kind: MarketplacePostKind): MarketplaceNature {
  return MARKETPLACE_KINDS[kind].nature
}

/**
 * Status labels, keyed by the Prisma enum.
 *
 * A map rather than a chain of ternaries at the call site: the ternary version
 * silently renders the last branch for a status added later, and it needed an
 * `as never` cast to type-check at all — a cast is how a missing translation
 * gets past the compiler instead of stopping at it.
 */
export const MARKETPLACE_STATUS_LABEL_KEYS: Record<MarketplacePostStatus, MessageKey> = {
  OPEN: 'marketplace.statusOpen',
  CLAIMED: 'marketplace.statusClaimed',
  CLOSED: 'marketplace.statusClosed',
}

/**
 * Categories, per nature. Strings rather than an enum, so this list is the
 * only place a new one has to appear.
 *
 * `OTHER` is shared: it is the honest answer in both halves and duplicating it
 * as `OTHER_GOODS` / `OTHER_SERVICE` would put the same word twice in one
 * dropdown, which is the menu bug this whole change exists to stop.
 */
export const MARKETPLACE_CATEGORIES: Record<MarketplaceNature, readonly string[]> = {
  GOODS: ['FURNITURE', 'KITCHEN', 'CLOTHING', 'ELECTRONICS', 'KIDS', 'OTHER'],
  SERVICE: [
    'TRANSLATION',
    'CHILDCARE',
    'MOVING',
    'REPAIR',
    'TUTORING',
    'COOKING',
    'PAPERWORK',
    'OTHER',
  ],
}

export const MARKETPLACE_CATEGORY_LABEL_KEYS: Record<string, MessageKey> = {
  FURNITURE: 'marketplace.categoryFurniture',
  KITCHEN: 'marketplace.categoryKitchen',
  CLOTHING: 'marketplace.categoryClothing',
  ELECTRONICS: 'marketplace.categoryElectronics',
  KIDS: 'marketplace.categoryKids',
  TRANSLATION: 'marketplace.categoryTranslation',
  CHILDCARE: 'marketplace.categoryChildcare',
  MOVING: 'marketplace.categoryMoving',
  REPAIR: 'marketplace.categoryRepair',
  TUTORING: 'marketplace.categoryTutoring',
  COOKING: 'marketplace.categoryCooking',
  PAPERWORK: 'marketplace.categoryPaperwork',
  OTHER: 'marketplace.categoryOther',
}

/** Every category any nature offers, deduplicated. */
export const MARKETPLACE_CATEGORY_VALUES: readonly string[] = MARKETPLACE_NATURES.flatMap(
  (nature) => MARKETPLACE_CATEGORIES[nature],
).filter((value, index, all) => all.indexOf(value) === index)

/**
 * Is this category meaningful for this kind?
 *
 * Checked on write, because "Möbel" on an offer to translate a letter is not a
 * cosmetic mismatch — it is a row that will filter into the wrong half of the
 * board forever, and nothing downstream would ever notice.
 */
export function categoryFitsKind(kind: MarketplacePostKind, category: string): boolean {
  return MARKETPLACE_CATEGORIES[natureOfKind(kind)].includes(category)
}
