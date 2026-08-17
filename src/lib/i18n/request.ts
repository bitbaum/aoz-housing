import { cookies, headers } from 'next/headers'
import { createTranslator, resolveLocale, type LocaleId, type Translator } from './index'
import { LOCALE_COOKIE } from './locales'

/**
 * Resolve the request locale once, on the server.
 *
 * Lives in its own module so client components never import `next/headers`.
 */
export async function getRequestTranslator(): Promise<{
  locale: LocaleId
  t: Translator
}> {
  const cookieStore = await cookies()
  const locale = resolveLocale({
    cookieValue: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: (await headers()).get('accept-language'),
  })
  return { locale, t: createTranslator(locale) }
}
