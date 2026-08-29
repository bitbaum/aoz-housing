'use client'

import { createContext, useContext, useMemo } from 'react'
import { createTranslator, type MessageKey } from '@/lib/i18n'
import { DEFAULT_LOCALE, LOCALES, type Locale, type LocaleId } from '@/lib/i18n/locales'

/**
 * Carries the reader's language to client components.
 *
 * The locale is resolved ONCE on the server, per request, and handed down. It
 * is deliberately not re-derived in the browser: two places deciding what
 * language a page is in will eventually disagree, and the disagreement shows up
 * as a page that is half German after hydration.
 */

interface LocaleContextValue {
  locale: Locale
  t: (key: MessageKey) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({
  locale,
  children,
}: {
  locale: LocaleId
  children: React.ReactNode
}) {
  const value = useMemo<LocaleContextValue>(
    () => ({ locale: LOCALES[locale], t: createTranslator(locale) }),
    [locale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

/**
 * Falls back to German rather than throwing when no provider is above.
 *
 * A component rendered outside the provider is a wiring mistake, but blowing up
 * the whole tree over it would take down a working page to punish a missing
 * translation. German text and a working page is the better failure.
 */
export function useT(): (key: MessageKey) => string {
  const context = useContext(LocaleContext)
  return context?.t ?? createTranslator(DEFAULT_LOCALE)
}

export function useLocale(): Locale {
  const context = useContext(LocaleContext)
  return context?.locale ?? LOCALES[DEFAULT_LOCALE]
}
