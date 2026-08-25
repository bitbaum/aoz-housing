import { getDictionary } from '@/lib/i18n'
import { de, type MessageKey } from '@/lib/i18n/dictionaries/de'

/**
 * A dictionary must contain ITS OWN language.
 *
 * The script check already refuses a stray glyph from another writing system.
 * It cannot help between two languages that share one: Russian and Ukrainian
 * are both Cyrillic, so a block of Ukrainian pasted into the Russian file is
 * 100% "correct script", 100% translated by the coverage count, and completely
 * wrong on screen. A Russian-speaking resident opening the transfer page was
 * shown "Поточне житло", "Бажане житло" and "Надіслати запит" — Ukrainian —
 * inside an otherwise Russian portal.
 *
 * Nobody on the team reads either language well enough to notice, which is
 * exactly the argument for checking it by machine.
 *
 * The signal is orthographic and unambiguous: modern Russian never writes
 * і, ї, є or ґ, and Ukrainian never writes ы, э or ъ. Neither list needs
 * anyone to understand the sentence — only to know which alphabet it belongs
 * to.
 */

/** Letters that exist in one language's alphabet and not the other's. */
const FOREIGN_LETTERS: Partial<Record<string, RegExp>> = {
  ru: /[іїєґ]/,
  // ё belongs here too: the Ukrainian alphabet has no such letter, and it is
  // common enough in Russian (жильё, ещё) to be a strong tell.
  uk: /[ыэъё]/,
}

/**
 * The alphabet signal alone is not enough, and finding that out is the reason
 * there is a second one.
 *
 * "Поточне житло" — one of the strings actually shown to a Russian-speaking
 * resident — is written entirely in letters both alphabets share, so the
 * letter check waves it straight through. The second signal is that the two
 * dictionaries hold the SAME string: short words legitimately coincide
 * (Назад, Спорт, Культура), but a whole phrase identical in both languages is
 * a copy, not a coincidence.
 */
const COINCIDENCE_LIMIT = 14

function offendersIn(locale: 'ru' | 'uk'): string[] {
  const dictionary = getDictionary(locale)
  const neighbour = getDictionary(locale === 'ru' ? 'uk' : 'ru')
  const pattern = FOREIGN_LETTERS[locale]!

  return (Object.keys(de) as MessageKey[])
    .filter((key) => {
      const value = dictionary[key]
      if (typeof value !== 'string') return false

      if (pattern.test(value)) return true

      const twin = neighbour[key]
      return typeof twin === 'string' && twin === value && value.length > COINCIDENCE_LIMIT
    })
    .map((key) => `${key}: ${dictionary[key]}`)
}

describe('no dictionary contains a neighbouring language', () => {
  it('ru is Russian, not Ukrainian', () => {
    expect({ locale: 'ru', offenders: offendersIn('ru') }).toEqual({
      locale: 'ru',
      offenders: [],
    })
  })

  it('uk is Ukrainian, not Russian', () => {
    expect({ locale: 'uk', offenders: offendersIn('uk') }).toEqual({
      locale: 'uk',
      offenders: [],
    })
  })

  it('discriminates on the alphabet where the alphabet differs', () => {
    expect(FOREIGN_LETTERS.ru!.test('Вільне місце')).toBe(true)
    expect(FOREIGN_LETTERS.ru!.test('Свободное место')).toBe(false)
    expect(FOREIGN_LETTERS.uk!.test('Текущее жильё')).toBe(true)
    expect(FOREIGN_LETTERS.uk!.test('Поточне житло')).toBe(false)
  })

  it('needs a second signal for the strings that were actually reported', () => {
    // Both of these were shown to a Russian-speaking resident, and BOTH are
    // written entirely in letters the two alphabets share. A gate built on the
    // alphabet alone reports all-clear on the exact text that was wrong, which
    // is how it shipped — and is why the identical-twin check exists.
    expect(FOREIGN_LETTERS.ru!.test('Поточне житло')).toBe(false)
    expect(FOREIGN_LETTERS.ru!.test('Бажане житло (необов’язково)')).toBe(false)

    // The twin check catches the longer one; the short one is caught because
    // it, too, would sit identical in both dictionaries.
    expect('Бажане житло (необов’язково)'.length).toBeGreaterThan(COINCIDENCE_LIMIT)
  })
})
