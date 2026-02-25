import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { MobileNav } from '@/components/layout/MobileNav'
import { UserMenu } from '@/components/layout/UserMenu'
import { Logo } from '@/components/ui/Logo'
import { NAV_ITEMS, NAV_ICONS } from '@/lib/config/navigation'
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
      {/* Top Header Bar - AOZ Branding */}
      <header className="hidden md:block bg-aoz-secondary text-white">
        <div className="max-w-screen-2xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo href="/" size="lg" showTagline />
            </div>
            <div className="flex items-center gap-4">
              <nav className="flex items-center gap-1">
                <HeaderLink href="/algorithm">Algorithmus</HeaderLink>
                <HeaderLink href="/analytics">Statistiken</HeaderLink>
                <HeaderLink href="/portal/help">Hilfe</HeaderLink>
              </nav>
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
      <nav className="hidden md:block bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex items-center gap-1">
            <MegaMenuItem href="/" icon="home" label="Dashboard" />
            <MegaMenuDropdown
              label="Personen"
              items={[
                { href: '/residents', label: 'Alle Bewohner', desc: 'Bewohnerliste verwalten' },
                { href: '/residents/new', label: 'Neuer Bewohner', desc: 'Bewohner erfassen' },
                { href: '/matching', label: 'Matching', desc: 'Platzierung finden' },
              ]}
            />
            <MegaMenuDropdown
              label="Unterkünfte"
              items={[
                { href: '/housing', label: 'Alle Einheiten', desc: 'Wohneinheiten verwalten' },
                { href: '/housing/new', label: 'Neue Einheit', desc: 'Einheit hinzufügen' },
                { href: '/placements', label: 'Platzierungen', desc: 'Aktive Platzierungen' },
              ]}
            />
            <MegaMenuDropdown
              label="Monitoring"
              items={[
                { href: '/incidents', label: 'Vorfälle', desc: 'Konflikte & Wartung' },
                { href: '/analytics', label: 'Statistiken', desc: 'Auswertungen & Berichte' },
                { href: '/maintenance', label: 'Wartung', desc: 'Wartungsaufgaben' },
              ]}
            />
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-100px)]">
        {/* Mobile Navigation */}
        <MobileNav />

        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-56 bg-white border-r border-gray-200 fixed top-[100px] h-[calc(100vh-100px)] overflow-y-auto">
          <nav className="p-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
              Navigation
            </div>
            {NAV_ITEMS.map((item) => (
              <SidebarLink key={item.href} href={item.href} icon={item.icon}>
                {item.label}
              </SidebarLink>
            ))}
            <div className="border-t border-gray-200 mt-4 pt-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
                System
              </div>
              <SidebarLink href="/algorithm" icon="brain">
                Algorithmus
              </SidebarLink>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-56 flex flex-col">
          <div className="flex-1 p-4 pt-16 md:p-6 md:pt-6">
            {children}
          </div>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 px-6 py-4 mt-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3 text-gray-500">
                <Logo size="sm" />
                <span className="text-gray-400">|</span>
                <span className="text-gray-500">{APP_LABELS.metaDescription}</span>
              </div>
              <div className="flex items-center gap-4 text-gray-400">
                <Link href="/algorithm" className="hover:text-aoz-primary transition-colors">
                  Algorithmus
                </Link>
                <Link href="/portal/help" className="hover:text-aoz-primary transition-colors">
                  Hilfe
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
      className="px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors min-h-[44px] inline-flex items-center"
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
      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:text-aoz-primary hover:bg-gray-50 transition-colors"
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
      <button className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-700 hover:text-aoz-primary hover:bg-gray-50 transition-colors">
        {label}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="absolute left-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[220px]">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-3 hover:bg-gray-50 transition-colors min-h-[44px]"
            >
              <div className="font-medium text-gray-900 text-sm">{item.label}</div>
              <div className="text-xs text-gray-500">{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function SidebarLink({
  href,
  icon,
  children,
}: {
  href: string
  icon: string
  children: React.ReactNode
}) {
  const Icon = NAV_ICONS[icon] || NAV_ICONS.home
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-600 hover:text-aoz-primary hover:bg-aoz-accent rounded-md transition-colors min-h-[44px]"
    >
      <Icon className="w-4 h-4" />
      <span>{children}</span>
    </Link>
  )
}
