import type { Metadata } from 'next'
import Link from 'next/link'
import { MobileNav } from '@/components/layout/MobileNav'
import { NAV_ITEMS, NAV_ICONS } from '@/lib/config/navigation'
import { APP_LABELS } from '@/lib/constants/labels'
import './globals.css'

export const metadata: Metadata = {
  title: APP_LABELS.metaTitle,
  description: APP_LABELS.metaDescription,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-aoz-background">
        {/* Top Header Bar - AOZ Branding */}
        <header className="hidden md:block bg-aoz-secondary text-white">
          <div className="max-w-screen-2xl mx-auto px-6 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-3 hover:opacity-90">
                  <span className="text-aoz-primary font-bold text-2xl tracking-tight">AOZ</span>
                  <div>
                    <span className="font-semibold">Wohnen</span>
                    <span className="hidden lg:inline text-white/70 ml-2 text-sm">
                      {APP_LABELS.tagline}
                    </span>
                  </div>
                </Link>
              </div>
              <nav className="flex items-center gap-1">
                <HeaderLink href="/algorithm">Algorithmus</HeaderLink>
                <HeaderLink href="/analytics">Statistiken</HeaderLink>
                <HeaderLink href="/portal/help">Hilfe</HeaderLink>
              </nav>
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

          {/* Desktop Sidebar - hidden on mobile */}
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
            {/* Content area */}
            <div className="flex-1 p-4 pt-16 md:p-6 md:pt-6">
              {children}
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 px-6 py-4 mt-auto">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="text-aoz-primary font-bold text-lg tracking-tight">AOZ</span>
                  <span className="font-medium text-gray-700">Wohnen</span>
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
      </body>
    </html>
  )
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
    >
      {children}
    </Link>
  )
}

function MegaMenuItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:text-aoz-primary hover:bg-gray-50 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={NAV_ICONS[icon] || NAV_ICONS.home}
        />
      </svg>
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
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="absolute left-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[220px]">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2 hover:bg-gray-50 transition-colors"
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
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-aoz-primary hover:bg-aoz-accent rounded-md transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={NAV_ICONS[icon] || NAV_ICONS.home}
        />
      </svg>
      <span>{children}</span>
    </Link>
  )
}
