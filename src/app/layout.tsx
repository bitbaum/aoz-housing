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
        <div className="flex min-h-screen">
          {/* Mobile Navigation */}
          <MobileNav />

          {/* Desktop Sidebar - hidden on mobile */}
          <aside className="hidden md:block w-64 bg-white border-r border-gray-200 fixed h-full">
            <div className="p-6">
              <h1 className="text-xl font-bold text-aoz-secondary">{APP_LABELS.name}</h1>
              <p className="text-sm text-gray-500 mt-1">{APP_LABELS.tagline}</p>
            </div>
            <nav className="px-4">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} href={item.href} icon={item.icon}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
            {/* Desktop header */}
            <header className="hidden md:block bg-white border-b border-gray-200 px-8 py-3">
              <div className="flex items-center justify-between">
                <nav className="flex items-center gap-6">
                  <Link
                    href="/algorithm"
                    className="text-sm text-gray-600 hover:text-aoz-primary transition-colors"
                  >
                    Algorithmus
                  </Link>
                  <Link
                    href="/analytics"
                    className="text-sm text-gray-600 hover:text-aoz-primary transition-colors"
                  >
                    Auswertung
                  </Link>
                </nav>
                <div className="flex items-center gap-4">
                  <Link href="/portal/help" className="btn-outline text-sm">
                    Hilfe
                  </Link>
                </div>
              </div>
            </header>
            {/* Content area - add top padding for mobile header */}
            <div className="flex-1 p-4 pt-16 md:p-8 md:pt-8">
              {children}
            </div>
            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 px-8 py-6 mt-auto">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-6">
                  <span>AOZ Wohnen</span>
                  <Link href="/algorithm" className="hover:text-aoz-primary">
                    Algorithmus
                  </Link>
                  <Link href="/analytics" className="hover:text-aoz-primary">
                    System-Metriken
                  </Link>
                  <Link href="/portal/help" className="hover:text-aoz-primary">
                    Hilfe
                  </Link>
                </div>
                <div className="text-gray-400">
                  Kompatibilitätsbasiertes Platzierungssystem
                </div>
              </div>
            </footer>
          </main>
        </div>
      </body>
    </html>
  )
}

function NavLink({
  href,
  icon,
  children
}: {
  href: string
  icon: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-aoz-primary hover:bg-aoz-accent rounded-lg transition-colors"
    >
      <span className="w-8 h-8 rounded-full bg-aoz-accent flex items-center justify-center text-aoz-primary">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={NAV_ICONS[icon] || NAV_ICONS.home}
          />
        </svg>
      </span>
      <span>{children}</span>
    </Link>
  )
}
