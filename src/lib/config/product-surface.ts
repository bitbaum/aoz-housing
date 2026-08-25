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
 * German only, deliberately: this reads the German dictionary directly because
 * the landing copy it feeds is German. The RESIDENT portal is translated; the
 * pitch to a Swiss organisation is not.
 */

import { de } from '@/lib/i18n/dictionaries/de'
import { visibleMegaMenuGroups, visiblePortalNavItems } from './navigation'
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
 * The staff side, as the role that sees all of it.
 *
 * ADMIN rather than a union of every role: a union would list a destination no
 * single person can reach, which is a less true description of the product
 * than the widest real account.
 */
export function staffSurface(): SurfaceArea[] {
  return visibleMegaMenuGroups('ADMIN')
    .map((group) =>
      'items' in group
        ? { title: group.label, entries: group.items.map((item) => item.label) }
        : { title: group.label, entries: [] }
    )
    // Single top-level links (Dashboard, Nachrichten) are destinations, not
    // areas; listing them as one-entry columns would pad the grid with headings
    // that have nothing under them.
    .filter((area) => area.entries.length > 0)
}

/** The resident side, filtered by this brand's features — same as they get. */
export function residentSurface(): SurfaceArea[] {
  const items = visiblePortalNavItems()
  const seen: string[] = []
  for (const item of items) {
    if (!seen.includes(item.group)) seen.push(item.group)
  }

  return seen
    .map((group) => ({
      title: de[`navGroup.${group}` as keyof typeof de] as string,
      entries: items
        .filter((item) => item.group === group)
        .map((item) => de[portalNavMessageKey(item)]),
    }))
    .filter((area) => area.entries.length > 0)
}

/** Both halves of the product, named the way each audience meets them. */
export function productSurfaces(): ProductSurface[] {
  return [
    { title: 'Verwaltung', areas: staffSurface() },
    { title: BRAND.portalName, areas: residentSurface() },
  ]
}

/** How many destinations the product offers in total. Counted, never claimed. */
export function surfaceDestinationCount(): number {
  return productSurfaces().reduce(
    (total, surface) =>
      total + surface.areas.reduce((count, area) => count + area.entries.length, 0),
    0
  )
}
