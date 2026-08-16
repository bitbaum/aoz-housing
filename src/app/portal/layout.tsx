import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { PortalNav } from '@/components/portal/PortalNav'
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

  if (!residentCode) {
    return (
      <div className="min-h-screen bg-ui-canvas text-ui-text">{children}</div>
    )
  }

  return (
    // The bottom padding reserves the strip the fixed tab bar occupies, so the
    // end of every page — including the footer's emergency line — scrolls clear
    // of it instead of underneath it.
    <div className="min-h-screen bg-ui-canvas text-ui-text flex flex-col pb-[4.5rem] lg:pb-0">
      <a href="#portal-main" className="skip-link">Zum Inhalt springen</a>

      {/* Header with responsive navigation */}
      <header className="chrome-bar sticky top-0">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <PortalNav hasStaffAccess={hasStaffAccess} />
        </div>
      </header>

      <main id="portal-main" className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 sm:py-8">
        {children}
      </main>

      <PortalTabBar hasStaffAccess={hasStaffAccess} />

      {/* The emergency line lives here and must stay reachable on a phone —
          it is the one piece of copy on this surface that matters at 3am. It
          keeps its place in the flow; the wrapper's bottom padding is what
          lifts it clear of the fixed tab bar. */}
      <footer className="border-t border-ui-border bg-ui-surface mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-ui-muted">
            <p className="text-center sm:text-left">{PORTAL_LABELS.emergency}</p>
            <Link href="/portal/help" className="hover:text-ui-text min-h-[44px] flex items-center">
              {PORTAL_LABELS.nav.help}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
