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
import { visibleMegaMenuGroups, visibleSystemLinks } from '@/lib/config/navigation'

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

  const megaMenuGroups = visibleMegaMenuGroups(user.role)
  const systemLinks = visibleSystemLinks(user.role)

  return (
    <>
      <a href="#admin-main" className="skip-link">Zum Inhalt springen</a>

      {/* Single sticky bar — logo + megamenu + secondary links + actions.
          x.ai-style: one row of chrome instead of stacking a brand bar on
          top of a megamenu strip. Total chrome ≈ 56px on desktop. */}
      <header className="chrome-bar sticky top-0 hidden md:block">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex items-center justify-between gap-6 h-14">
            <div className="flex items-center gap-6 min-w-0">
              <Logo href="/" size="md" />
              <AdminMegaMenu groups={megaMenuGroups} />
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <UserMenu
                user={{ name: user.name, email: user.email, role: user.role }}
                hasPortalAccess={hasPortalAccess}
                systemLinks={systemLinks}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-56px)]">
        <MobileNav groups={megaMenuGroups} systemLinks={systemLinks} />
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
 * Single-line footer: the quiet brand line. Deliberately carries NO nav —
 * system destinations have exactly one home (SYSTEM_LINKS, rendered by the
 * user menu and the mobile drawer), so the footer never drifts from them.
 */
function AdminFooter() {
  return (
    <footer className="hidden md:block border-t border-ui-border bg-ui-canvas">
      <div className="max-w-screen-2xl mx-auto px-6 py-3 text-xs text-ui-muted">
        <p>{APP_LABELS.name} · {APP_LABELS.tagline}</p>
      </div>
    </footer>
  )
}
