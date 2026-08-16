import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { createTranslator, resolveLocale, LOCALE_COOKIE, LOCALES } from '@/lib/i18n'
import { LocaleProvider } from '@/lib/i18n/LocaleProvider'
import { PortalNav } from '@/components/portal/PortalNav'
import { PortalSidebar } from '@/components/portal/PortalSidebar'
import { PortalTabBar } from '@/components/portal/PortalTabBar'
import { RESIDENT_COOKIE, STAFF_COOKIE } from '@/lib/auth/constants'

export const metadata: Metadata = {
  title: {
    template: '%s | Bewohnerportal',
    default: 'Bewohnerportal',
  },
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const residentCode = cookieStore.get(RESIDENT_COOKIE)?.value
  const hasStaffAccess = !!cookieStore.get(STAFF_COOKIE)?.value

  // Resolved once, on the server, and handed down. Deriving it again in the
  // browser is how a page ends up half-translated after hydration.
  const locale = resolveLocale({
    cookieValue: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: (await headers()).get('accept-language'),
  })
  const t = createTranslator(locale)

  if (!residentCode) {
    return (
      <div className="min-h-screen bg-ui-canvas text-ui-text">{children}</div>
    )
  }

  return (
    // The bottom padding reserves the strip the fixed tab bar occupies, so the
    // end of every page — including the footer's emergency line — scrolls clear
    // of it instead of underneath it.
    // `lang` and `dir` sit here rather than on <html>: the root layout reads no
    // cookies, which is what keeps the blog and landing pages prerenderable at
    // build time. Direction is not styling — laid out left-to-right, Arabic is
    // not merely ugly, it is unreadable.
    <div
      lang={locale}
      dir={LOCALES[locale].dir}
      className="min-h-screen bg-ui-canvas text-ui-text flex flex-col pb-[4.5rem] lg:pb-0"
    >
      <LocaleProvider locale={locale}>
      <a href="#portal-main" className="skip-link">Zum Inhalt springen</a>

      {/* Sidebar beside the content on desktop, tab bar below it on mobile.
          Both are permanent and both are generated from the same nav config,
          so the two form factors cannot drift into saying different things. */}
      <div className="flex flex-1 min-h-0">
        <PortalSidebar hasStaffAccess={hasStaffAccess} />

        <div className="flex flex-col flex-1 min-w-0">
          {/* Below `lg` this is the whole header. At `lg` the sidebar carries
              the brand and this row would only repeat it. */}
          <header className="chrome-bar sticky top-0 lg:hidden">
            <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
              <PortalNav />
            </div>
          </header>

          <main
            id="portal-main"
            className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 lg:px-8"
          >
            {children}
          </main>

          {/* The emergency line must stay reachable on a phone — it is the one
              piece of copy on this surface that matters at 3am. The wrapper's
              bottom padding lifts it clear of the fixed tab bar. */}
          <footer className="border-t border-ui-border bg-ui-surface mt-auto">
            <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 lg:px-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-ui-muted">
                <p className="text-center sm:text-start">{t('safety.emergency')}</p>
                <Link href="/portal/help" className="hover:text-ui-text min-h-[44px] flex items-center">
                  {t('nav.help')}
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <PortalTabBar hasStaffAccess={hasStaffAccess} />
      </LocaleProvider>
    </div>
  )
}
