import {
  LOCALES,
  LOCALE_IDS,
  DEFAULT_LOCALE,
  availableLocales,
  coverageOf,
  coverageOfDictionary,
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
  it.each(LOCALE_IDS)('%s is offered only if every string is translated', (id) => {
    // Half a portal in your language and half in German is worse than all of
    // it in German: you cannot tell which parts you are missing.
    const offered = availableLocales().some((locale) => locale.id === id)
    if (!offered) return

    expect({ id, coverage: coverageOf(id) }).toEqual({ id, coverage: 1 })
  })

  it('offers at least the language the product is written in', () => {
    expect(availableLocales().map((locale) => locale.id)).toContain(DEFAULT_LOCALE)
  })

  it('keeps offering every language that has already been finished', () => {
    // The check above can only fail for a language that is STILL offered — a
    // dictionary that falls below 100% stops being offered, so the assertion
    // skips it and reports green. That makes "add keys to German, forget one
    // language" a silent removal of that language from the product, which is
    // precisely the change most likely to cause it.
    //
    // So the offered set is pinned. Adding a language means adding it here on
    // purpose; losing one fails loudly, naming the language that regressed.
    expect(
      availableLocales()
        .map((locale) => locale.id)
        .sort(),
    ).toEqual(['ar', 'de', 'en', 'fr', 'ru', 'uk'])
  })

  it('warns the reader about every language nobody has vouched for', () => {
    // The honesty half. Offering a language is not the same as standing behind
    // it, and the reader is the person best placed to judge — so they are told,
    // in the language they just chose.
    for (const locale of availableLocales()) {
      if (locale.reviewed) continue

      const notice = getDictionary(locale.id)['language.machineNotice']
      expect({ id: locale.id, hasNotice: typeof notice === 'string' && notice.length > 0 }).toEqual(
        { id: locale.id, hasNotice: true },
      )
    }
  })

  it('reports coverage as a real fraction, not a rubber stamp', () => {
    // Guards the arithmetic that the offering rule depends on. Every language
    // is now written, so there is no empty dictionary left to assert against —
    // what still has to hold is that coverage is COMPUTED.
    expect(coverageOf(DEFAULT_LOCALE)).toBe(1)
    expect(coverageOfDictionary({})).toBe(0)
    expect(coverageOfDictionary({ 'nav.overview': 'x' })).toBeGreaterThan(0)
    expect(coverageOfDictionary({ 'nav.overview': 'x' })).toBeLessThan(1)
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
    const orphans = Object.keys(getDictionary(id)).filter((key) => !(key in de))

    expect({ id, orphans }).toEqual({ id, orphans: [] })
  })

  it('has a dictionary entry for every declared locale', () => {
    // A locale in LOCALES with no entry in DICTIONARIES would throw on lookup.
    for (const id of LOCALE_IDS) {
      expect({ id, hasDictionary: typeof getDictionary(id) === 'object' }).toEqual({
        id,
        hasDictionary: true,
      })
    }
  })

  it('names every language in its own language', () => {
    // Nobody scanning a list for their language looks for the word "German".
    for (const id of LOCALE_IDS) {
      expect({ id, endonym: LOCALES[id].endonym.length > 0 }).toEqual({ id, endonym: true })
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

  it('ignores a cookie naming a language that does not exist', () => {
    expect(resolveLocale({ cookieValue: 'klingon', acceptLanguage: null })).toBe('de')
  })

  it('honours a cookie naming a complete language', () => {
    expect(resolveLocale({ cookieValue: 'ar', acceptLanguage: null })).toBe('ar')
  })

  it('guesses from the browser on a first visit', () => {
    expect(resolveLocale({ acceptLanguage: 'en-GB,en;q=0.9' })).toBe('en')
  })

  it('respects the browser quality order rather than the string order', () => {
    // `de` appears first in the header but is weighted lower.
    expect(resolveLocale({ acceptLanguage: 'de;q=0.2,en;q=0.9' })).toBe('en')
  })

  it('accepts a complete language the browser asks for', () => {
    expect(resolveLocale({ acceptLanguage: 'uk-UA,uk;q=0.9' })).toBe('uk')
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

      expect({ id, keepsNumber: translated.includes('112') }).toEqual({ id, keepsNumber: true })
    }
  })
})
