import { getDictionary } from '@/lib/i18n'
import { de, type MessageKey } from '@/lib/i18n/dictionaries/de'
import { LOCALE_IDS, type LocaleId } from '@/lib/i18n/locales'

/**
 * Every string must be written in the script its language uses.
 *
 * THE MISTAKE THIS CATCHES ALREADY HAPPENED, in the commit that added these
 * languages: the Tigrinya word for "settings" was written with a stray Telugu
 * character in front of it. It rendered without error, it type-checked, and the
 * coverage check counted it as translated — because nobody working on this
 * product reads Ge'ez script well enough to notice one foreign glyph.
 *
 * That is the whole argument for a machine check here. The languages most in
 * need of one are exactly the languages nobody on the team can proofread.
 *
 * Written with explicit code-point ranges rather than `\p{Script=...}` escapes,
 * which this engine rejects outright. The ranges also let a failure name the
 * offending character, which is the difference between "something is wrong in
 * Tigrinya" and "this glyph, in this key".
 */

interface Range {
  from: number
  to: number
}

const r = (from: number, to: number): Range => ({ from, to })

/** Punctuation, digits and spacing that every language here legitimately uses. */
const SHARED: Range[] = [
  r(0x0020, 0x0040), // space, punctuation, ASCII digits
  r(0x005b, 0x0060),
  r(0x007b, 0x007e),
  r(0x00a0, 0x00bf), // NBSP, guillemets, inverted marks
  r(0x2010, 0x2027), // dashes, typographic quotes, ellipsis
  r(0x00d7, 0x00d7),
]

const LATIN: Range[] = [r(0x0041, 0x005a), r(0x0061, 0x007a), r(0x00c0, 0x024f)]
const CYRILLIC: Range[] = [r(0x0400, 0x04ff)]
const ARABIC: Range[] = [
  r(0x0600, 0x06ff), // includes Arabic-Indic digits and diacritics
  r(0x0750, 0x077f),
  r(0x08a0, 0x08ff),
  r(0xfb50, 0xfdff),
  r(0xfe70, 0xfeff),
  r(0x200c, 0x200f), // ZWNJ / ZWJ / directional marks, load-bearing in Persian
]
const ETHIOPIC: Range[] = [r(0x1200, 0x139f), r(0x2d80, 0x2ddf)]

/**
 * The scripts each language may use. Arabic and Ge'ez keep Latin because the
 * emergency number "112" is written in Latin digits and has to stay legible as
 * a phone number.
 */
const ALLOWED: Record<LocaleId, Range[]> = {
  de: [...SHARED, ...LATIN],
  en: [...SHARED, ...LATIN],
  fr: [...SHARED, ...LATIN],
  tr: [...SHARED, ...LATIN],
  sq: [...SHARED, ...LATIN],
  so: [...SHARED, ...LATIN],

  uk: [...SHARED, ...CYRILLIC],
  ru: [...SHARED, ...CYRILLIC],

  ar: [...SHARED, ...ARABIC, ...LATIN],
  fa: [...SHARED, ...ARABIC, ...LATIN],
  ti: [...SHARED, ...ETHIOPIC, ...LATIN],
}

/** The characters in `value` that this locale has no business containing. */
function foreignCharacters(value: string, allowed: Range[]): string[] {
  return Array.from(value).filter((char) => {
    const code = char.codePointAt(0) ?? 0
    return !allowed.some((range) => code >= range.from && code <= range.to)
  })
}

describe('each dictionary is written in its own script', () => {
  it.each(LOCALE_IDS)('%s uses only the characters that language uses', (id) => {
    const dictionary = getDictionary(id)

    const offenders = (Object.keys(de) as MessageKey[])
      .map((key) => ({ key, value: dictionary[key] }))
      .filter(
        (entry): entry is { key: MessageKey; value: string } => typeof entry.value === 'string',
      )
      .map(({ key, value }) => ({ key, foreign: foreignCharacters(value, ALLOWED[id]) }))
      .filter(({ foreign }) => foreign.length > 0)
      .map(({ key, foreign }) => `${key}: ${foreign.join('')}`)

    expect({ id, offenders }).toEqual({ id, offenders: [] })
  })

  it('would catch a stray character from another script', () => {
    // The exact shape of the real bug: one Devanagari/Telugu-range glyph in
    // front of a Ge'ez word. A rule that has never fired is a rule nobody has
    // checked.
    expect(foreignCharacters('मቅንብራት', ALLOWED.ti)).toEqual(['म'])
    expect(foreignCharacters('ቅንብራት', ALLOWED.ti)).toEqual([])
  })

  it('does not flag the characters each script genuinely needs', () => {
    // The other direction: a rule that fires on correct text gets deleted.
    expect(foreignCharacters('Übersicht', ALLOWED.de)).toEqual([])
    expect(foreignCharacters('Tout en un coup d’œil', ALLOWED.fr)).toEqual([])
    expect(foreignCharacters('Türkçe çıkış', ALLOWED.tr)).toEqual([])
    expect(foreignCharacters('Мої звернення', ALLOWED.uk)).toEqual([])
    expect(foreignCharacters('اتصل بالرقم 112', ALLOWED.ar)).toEqual([])
  })

  it('covers every declared locale, so a new language cannot skip the check', () => {
    for (const id of LOCALE_IDS) {
      expect({ id, declared: id in ALLOWED }).toEqual({ id, declared: true })
    }
  })

  it('leaves no string empty or whitespace-only', () => {
    // A blank translation counts as "translated" for coverage but renders as
    // nothing — the failure the German fallback exists to prevent, smuggled in
    // as a present-but-empty value.
    for (const id of LOCALE_IDS) {
      const dictionary = getDictionary(id)
      const blank = (Object.keys(de) as MessageKey[]).filter(
        (key) => typeof dictionary[key] === 'string' && dictionary[key]!.trim() === '',
      )

      expect({ id, blank }).toEqual({ id, blank: [] })
    }
  })
})
