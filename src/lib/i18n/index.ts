import { de, type Dictionary, type MessageKey } from './dictionaries/de'
import { en } from './dictionaries/en'
import { uk } from './dictionaries/uk'
import { ar } from './dictionaries/ar'
import { fr } from './dictionaries/fr'
import { ru } from './dictionaries/ru'
import { tr } from './dictionaries/tr'
import { fa } from './dictionaries/fa'
import { ti } from './dictionaries/ti'
import { sq } from './dictionaries/sq'
import { so } from './dictionaries/so'
import { DEFAULT_LOCALE, LOCALES, isLocaleId, offeredLocales, type LocaleId } from './locales'

export type { MessageKey, Dictionary }
export * from './locales'

/**
 * Translation lookup.
 *
 * Every miss falls back to German rather than rendering the key or a blank.
 * A visible German string is something a resident can point at and ask about;
 * `reports.title` on screen is a bug report they have to write for us, and an
 * empty space is a page that looks broken.
 */

const DICTIONARIES: Record<LocaleId, Dictionary> = {
  de,
  en,
  fr,
  uk,
  ru,
  ar,
  tr,
  fa,
  ti,
  sq,
  so,
}

export type Translator = (key: MessageKey) => string

export function getDictionary(locale: LocaleId): Dictionary {
  return DICTIONARIES[locale] ?? {}
}

/**
 * The fallback rule itself, over a dictionary rather than a locale id.
 *
 * Exported so it can be tested against an EMPTY dictionary directly. Testing
 * the fallback through whichever language happens to be unwritten today makes
 * the test rot the moment that language gets written — which is exactly what
 * happened when French was added.
 */
export function translateWith(dictionary: Dictionary, key: MessageKey): string {
  return dictionary[key] ?? de[key]
}

/** Build the lookup for one locale. Pure, so it works on server and client. */
export function createTranslator(locale: LocaleId): Translator {
  const dictionary = getDictionary(locale)
  return (key) => translateWith(dictionary, key)
}

/**
 * How much of the message set a dictionary covers, 0–1.
 *
 * Takes the dictionary rather than a locale id so the arithmetic can be tested
 * against a known input forever. Testing it through whichever language happens
 * to be unwritten today makes the test rot the moment that language is written
 * — which is exactly what happened when French was added.
 */
export function coverageOfDictionary(dictionary: Dictionary): number {
  const keys = Object.keys(de) as MessageKey[]
  const translated = keys.filter((key) => typeof dictionary[key] === 'string').length

  return translated / keys.length
}

/** How much of the message set this locale actually covers, 0–1. */
export function coverageOf(locale: LocaleId): number {
  return coverageOfDictionary(getDictionary(locale))
}

/** A locale is offerable once every string is translated. */
export function isComplete(locale: LocaleId): boolean {
  return coverageOf(locale) === 1
}

/** The languages a resident may pick, computed from the dictionaries. */
export function availableLocales() {
  return offeredLocales(isComplete)
}

/**
 * Pick the language for a request.
 *
 * An explicit choice always wins — someone who picked a language meant it, and
 * a browser header must never override them. Below that, `Accept-Language` is a
 * decent guess for a first visit. Incomplete languages are skipped, because
 * half a portal in your language and half in German is worse than all of it in
 * German: you cannot tell which parts you are missing.
 */
export function resolveLocale({
  cookieValue,
  acceptLanguage,
}: {
  cookieValue?: string | null
  acceptLanguage?: string | null
}): LocaleId {
  if (cookieValue && isLocaleId(cookieValue) && isComplete(cookieValue)) {
    return cookieValue
  }

  for (const tag of parseAcceptLanguage(acceptLanguage)) {
    const base = tag.split('-')[0].toLowerCase()
    if (isLocaleId(base) && isComplete(base)) return base
  }

  return DEFAULT_LOCALE
}

/** `de-CH,de;q=0.9,en;q=0.8` → ['de-CH', 'de', 'en'], best first. */
function parseAcceptLanguage(header?: string | null): string[] {
  if (!header) return []

  return (
    header
      .split(',')
      .map((part) => {
        const [tag, ...params] = part.trim().split(';')
        const q = params
          .map((param) => /^q=([\d.]+)$/.exec(param.trim())?.[1])
          .find((value): value is string => value !== undefined)

        return { tag: tag.trim(), q: q === undefined ? 1 : Number(q) }
      })
      .filter((entry) => entry.tag !== '' && !Number.isNaN(entry.q))
      // Sort is stable in every engine this runs on, so equal weights keep the
      // order the browser sent — which is itself the browser's preference.
      .sort((a, b) => b.q - a.q)
      .map((entry) => entry.tag)
  )
}
