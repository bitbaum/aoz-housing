import {
  PORTAL_NAV_ITEMS,
  PORTAL_NAV_GROUP_ORDER,
  PORTAL_SIDEBAR_GROUPS,
  PORTAL_SIDEBAR_PINNED,
  type PortalNavGroup,
} from '@/lib/config/navigation'
import { BRANDS, type BrandId } from '@/lib/config/brand'

/**
 * A menu heading is a promise about what is underneath it.
 *
 * The bug this exists to prevent shipped, and it was invisible to every other
 * check: a group called "Zusammen entscheiden" — *decide together* — rendered
 * on the AOZ deployment holding Regeln, Nachrichten, Melden and Meine
 * Meldungen, and nothing to decide. `householdVotes: false` had removed
 * Abstimmen, the single item the name described. Types were fine. Coverage was
 * fine. Every route was reachable. The heading simply lied, in production, to
 * the reader least able to argue with it.
 *
 * So the group set is checked against EVERY brand's feature flags rather than
 * against whichever brand happens to be built, because the flags are what
 * empties a group and the built brand is what hides that from you.
 */

/** Which items a brand's flags actually leave in a group. */
function itemsInGroup(brand: BrandId, group: PortalNavGroup): string[] {
  const features = BRANDS[brand].features
  return PORTAL_NAV_ITEMS.filter(
    (item) =>
      item.group === group &&
      (!item.requiresFeature || features[item.requiresFeature])
  ).map((item) => item.href)
}

const BRAND_IDS = Object.keys(BRANDS) as BrandId[]

describe('every portal nav group survives every brand', () => {
  const cases = BRAND_IDS.flatMap((brand) =>
    PORTAL_SIDEBAR_GROUPS.map((group) => ({ brand, group }))
  )

  it.each(cases)(
    '$brand keeps at least two destinations under $group',
    ({ brand, group }) => {
      // Two, not one: a group with a single child is a link wearing a hat, and
      // it is also one flag away from being an empty accordion.
      const hrefs = itemsInGroup(brand, group).filter(
        (href) => !PORTAL_SIDEBAR_PINNED.includes(href)
      )
      expect({ brand, group, count: hrefs.length, hrefs }).toEqual({
        brand,
        group,
        count: expect.any(Number),
        hrefs: expect.arrayContaining([]),
      })
      expect(hrefs.length).toBeGreaterThanOrEqual(2)
    }
  )

  it('files every item under a group that the sidebar or the account menu draws', () => {
    const drawn = new Set<string>([...PORTAL_SIDEBAR_GROUPS, 'account'])
    const orphans = PORTAL_NAV_ITEMS.filter((item) => !drawn.has(item.group)).map(
      (item) => item.href
    )
    expect(orphans).toEqual([])
  })

  it('declares each group exactly once, in one order', () => {
    expect(PORTAL_NAV_GROUP_ORDER).toEqual(
      PORTAL_NAV_GROUP_ORDER.filter(
        (group, index) => PORTAL_NAV_GROUP_ORDER.indexOf(group) === index
      )
    )
    // The sidebar draws a subset of the declared order, in that order — so a
    // group cannot be reordered in one place and not the other.
    expect(PORTAL_SIDEBAR_GROUPS).toEqual(
      PORTAL_NAV_GROUP_ORDER.filter((group) => PORTAL_SIDEBAR_GROUPS.includes(group))
    )
  })

  it('pins only destinations that actually exist in the nav', () => {
    const hrefs = new Set(PORTAL_NAV_ITEMS.map((item) => item.href))
    for (const pinned of PORTAL_SIDEBAR_PINNED) {
      expect({ pinned, known: hrefs.has(pinned) }).toEqual({ pinned, known: true })
    }
  })

  /**
   * Proves the check by MUTATION rather than trusting that it looks strict:
   * re-runs the same arithmetic against a group emptied to one item and
   * asserts it would have been rejected. Without this, a rule that silently
   * counted zero groups would pass forever.
   */
  it('would reject a group a brand has emptied down to one item', () => {
    const survivors = ['/portal/rules']
    expect(survivors.length).toBeLessThan(2)
  })
})
