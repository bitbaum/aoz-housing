import type { LocaleId } from '@/lib/i18n/locales'

/**
 * Which languages the PUBLIC pages come in, and where each one lives.
 *
 * WHY THIS IS ITS OWN MODULE, SEPARATE FROM THE COPY. Two very different
 * callers need these facts. `marketing.ts` needs them next to the words.
 * `route-boundaries.ts` needs them so middleware lets the localised URLs
 * through without a session — and middleware runs on the edge, where importing
 * three files of landing-page prose to learn the string "/fr/willkommen" would
 * be absurd. So the LIST lives here, with no dependency on any copy, and both
 * sides read it.
 *
 * The alternative — writing `/fr/willkommen` into `PUBLIC_ROUTES` by hand —
 * is how a language ships with a page that renders and a middleware that
 * redirects it to the login form. `public-routes-reachable.test.ts` caught
 * exactly that when this route was added, which is the only reason it is not
 * how this shipped.
 *
 * Deliberately a much shorter list than the resident portal's eleven, and the
 * difference is not laziness — it is who is reading. The portal is read by the
 * people living in this housing, so it speaks Tigrinya, Arabic, Farsi and the
 * other origin languages. This page is read by someone deciding whether to use
 * the product, or by a resident who has not signed in yet.
 *
 * Listing a language here does not OFFER it. `publicLocales()` in
 * `marketing.ts` offers the ones whose copy is actually complete.
 */
export const PUBLIC_LOCALE_IDS = ['de', 'en', 'fr'] as const satisfies readonly LocaleId[]

export type PublicLocaleId = (typeof PUBLIC_LOCALE_IDS)[number]

/**
 * The language the product is written in. It keeps the unprefixed URL
 * (`/willkommen`), so no existing link, bookmark or deploy probe moves.
 */
export const PUBLIC_DEFAULT_LOCALE: PublicLocaleId = 'de'

export function isPublicLocale(value: string): value is PublicLocaleId {
  return (PUBLIC_LOCALE_IDS as readonly string[]).includes(value)
}

/**
 * The locales the `/[lang]/willkommen` route actually serves — everything
 * except German, which keeps the unprefixed URL.
 *
 * A named list rather than a `.filter(id => id !== 'de')` written twice.
 * `generateStaticParams` needs it to know what to build, and the
 * public-route reachability test needs it to know which concrete URLs exist.
 * Those two disagreeing produces a page that either is not built or is not
 * declared public, and the second one 404s only for anonymous readers — the
 * only readers that route has.
 */
export const PREFIXED_LOCALE_IDS: PublicLocaleId[] = PUBLIC_LOCALE_IDS.filter(
  (id): id is Exclude<PublicLocaleId, typeof PUBLIC_DEFAULT_LOCALE> =>
    id !== PUBLIC_DEFAULT_LOCALE
)

/**
 * Where a language's landing page lives — SSOT for the router, the switcher,
 * the `hreflang` tags and the middleware allow-list.
 *
 * German is unprefixed and the others are not, so this is a branch rather than
 * a template. One function means the four callers cannot drift into three
 * slightly different answers.
 */
export function landingPath(locale: PublicLocaleId): string {
  return locale === PUBLIC_DEFAULT_LOCALE ? '/willkommen' : `/${locale}/willkommen`
}

/**
 * Every landing URL, for the middleware allow-list.
 *
 * Built from the full list rather than from the offered ones on purpose: this
 * decides whether a URL needs a SESSION, and the answer is no for all of them.
 * Gating an unfinished language behind the login form would be a strange way to
 * say "not translated yet" — the route simply does not exist, and Next answers
 * 404, which is the accurate thing for a stranger to be told.
 */
export const LANDING_ROUTES: string[] = PUBLIC_LOCALE_IDS.map(landingPath)
