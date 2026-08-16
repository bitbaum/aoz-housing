'use client'

import { useRouter } from 'next/navigation'
import { Languages } from 'lucide-react'
import { LOCALE_COOKIE, offeredLocales } from '@/lib/i18n/locales'
import { useLocale, useT } from '@/lib/i18n/LocaleProvider'

/**
 * Lets a resident choose their language.
 *
 * Only reviewed languages appear. A picker that lists a language and then shows
 * mostly German is a worse experience than one that admits we do not have it
 * yet — and on a surface about house rules and emergencies, a half-translation
 * is a safety problem rather than an inconvenience.
 */
export function LanguageSwitcher() {
  const router = useRouter()
  const current = useLocale()
  const t = useT()
  const locales = offeredLocales()

  // One language means no choice to make; a control with a single option is
  // just clutter that implies a setting exists.
  if (locales.length < 2) return null

  function choose(id: string) {
    // A year, path-wide: the choice must survive both a session ending and a
    // move between the portal and the login page, or a resident re-picks their
    // language every time they sign in.
    document.cookie = `${LOCALE_COOKIE}=${id};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
    router.refresh()
  }

  return (
    <div className="px-3 py-2">
      <p className="eyebrow flex items-center gap-2 mb-2">
        <Languages className="w-3.5 h-3.5" aria-hidden="true" />
        {t('language.label')}
      </p>

      <div className="flex flex-wrap gap-2">
        {locales.map((locale) => {
          const active = locale.id === current.id
          return (
            <button
              key={locale.id}
              type="button"
              onClick={() => choose(locale.id)}
              aria-current={active ? 'true' : undefined}
              lang={locale.id}
              // The name is written in its own language and marked with `lang`,
              // so a screen reader pronounces it in that language rather than
              // reading Ukrainian letters with a German voice.
              className={`min-h-[44px] px-3 rounded-md border text-sm transition-colors ${
                active
                  ? 'border-brand-primary text-ui-text'
                  : 'border-ui-border text-ui-muted hover:border-ui-border-strong hover:text-ui-text'
              }`}
            >
              {locale.endonym}
            </button>
          )
        })}
      </div>
    </div>
  )
}
