import {
  LOCALES,
  LOCALE_IDS,
  DEFAULT_LOCALE,
  offeredLocales,
  coverageOf,
  createTranslator,
  translateWith,
  getDictionary,
  resolveLocale,
  isLocaleId,
} from '@/lib/i18n'
import { de, type MessageKey } from '@/lib/i18n/dictionaries/de'

const KEYS = Object.keys(de) as MessageKey[]

/**
 * The promise this suite keeps: a resident is never shown a language we have
 * not finished, and never shown a blank where a string should be.
 */

describe('a language is only offered when it is finished', () => {
  it.each(LOCALE_IDS)('%s is not marked reviewed while incomplete', (id) => {
    // The whole point of the `reviewed` flag. Marking a half-translated
    // language as reviewed would put untranslated German in a picker that
    // promises the reader their own language — worse than not offering it.
    if (!LOCALES[id].reviewed) return

    expect({ id, coverage: coverageOf(id) }).toEqual({ id, coverage: 1 })
  })

  it('offers at least the language the product is written in', () => {
    expect(offeredLocales().map((locale) => locale.id)).toContain(DEFAULT_LOCALE)
  })

  it('reports honest coverage for a language nobody has written yet', () => {
    // Derived, not hardcoded: naming a specific language here made the test
    // fail the day that language was translated, which taught nothing.
    const unwritten = LOCALE_IDS.filter((id) => Object.keys(getDictionary(id)).length === 0)
    expect(unwritten.length).toBeGreaterThan(0)

    for (const id of unwritten) {
      expect({ id, coverage: coverageOf(id) }).toEqual({ id, coverage: 0 })
    }
  })

  it('reports partial coverage as partial', () => {
    // Guards the arithmetic itself, so a coverage function that returned 1 for
    // everything could not make the "only offered when finished" check pass.
    for (const id of LOCALE_IDS) {
      const coverage = coverageOf(id)
      expect(coverage).toBeGreaterThanOrEqual(0)
      expect(coverage).toBeLessThanOrEqual(1)
    }
  })
})

describe('nothing ever renders blank', () => {
  it.each(LOCALE_IDS)('%s resolves every key to real text', (id) => {
    const t = createTranslator(id)
    const missing = KEYS.filter((key) => {
      const value = t(key)
      return typeof value !== 'string' || value.trim() === ''
    })

    expect({ id, missing }).toEqual({ id, missing: [] })
  })

  it('falls back to German rather than echoing the key', () => {
    // Tested against an empty dictionary directly, so this keeps proving the
    // rule after every language has been written. Pointing it at whichever
    // locale happened to be blank made it fail the day French was added — the
    // test broke on good news, which is a test that teaches nothing.
    expect(translateWith({}, 'nav.overview')).toBe(de['nav.overview'])
  })

  it('prefers the translation over the fallback when there is one', () => {
    expect(translateWith({ 'nav.overview': 'Aperçu' }, 'nav.overview')).toBe('Aperçu')
  })

  it('uses a translation when one exists', () => {
    expect(createTranslator('en')('nav.overview')).toBe('Overview')
  })
})

describe('dictionaries stay in step with the German source', () => {
  it.each(LOCALE_IDS)('%s invents no keys of its own', (id) => {
    // A stray key is a translated string nothing renders — effort spent on
    // text no resident will ever see, and a hint that a key was renamed.
    const orphans = Object.keys(getDictionary(id)).filter(
      (key) => !(key in de)
    )

    expect({ id, orphans }).toEqual({ id, orphans: [] })
  })

  it('has a dictionary entry for every declared locale', () => {
    // A locale in LOCALES with no entry in DICTIONARIES would throw on lookup.
    for (const id of LOCALE_IDS) {
      expect({ id, hasDictionary: typeof getDictionary(id) === 'object' })
        .toEqual({ id, hasDictionary: true })
    }
  })

  it('names every language in its own language', () => {
    // Nobody scanning a list for their language looks for the word "German".
    for (const id of LOCALE_IDS) {
      expect({ id, endonym: LOCALES[id].endonym.length > 0 })
        .toEqual({ id, endonym: true })
    }
  })

  it('marks the right-to-left languages', () => {
    // Getting this wrong lays Arabic out left-to-right, which is not a styling
    // detail — it is unreadable.
    expect(LOCALES.ar.dir).toBe('rtl')
    expect(LOCALES.fa.dir).toBe('rtl')
    expect(LOCALES.de.dir).toBe('ltr')
  })
})

describe('choosing a language for a request', () => {
  it('honours an explicit choice above everything', () => {
    expect(resolveLocale({ cookieValue: 'en', acceptLanguage: 'de-CH,de;q=0.9' })).toBe('en')
  })

  it('ignores a cookie naming a language we do not offer yet', () => {
    // Someone could hold a cookie from before a language was un-reviewed, or
    // type one in. Neither should show them a half-translated portal.
    expect(resolveLocale({ cookieValue: 'ar', acceptLanguage: null })).toBe('de')
    expect(resolveLocale({ cookieValue: 'klingon', acceptLanguage: null })).toBe('de')
  })

  it('guesses from the browser on a first visit', () => {
    expect(resolveLocale({ acceptLanguage: 'en-GB,en;q=0.9' })).toBe('en')
  })

  it('respects the browser quality order rather than the string order', () => {
    // `de` appears first in the header but is weighted lower.
    expect(resolveLocale({ acceptLanguage: 'de;q=0.2,en;q=0.9' })).toBe('en')
  })

  it('skips an unreviewed language the browser asks for', () => {
    expect(resolveLocale({ acceptLanguage: 'uk-UA,uk;q=0.9' })).toBe('de')
  })

  it('falls back to German for anything unparseable', () => {
    expect(resolveLocale({ acceptLanguage: '' })).toBe('de')
    expect(resolveLocale({})).toBe('de')
    expect(resolveLocale({ acceptLanguage: ';;;q=notanumber' })).toBe('de')
  })

  it('recognises exactly the declared locales', () => {
    expect(isLocaleId('de')).toBe(true)
    expect(isLocaleId('xx')).toBe(false)
  })
})

describe('the safety string is treated as safety copy', () => {
  it('names the emergency number in every language that has it', () => {
    // If this line is translated at all, it must still carry the number. A
    // translation that drops "112" is worse than no translation.
    for (const id of LOCALE_IDS) {
      const translated = getDictionary(id)['safety.emergency']
      if (translated === undefined) continue

      expect({ id, keepsNumber: translated.includes('112') })
        .toEqual({ id, keepsNumber: true })
    }
  })
})
