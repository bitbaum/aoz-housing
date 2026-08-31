/**
 * Which languages the RESIDENT PORTAL speaks — SSOT.
 *
 * SCOPE. These dictionaries, LocaleProvider and LanguageSwitcher are the
 * resident-facing portal (`src/app/portal/`). Staff surfaces stay German.
 * Caseworkers speak Swiss state languages plus English; they do not need
 * Tigrinya, Arabic, Farsi or Turkish on `/residents` or the megamenu.
 * Wiring origin-language dictionaries into `(admin)` is wasted work and a
 * false promise. `infra-ssot.test.ts` forbids LocaleProvider there.
 *
 * WHY THESE LANGUAGES. They are not a guess at "popular languages". They are
 * the ones the people living in this housing actually read: the largest asylum
 * origin groups in Switzerland, plus the national and lingua-franca languages
 * that let a resident and a caseworker meet somewhere in the middle. Adding one
 * is a dictionary file and a line here, never a code change.
 *
 * OFFERED vs VOUCHED FOR — two different questions, deliberately separated.
 *
 * A language is OFFERED when its dictionary is complete. That is the bar for
 * appearing in the picker, and every written language clears it.
 *
 * A language is VOUCHED FOR when someone who can speak it has read every
 * string. Most are not, and pretending otherwise would be the dishonest part.
 *
 * These used to be the same flag, which meant withholding a finished language
 * from the people who need it in order to express a caveat — the caveat won
 * over the reader, which is the wrong trade for someone who cannot read the
 * German. So the caveat is now shown IN the app, next to the language, where
 * the person choosing it can weigh it: `language.machineNotice`. They get
 * their language and they get told it has not been checked.
 *
 * `i18n.test.ts` holds both halves: a locale cannot be offered while its
 * dictionary is incomplete, and an unvouched locale must carry the notice.
 */

export type LocaleId = 'de' | 'en' | 'fr' | 'uk' | 'ru' | 'ar' | 'fa' | 'ti' | 'tr' | 'sq' | 'so'

export type TextDirection = 'ltr' | 'rtl'

export interface Locale {
  id: LocaleId
  /** The language's name IN that language — nobody looks for "German". */
  endonym: string
  dir: TextDirection
  /**
   * True once someone who can vouch for this language has read every string.
   *
   * This no longer decides whether the language is offered — completeness
   * does. It decides whether the reader is warned. An unvouched language is
   * shown with `language.machineNotice` in the picker, so the person best
   * placed to judge the translation is told it is unchecked, in their own
   * language.
   *
   * Every dictionary here was written by the same author, so the honest state
   * for most of them is false. Each unvouched file opens with the specific
   * questions a reviewer has to answer, so "please review this" is a question
   * rather than a chore.
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
  // A Swiss national language, and the non-German locale a resident and a
  // caseworker are most likely to share. Vouched for on the same basis as
  // English.
  fr: { id: 'fr', endonym: 'Français', dir: 'ltr', reviewed: true, intlTag: 'fr-CH' },
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

/**
 * The locales a resident may pick: every one with a complete dictionary.
 *
 * Completeness is computed from the dictionaries rather than declared here, so
 * a half-written language cannot be listed by editing a boolean — the list
 * follows the work.
 */
export function offeredLocales(isComplete: (id: LocaleId) => boolean): Locale[] {
  return LOCALE_IDS.map((id) => LOCALES[id]).filter((locale) => isComplete(locale.id))
}

export function isLocaleId(value: string): value is LocaleId {
  return value in LOCALES
}

/** Cookie holding the reader's choice. Read by the server on every request. */
export const LOCALE_COOKIE = 'aoz_locale'
