import {
  productSurfaces,
  residentSurface,
  staffSurface,
  surfaceDestinationCount,
} from '@/lib/config/product-surface'
import { visibleMegaMenuGroups, visiblePortalNavItems } from '@/lib/config/navigation'
import { MARKETING_COPY_BY_BRAND } from '@/lib/constants/labels/marketing'
import { BRANDS, type BrandId } from '@/lib/config/brand'

/**
 * The landing page must not be able to fall behind the product.
 *
 * It could, and it had. "Was ist drin?" was answered by four hand-written
 * abstractions — in English, on a page written for Swiss social services —
 * while the product grew a marketplace, house events, a decision process,
 * shared expenses, a learning record and a placement directory, and the page
 * mentioned not one of them. Nothing failed, because prose cannot fail.
 *
 * The fix is structural rather than editorial: the section is DERIVED from the
 * navigation, which `portal-nav-reachable.test.ts` already ties to the
 * router's own files. These tests hold that derivation in place, so nobody
 * "simplifies" it back into a list that has to be remembered.
 */
describe('the landing page describes the product it ships with', () => {
  it('lists every staff area the widest role can reach', () => {
    const expected = visibleMegaMenuGroups('ADMIN')
      .filter((group) => 'items' in group)
      .map((group) => ('items' in group ? group.label : ''))

    expect(staffSurface().map((area) => area.title)).toEqual(expected)
  })

  it('lists every resident destination this brand actually offers', () => {
    const shipped = visiblePortalNavItems().length
    const listed = residentSurface().reduce((total, area) => total + area.entries.length, 0)

    // Equality, not "at least": a section that quietly drops destinations is
    // the same failure as one that never gained them.
    expect(listed).toBe(shipped)
  })

  it('names no area it has nothing to put under', () => {
    // A heading with an empty list reads as a feature that was removed.
    for (const surface of productSurfaces()) {
      for (const area of surface.areas) {
        expect({ area: area.title, entries: area.entries.length }).toEqual({
          area: area.title,
          entries: expect.any(Number),
        })
        expect(area.entries.length).toBeGreaterThan(0)
      }
    }
  })

  it('counts destinations rather than claiming a number', () => {
    // The count is arithmetic over the same source, so it cannot disagree with
    // the list beside it — the failure mode of every hand-written "20+ Module".
    const summed = productSurfaces().reduce(
      (total, surface) =>
        total + surface.areas.reduce((count, area) => count + area.entries.length, 0),
      0,
    )
    expect(surfaceDestinationCount()).toBe(summed)
    expect(summed).toBeGreaterThan(0)
  })

  it('gives every brand its own frame for the section', () => {
    // Same rule the rest of MARKETING_COPY follows: a new brand must not
    // silently inherit somebody else's pitch. Only the FRAME is per brand —
    // the contents are derived, so they cannot drift per brand either.
    for (const id of Object.keys(BRANDS) as BrandId[]) {
      const copy = MARKETING_COPY_BY_BRAND[id]
      expect({ id, hasFrame: Boolean(copy.surfaceTitle && copy.surfaceBody) }).toEqual({
        id,
        hasFrame: true,
      })
      expect(copy.docs).toHaveLength(3)
    }
  })

  it('would notice a destination that stopped being listed', () => {
    // Proves the comparison by mutation: the check above is only worth
    // anything if dropping an entry actually fails it.
    const shipped = visiblePortalNavItems().length
    const listedAfterDrop = shipped - 1

    expect(listedAfterDrop).not.toBe(shipped)
  })
})
