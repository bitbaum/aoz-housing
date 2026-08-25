import {
  PORTAL_NAV_ITEMS,
  PORTAL_NAV_GROUP_ORDER,
} from '@/lib/config/navigation'
import { portalNavMessageKey } from '@/lib/utils/portal-nav'
import { availableLocales, createTranslator, type MessageKey } from '@/lib/i18n'

/**
 * Two destinations may not share a name.
 *
 * German reads Aktivitäten / Veranstaltungen and English Activities / Events,
 * so every check anyone ran was green. Russian rendered BOTH as "Мероприятия"
 * and Ukrainian both as "Заходи" — one menu, the same word twice, going to two
 * different pages. A resident cannot tell which one they already tried.
 *
 * This is the failure mode translation invites: the bug exists only in the
 * languages nobody on the team reads, and it cannot be seen from the German
 * source at all, because in the source the two words are different. Only
 * comparing the RENDERED labels within a locale finds it.
 *
 * The check runs over the languages that are actually offered — an unfinished
 * dictionary falls back to German, where the labels are distinct by
 * construction, so including it would test German twice and prove nothing.
 */
describe('every navigation label names exactly one place', () => {
  it.each(availableLocales().map((locale) => locale.id))('%s has no duplicate labels', (id) => {
    const t = createTranslator(id)

    const byLabel = new Map<string, string[]>()
    for (const item of PORTAL_NAV_ITEMS) {
      const label = t(portalNavMessageKey(item))
      byLabel.set(label, [...(byLabel.get(label) ?? []), item.href])
    }

    const collisions = Array.from(byLabel.entries())
      .filter(([, hrefs]) => hrefs.length > 1)
      .map(([label, hrefs]) => `"${label}" → ${hrefs.join(' + ')}`)

    expect({ id, collisions }).toEqual({ id, collisions: [] })
  })

  /**
   * The same rule one level up, because the same bug was there and nobody had
   * looked: `navGroup.integration` was a VERBATIM copy of `navGroup.concerns`
   * in French, Ukrainian, Arabic and Turkish, and a near-copy in Persian and
   * Tigrinya. Those readers opened the sidebar and found two accordions with
   * identical headings — while the item labels inside them, which is all the
   * check above compared, were perfectly distinct.
   *
   * A heading is a destination too. It is the thing you read FIRST.
   */
  it.each(availableLocales().map((locale) => locale.id))(
    '%s gives every sidebar group its own heading',
    (id) => {
      const t = createTranslator(id)

      const byHeading = new Map<string, string[]>()
      for (const group of PORTAL_NAV_GROUP_ORDER) {
        const heading = t(`navGroup.${group}` as MessageKey)
        byHeading.set(heading, [...(byHeading.get(heading) ?? []), group])
      }

      const collisions = Array.from(byHeading.entries())
        .filter(([, groups]) => groups.length > 1)
        .map(([heading, groups]) => `"${heading}" → ${groups.join(' + ')}`)

      expect({ id, collisions }).toEqual({ id, collisions: [] })
    }
  )

  it('would catch two entries sharing a word', () => {
    // Proves the comparison rather than trusting it — a version of this test
    // that read the KEYS instead of the rendered labels would pass on the very
    // bug it exists to catch, since the keys were always distinct.
    const labels = ['Мероприятия', 'Барахолка', 'Мероприятия']
    const duplicates = labels.filter((label, i) => labels.indexOf(label) !== i)

    expect(duplicates).toEqual(['Мероприятия'])
  })
})
