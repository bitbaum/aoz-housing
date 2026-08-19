import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { LOCALES } from '@/lib/i18n'
import { getRequestTranslator } from '@/lib/i18n/request'
import { LocaleProvider } from '@/lib/i18n/LocaleProvider'
import { PortalNav } from '@/components/portal/PortalNav'
import { PortalSidebar } from '@/components/portal/PortalSidebar'
import { PortalTabBar } from '@/components/portal/PortalTabBar'
import { RESIDENT_COOKIE, STAFF_COOKIE } from '@/lib/auth/constants'
import { prisma } from '@/lib/db'
import { residentUnreadCount } from '@/lib/messaging/queries'

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
  const resident = residentCode
    ? await prisma.resident.findUnique({
        where: { code: residentCode },
        select: { id: true },
      })
    : null
  const messageUnreadCount = resident ? await residentUnreadCount(resident.id) : 0

  const { locale, t } = await getRequestTranslator()

  if (!residentCode) {
    return (
      <div className="min-h-screen bg-ui-canvas text-ui-text">{children}</div>
    )
  }

  return (
    // Bottom padding clears the fixed tab bar. `lang`/`dir` sit here rather
    // than on <html> so the landing page stays prerenderable.
    <div
      lang={locale}
      dir={LOCALES[locale].dir}
      className="min-h-screen bg-ui-canvas text-ui-text flex flex-col pb-[4.5rem] lg:pb-0"
    >
      <LocaleProvider locale={locale}>
        <PortalUrlFeedback />
        <a href="#portal-main" className="skip-link">Zum Inhalt springen</a>

        <header className="chrome-bar sticky top-0 z-30 h-14">
          <div className="h-full px-4 lg:px-6 flex items-center">
            <PortalNav hasStaffAccess={hasStaffAccess} />
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          <PortalSidebar messageUnreadCount={messageUnreadCount} />

          <div className="flex-1 min-w-0 flex flex-col">
            <main id="portal-main" className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 sm:py-8">
              {children}
            </main>

            <footer className="border-t border-ui-border bg-ui-surface mt-auto">
              <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
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

        <PortalTabBar messageUnreadCount={messageUnreadCount} />
      </LocaleProvider>
    </div>
  )
}
