import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { MobileNav } from '@/components/layout/MobileNav'
import { UserMenu } from '@/components/layout/UserMenu'
import { AdminMegaMenu } from '@/components/layout/AdminHeader'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { APP_LABELS, PAGE_TITLES } from '@/lib/constants/labels'
import { getCurrentUser } from '@/lib/auth'
import { RESIDENT_COOKIE } from '@/lib/auth/constants'

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_LABELS.name}`,
    default: APP_LABELS.name,
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  const cookieStore = await cookies()
  const hasPortalAccess = !!cookieStore.get(RESIDENT_COOKIE)?.value

  if (!user) {
    redirect('/login')
  }

  return (
    <>
      <a href="#admin-main" className="skip-link">Zum Inhalt springen</a>

      {/* Single sticky bar — logo + megamenu + secondary links + actions.
          x.ai-style: one row of chrome instead of stacking a brand bar on
          top of a megamenu strip. Total chrome ≈ 56px on desktop. */}
      <header className="hidden md:block bg-ui-canvas/90 backdrop-blur-md border-b border-ui-border sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex items-center justify-between gap-6 h-14">
            <div className="flex items-center gap-6 min-w-0">
              <Logo href="/" size="md" />
              <AdminMegaMenu />
            </div>
            <div className="flex items-center gap-1">
              <SecondaryLink href="/algorithm">{APP_LABELS.algorithm}</SecondaryLink>
              <SecondaryLink href="/portal/help">{APP_LABELS.help}</SecondaryLink>
              <div className="hidden 2xl:block w-px h-5 bg-ui-border mx-2" aria-hidden="true" />
              <ThemeToggle />
              <UserMenu
                user={{ name: user.name, email: user.email, role: user.role }}
                hasPortalAccess={hasPortalAccess}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-56px)]">
        <MobileNav />
        <main id="admin-main" className="flex-1 flex flex-col">
          <div className="flex-1 p-4 pt-16 md:p-6 md:pt-6">
            {children}
          </div>
        </main>
      </div>

      <AdminFooter />
    </>
  )
}

/**
 * Compact secondary link in the admin header.
 *
 * Shown from 2xl only. Below that the megamenu (which is `whitespace-nowrap`
 * and cannot shrink) is wider than the space `justify-between` leaves it, so
 * these links overlapped and swallowed the clicks for the last megamenu entry
 * — at 1280px the centre of "Einstellungen" hit-tested to "Algorithmus".
 * Both destinations remain reachable from the footer and the mobile drawer.
 */
function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="hidden 2xl:inline-flex items-center px-3 py-2 text-sm text-ui-muted hover:text-ui-text hover:bg-ui-subtle rounded-md transition-colors min-h-[40px]"
    >
      {children}
    </Link>
  )
}

/** Single-line footer. Hidden on mobile (the drawer carries those links). */
function AdminFooter() {
  return (
    <footer className="hidden md:block border-t border-ui-border bg-ui-canvas">
      <div className="max-w-screen-2xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ui-muted">
        <p>{APP_LABELS.name} · {APP_LABELS.tagline}</p>
        {/* Carries the secondary links at every desktop width — the header only
            has room for them from 2xl up (see SecondaryLink). */}
        <nav className="flex items-center gap-4">
          <Link href="/algorithm" className="hover:text-ui-text transition-colors">{APP_LABELS.algorithm}</Link>
          <Link href="/portal/help" className="hover:text-ui-text transition-colors">{APP_LABELS.help}</Link>
          <Link href="/settings" className="hover:text-ui-text transition-colors">{PAGE_TITLES.settings}</Link>
        </nav>
      </div>
    </footer>
  )
}
