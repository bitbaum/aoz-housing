import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { MobileNav } from '@/components/layout/MobileNav'
import { UserMenu } from '@/components/layout/UserMenu'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NAV_ICONS, MEGAMENU_GROUPS } from '@/lib/config/navigation'
import { APP_LABELS } from '@/lib/constants/labels'
import { getCurrentUser } from '@/lib/auth'

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
  const hasPortalAccess = !!cookieStore.get('resident_code')?.value

  return (
    <>
      {/* Top Header Bar */}
      <header className="hidden md:flex items-center bg-ui-surface text-ui-text border-b border-ui-border z-50">
        <div className="max-w-screen-2xl mx-auto px-6 py-2.5 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo href="/" size="lg" showTagline />
            </div>
            <div className="flex items-center gap-4">
              <nav className="flex items-center gap-1">
                <HeaderLink href="/algorithm">{APP_LABELS.algorithm}</HeaderLink>
                <HeaderLink href="/analytics">{APP_LABELS.statistics}</HeaderLink>
                <HeaderLink href="/portal/help">{APP_LABELS.help}</HeaderLink>
              </nav>
              <ThemeToggle />
              {user && (
                <UserMenu
                  user={{
                    name: user.name,
                    email: user.email,
                    role: user.role,
                  }}
                  hasPortalAccess={hasPortalAccess}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Megamenu Navigation */}
      <nav className="hidden md:block bg-ui-surface/95 backdrop-blur border-b border-ui-border sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex items-center gap-0.5">
            {MEGAMENU_GROUPS.map((group) =>
              'items' in group ? (
                <MegaMenuDropdown key={group.label} label={group.label} items={group.items} />
              ) : (
                <MegaMenuItem key={group.href} href={group.href} icon={group.icon} label={group.label} />
              )
            )}
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-96px)]">
        {/* Mobile Navigation */}
        <MobileNav />

        {/* Main content */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 p-4 pt-16 md:p-6 md:pt-6">
            {children}
          </div>

          {/* Footer */}
          <footer className="bg-ui-surface border-t border-ui-border px-6 py-4 mt-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3 text-ui-muted">
                <Logo size="sm" />
                <span className="text-ui-border-strong">|</span>
                <span>{APP_LABELS.metaDescription}</span>
              </div>
              <div className="flex items-center gap-4 text-ui-muted">
                <Link href="/algorithm" className="hover:text-ui-text transition-colors">
                  {APP_LABELS.algorithm}
                </Link>
                <Link href="/portal/help" className="hover:text-ui-text transition-colors">
                  {APP_LABELS.help}
                </Link>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </>
  )
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-sm text-ui-muted hover:text-ui-text hover:bg-ui-subtle rounded-md transition-colors min-h-[44px] inline-flex items-center"
    >
      {children}
    </Link>
  )
}

function MegaMenuItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  const Icon = NAV_ICONS[icon] || NAV_ICONS.home
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-3.5 text-sm font-medium text-ui-muted hover:text-ui-text hover:bg-ui-subtle rounded-md transition-colors duration-150"
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  )
}

function MegaMenuDropdown({
  label,
  items,
}: {
  label: string
  items: { href: string; label: string; desc: string }[]
}) {
  return (
    <div className="relative group">
      <button
        className="flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium text-ui-muted hover:text-ui-text hover:bg-ui-subtle rounded-md transition-colors duration-150"
        aria-haspopup="true"
      >
        {label}
        <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="absolute left-0 top-full pt-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-150 z-50">
        <div className="bg-ui-elevated rounded-lg shadow-card-hover border border-ui-border py-2 min-w-[230px]">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2.5 hover:bg-ui-subtle transition-colors min-h-[44px] flex flex-col justify-center"
            >
              <div className="font-medium text-ui-text text-sm leading-tight">{item.label}</div>
              <div className="text-xs text-ui-muted mt-0.5">{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
