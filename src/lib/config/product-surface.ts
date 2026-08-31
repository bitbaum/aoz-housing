/**
 * What this product actually does — derived, never written down twice.
 *
 * The landing page used to answer "what is in it?" with four hand-written
 * abstractions. Meanwhile the product grew a marketplace, house events, a
 * decision process, shared expenses, a learning record and a placement
 * directory, and the page said none of it: prose written once describes the
 * product as it was on the day somebody typed it, and nothing ever fails when
 * it stops being true.
 *
 * So the answer comes from the navigation, which is the one list that cannot
 * go stale — a destination unreachable from the nav does not exist for a user
 * either, and `portal-nav-reachable.test.ts` already enforces that against the
 * router's own files. Ship a page, add it to the nav, and the landing page
 * says so. The same rule the factor count in `marketing.ts` already follows.
 *
 * WHICH HALF IS TRANSLATED, AND WHY ONLY ONE. The resident column follows the
 * reader's language, because the resident portal genuinely is translated and
 * these are its real menu entries in that language. The staff column stays
 * German in every language, because the staff interface IS German
 * (`i18n/locales.ts`) — translating those names on a French landing page would
 * describe a product that does not exist. The landing page says so out loud
 * (`surfaceStaffNote`) rather than leaving a French reader to guess whether the
 * German is a gap or a fact.
 */

import { createTranslator } from '@/lib/i18n'
import { DEFAULT_LOCALE, type LocaleId } from '@/lib/i18n/locales'
import { visibleMegaMenuGroups, visiblePortalNavItems } from './navigation'
import { WIDEST_CAPABILITIES } from '@/lib/auth/role-policy'
import { portalNavMessageKey } from '@/lib/utils/portal-nav'
import { BRAND } from './brand'

export interface SurfaceArea {
  /** The group heading, as staff or residents read it in the product itself. */
  title: string
  /** Every destination in that group, in the order the menu offers them. */
  entries: string[]
}

export interface ProductSurface {
  title: string
  areas: SurfaceArea[]
}

/**
 * The staff side, as the account that sees all of it.
 *
 * The widest REAL account rather than a union of every role: a union would list
 * a destination no single person can reach, which is a less true description of
 * the product. Since role, scope and administration were separated, "widest" is
 * a combination anyone can be given rather than a role only one person holds.
 */
export function staffSurface(): SurfaceArea[] {
  return (
    visibleMegaMenuGroups(WIDEST_CAPABILITIES)
      .map((group) =>
        'items' in group
          ? { title: group.label, entries: group.items.map((item) => item.label) }
          : { title: group.label, entries: [] },
      )
      // Single top-level links (Dashboard, Nachrichten) are destinations, not
      // areas; listing them as one-entry columns would pad the grid with headings
      // that have nothing under them.
      .filter((area) => area.entries.length > 0)
  )
}

/** The resident side, filtered by this brand's features — same as they get. */
export function residentSurface(locale: LocaleId = DEFAULT_LOCALE): SurfaceArea[] {
  const t = createTranslator(locale)
  const items = visiblePortalNavItems()
  const seen: string[] = []
  for (const item of items) {
    if (!seen.includes(item.group)) seen.push(item.group)
  }

  return seen
    .map((group) => ({
      // Same `as MessageKey` cast the sidebar itself resolves headings through.
      // A cast is not a check, which is why `portal-nav-groups.test.ts` gates
      // the group list against the dictionaries directly.
      title: t(`navGroup.${group}` as Parameters<typeof t>[0]),
      entries: items
        .filter((item) => item.group === group)
        .map((item) => t(portalNavMessageKey(item))),
    }))
    .filter((area) => area.entries.length > 0)
}

/**
 * Both halves of the product, named the way each audience meets them.
 *
 * The two column TITLES do not translate: "Verwaltung" is what the staff side
 * is called, and `BRAND.portalName` is a name this brand chose ("Mein
 * Bereich"). Names of things inside the product travel like the brand does —
 * a French reader looking for the staff interface will find it called
 * Verwaltung when they get there.
 */
export function productSurfaces(locale: LocaleId = DEFAULT_LOCALE): ProductSurface[] {
  return [
    { title: 'Verwaltung', areas: staffSurface() },
    { title: BRAND.portalName, areas: residentSurface(locale) },
  ]
}

/**
 * How many destinations the product offers in total. Counted, never claimed.
 *
 * Language-independent by construction: it counts entries, and every language
 * has the same ones. Taking a locale would invite a page to report a different
 * product size in French.
 */
export function surfaceDestinationCount(): number {
  return productSurfaces().reduce(
    (total, surface) =>
      total + surface.areas.reduce((count, area) => count + area.entries.length, 0),
    0,
  )
}
