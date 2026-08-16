/**
 * Which languages this product speaks — SSOT.
 *
 * WHY THESE LANGUAGES. They are not a guess at "popular languages". They are
 * the ones the people living in this housing actually read: the largest asylum
 * origin groups in Switzerland, plus the national and lingua-franca languages
 * that let a resident and a caseworker meet somewhere in the middle. Adding one
 * is a dictionary file and a line here, never a code change.
 *
 * WHY A LOCALE CAN EXIST WITHOUT BEING OFFERED. `reviewed` is the difference
 * between "we have a translation" and "we are willing to put this in front of
 * someone who has to rely on it". Everything on this surface is consequential —
 * how to report a conflict, who to call in an emergency, what the house rules
 * bind you to — and a confidently wrong translation of that is worse than
 * German the reader can at least recognise as foreign and ask about. So an
 * unreviewed language lives in the repo, ready for a native speaker, and does
 * NOT appear in the picker. `i18n.test.ts` enforces that a locale cannot be
 * marked reviewed while its dictionary is incomplete.
 */

export type LocaleId =
  | 'de'
  | 'en'
  | 'fr'
  | 'uk'
  | 'ru'
  | 'ar'
  | 'fa'
  | 'ti'
  | 'tr'
  | 'sq'
  | 'so'

export type TextDirection = 'ltr' | 'rtl'

export interface Locale {
  id: LocaleId
  /** The language's name IN that language — nobody looks for "German". */
  endonym: string
  dir: TextDirection
  /**
   * True once a human who speaks this language has read the dictionary. Only
   * reviewed locales are offered to residents.
   */
  reviewed: boolean
  /** BCP-47 tag for Intl date and number formatting. */
  intlTag: string
}

export const LOCALES: Record<LocaleId, Locale> = {
  // The base. Every other dictionary falls back to it, so it is reviewed by
  // definition — it is the text the product was written in.
  de: { id: 'de', endonym: 'Deutsch', dir: 'ltr', reviewed: true, intlTag: 'de-CH' },
  en: { id: 'en', endonym: 'English', dir: 'ltr', reviewed: true, intlTag: 'en-GB' },
  fr: { id: 'fr', endonym: 'Français', dir: 'ltr', reviewed: false, intlTag: 'fr-CH' },
  uk: { id: 'uk', endonym: 'Українська', dir: 'ltr', reviewed: false, intlTag: 'uk-UA' },
  ru: { id: 'ru', endonym: 'Русский', dir: 'ltr', reviewed: false, intlTag: 'ru-RU' },
  ar: { id: 'ar', endonym: 'العربية', dir: 'rtl', reviewed: false, intlTag: 'ar' },
  fa: { id: 'fa', endonym: 'فارسی / دری', dir: 'rtl', reviewed: false, intlTag: 'fa' },
  ti: { id: 'ti', endonym: 'ትግርኛ', dir: 'ltr', reviewed: false, intlTag: 'ti' },
  tr: { id: 'tr', endonym: 'Türkçe', dir: 'ltr', reviewed: false, intlTag: 'tr-TR' },
  sq: { id: 'sq', endonym: 'Shqip', dir: 'ltr', reviewed: false, intlTag: 'sq' },
  so: { id: 'so', endonym: 'Soomaali', dir: 'ltr', reviewed: false, intlTag: 'so' },
}

/**
 * The language the product is written in, and the fallback for every missing
 * string. A German fallback is safe in a way a blank is not: staff read it,
 * and a resident can point at it and ask.
 */
export const DEFAULT_LOCALE: LocaleId = 'de'

export const LOCALE_IDS = Object.keys(LOCALES) as LocaleId[]

/** The locales a resident may actually pick. @see the `reviewed` note above. */
export function offeredLocales(): Locale[] {
  return LOCALE_IDS.map((id) => LOCALES[id]).filter((locale) => locale.reviewed)
}

export function isLocaleId(value: string): value is LocaleId {
  return value in LOCALES
}

/** Cookie holding the reader's choice. Read by the server on every request. */
export const LOCALE_COOKIE = 'aoz_locale'
