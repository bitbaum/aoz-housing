import { MARKETING_COPY_BY_BRAND, type MarketingCopy } from '@/lib/constants/labels/marketing'
import { BRANDS, type BrandId } from '@/lib/config/brand'
import { NAV_ICONS } from '@/lib/config/navigation'

/**
 * The landing page is the one surface that speaks to people who have not
 * agreed to anything yet, so what it claims matters more than anywhere else in
 * the product.
 */

const brandIds = Object.keys(BRANDS) as BrandId[]

describe('every brand has its own landing copy', () => {
  it.each(brandIds)('%s has a complete pitch', (id) => {
    const copy = MARKETING_COPY_BY_BRAND[id]
    expect(copy).toBeDefined()

    const required: (keyof MarketingCopy)[] = [
      'eyebrow', 'headline', 'subline', 'ctaPrimary', 'ctaSecondary', 'ctaNote',
      'problemTitle', 'howTitle', 'featuresTitle', 'ethicsTitle', 'ethicsBody',
      'closingTitle', 'closingBody',
    ]

    for (const key of required) {
      const value = copy[key]
      expect({ id, key, filled: typeof value === 'string' && value.length > 0 })
        .toEqual({ id, key, filled: true })
    }
  })

  it.each(brandIds)('%s fills every list section', (id) => {
    const copy = MARKETING_COPY_BY_BRAND[id]

    expect(copy.problems.length).toBeGreaterThan(0)
    expect(copy.steps.length).toBeGreaterThan(0)
    expect(copy.features.length).toBeGreaterThan(0)
    expect(copy.neverTracked.length).toBeGreaterThan(0)
  })

  it.each(brandIds)('%s only uses icons that exist', (id) => {
    // An unknown key renders nothing where a feature icon should be.
    for (const feature of MARKETING_COPY_BY_BRAND[id].features) {
      expect({ feature: feature.title, icon: Boolean(NAV_ICONS[feature.icon]) })
        .toEqual({ feature: feature.title, icon: true })
    }
  })

  it('speaks in the register its brand actually uses', () => {
    // The WG brand runs in a real shared flat. Nobody there is "placed" by a
    // "system", and copy that says otherwise describes a different product.
    const wg = JSON.stringify(MARKETING_COPY_BY_BRAND.wg)
    expect(wg).not.toMatch(/platziert|Platzierung|Betreuung platziert/i)

    // And the organisational brands must not lose the thing they are for.
    expect(JSON.stringify(MARKETING_COPY_BY_BRAND.aoz)).toMatch(/platzier/i)
  })
})

describe('the landing page invents no evidence', () => {
  /**
   * The pilot that would justify a number has not reported. A percentage or a
   * count on this page would be a claim nobody can check, on the surface where
   * trust is being asked for — and the project's own rules forbid displaying
   * metrics that are not sourced from real data.
   */
  it.each(brandIds)('%s states no statistic', (id) => {
    const copy = MARKETING_COPY_BY_BRAND[id]
    const prose = [
      copy.headline, copy.subline, copy.ethicsBody, copy.closingBody,
      ...copy.problems.flatMap((s) => [s.title, s.body]),
      ...copy.steps.flatMap((s) => [s.title, s.body]),
      ...copy.features.flatMap((f) => [f.title, f.body]),
    ].join(' ')

    // Percentages, "3x", and counts of people/hours/francs are all evidence
    // claims. Ordinary words that merely contain digits are not, so the match
    // is deliberately narrow.
    const claims = prose.match(/\d+\s*(%|×|x\b|Prozent|Stunden|Franken|CHF|Bewohnende|Konflikte)/gi)

    expect({ id, claims: claims ?? [] }).toEqual({ id, claims: [] })
  })
})

describe('a heading may not count its own list', () => {
  /**
   * `featuresTitle` read "Vier Pfeiler für Fachpersonen und Klient*innen."
   * while `features` held six entries, three lines below it in the same file.
   *
   * Nothing could have caught that: a number spelled out in prose is just
   * prose, so adding a feature type-checks, lints and renders — the heading
   * simply starts lying. This gate reads the number word out of the heading and
   * compares it to the list it introduces, which turns the whole class from
   * "someone has to notice" into "it does not ship".
   */
  const NUMBER_WORDS: Record<string, number> = {
    zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6,
    sieben: 7, acht: 8, neun: 9, zehn: 10,
  }

  const HEADING_OF: { heading: keyof MarketingCopy; list: keyof MarketingCopy }[] = [
    { heading: 'problemTitle', list: 'problems' },
    { heading: 'howTitle', list: 'steps' },
    { heading: 'featuresTitle', list: 'features' },
    { heading: 'scienceTitle', list: 'science' },
  ]

  it.each(brandIds)('%s states no count its list contradicts', (id) => {
    const copy = MARKETING_COPY_BY_BRAND[id]
    const wrong: string[] = []

    for (const { heading, list } of HEADING_OF) {
      const text = copy[heading] as string
      const actual = (copy[list] as unknown[]).length

      for (const [word, claimed] of Object.entries(NUMBER_WORDS)) {
        // Word boundary, case-insensitive: "Vier" opens the sentence, and
        // "viermal" is not a count of the list.
        if (!new RegExp(`\\b${word}\\b`, 'i').test(text)) continue
        if (claimed !== actual) {
          wrong.push(`${heading} says "${word}" (${claimed}) but ${list} has ${actual}`)
        }
      }
    }

    expect({ id, wrong }).toEqual({ id, wrong: [] })
  })
})

describe('Swiss German spelling', () => {
  it.each(brandIds)('%s never uses ß', (id) => {
    // Swiss German has no ß. It is the single most common slip in this repo's
    // copy, and it reads as foreign to every reader in Zürich.
    const prose = JSON.stringify(MARKETING_COPY_BY_BRAND[id])
    expect({ id, sharpS: prose.includes('ß') }).toEqual({ id, sharpS: false })
  })
})
