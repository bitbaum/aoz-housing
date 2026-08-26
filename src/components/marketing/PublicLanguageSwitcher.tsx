'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LOCALES } from '@/lib/i18n/locales'
import {
  PUBLIC_DEFAULT_LOCALE,
  publicLocales,
  type PublicLocaleId,
} from '@/lib/constants/labels/marketing'
import { landingPath } from '@/lib/config/public-locales'

/**
 * The language switcher for the pages you can read without an account.
 *
 * IT ONLY APPEARS WHERE THERE IS SOMETHING TO SWITCH TO. The landing page is
 * translated; the blog, roadmap and changelog are long-form German writing and
 * are not. A switcher rendered on all four would offer a French reader on
 * `/blog` a button that either does nothing or silently moves them to a
 * different page — which is how a language picker stops being trusted. So it
 * renders on the landing page and nowhere else, and the check is on the
 * pathname rather than on a prop nobody would remember to pass.
 *
 * NO COOKIE, NO STATE, NO JAVASCRIPT NEEDED TO WORK. Each language is a plain
 * link to that language's URL. `usePathname` is used only to know which link is
 * the current one — if the client bundle never loads, the links still work,
 * which is the right failure mode for the first page a stranger sees.
 *
 * The endonym is the label: nobody scanning for their own language looks for
 * the word "German". @see i18n/locales.ts, which is where these names live for
 * the portal too — one list of what each language calls itself.
 */
export function PublicLanguageSwitcher() {
  const pathname = usePathname()
  const offered = publicLocales()

  // One language is not a choice. If a brand ships only German, this whole
  // control is noise and the header is better without it.
  if (offered.length < 2) return null

  const current = offered.find((locale) => landingPath(locale.id as PublicLocaleId) === pathname)
  if (!current) return null

  return (
    <nav aria-label="Sprache / Language / Langue" className="flex items-center gap-0.5">
      {offered.map((locale) => {
        const isCurrent = locale.id === current.id
        return (
          <Link
            key={locale.id}
            href={landingPath(locale.id as PublicLocaleId)}
            hrefLang={LOCALES[locale.id].intlTag}
            // `aria-current` rather than a visual-only highlight: the current
            // language has to be announced, not just coloured.
            aria-current={isCurrent ? 'page' : undefined}
            className={
              isCurrent
                ? 'btn-ghost text-sm px-2 text-ui-text font-semibold'
                : 'btn-ghost text-sm px-2 text-ui-muted'
            }
          >
            {locale.endonym}
          </Link>
        )
      })}
    </nav>
  )
}

/** Exported for the test that pins the "German is unprefixed" rule end to end. */
export const PUBLIC_SWITCHER_DEFAULT = PUBLIC_DEFAULT_LOCALE
