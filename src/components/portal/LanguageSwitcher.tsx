'use client'

import { useRouter } from 'next/navigation'
import { Languages, Info } from 'lucide-react'
import { LOCALE_COOKIE, availableLocales } from '@/lib/i18n'
import { useLocale, useT } from '@/lib/i18n/LocaleProvider'

/**
 * Lets a resident choose their language. Staff UI does not mount this.
 *
 * Compact lives in the header — a native select of finished languages only.
 * Incomplete locales (Shqip, Soomaali, …) never appear: listing a language and
 * then showing mostly German is worse than admitting we do not have it yet.
 *
 * Unvouched complete languages still show `language.machineNotice` after the
 * choice, in the chosen language — the reader is the person who can judge.
 */
export function LanguageSwitcher({
  variant = 'compact',
}: {
  variant?: 'compact' | 'panel'
}) {
  const router = useRouter()
  const current = useLocale()
  const t = useT()
  const locales = availableLocales()

  if (locales.length < 2) return null

  function choose(id: string) {
    document.cookie = `${LOCALE_COOKIE}=${id};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
    router.refresh()
  }

  if (variant === 'compact') {
    return (
      <label className="inline-flex items-center gap-2 min-h-[44px]">
        <Languages className="w-4 h-4 text-ui-muted shrink-0" aria-hidden="true" />
        <span className="sr-only">{t('language.change')}</span>
        <select
          aria-label={t('language.change')}
          className="input py-1.5 min-h-[44px] text-sm w-auto max-w-[11rem]"
          value={current.id}
          title={!current.reviewed ? t('language.machineNotice') : undefined}
          onChange={(event) => choose(event.target.value)}
        >
          {locales.map((locale) => (
            <option key={locale.id} value={locale.id} lang={locale.id}>
              {locale.endonym}
            </option>
          ))}
        </select>
      </label>
    )
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

      {!current.reviewed && (
        <p className="mt-3 flex items-start gap-2 text-xs text-ui-muted">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          {t('language.machineNotice')}
        </p>
      )}
    </div>
  )
}
