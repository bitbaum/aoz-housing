'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { PORTAL_LABELS } from '@/lib/constants/labels'

export function PortalNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <div className="flex items-center justify-between">
        <Link href="/portal" className="text-lg sm:text-xl font-bold text-aoz-primary">
          {PORTAL_LABELS.title}
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden sm:flex items-center gap-1 md:gap-2">
          <PortalNavLink href="/portal" active={pathname === '/portal'}>{PORTAL_LABELS.nav.overview}</PortalNavLink>
          <PortalNavLink href="/portal/roommates" active={pathname === '/portal/roommates'}>{PORTAL_LABELS.nav.roommates}</PortalNavLink>
          <PortalNavLink href="/portal/chores" active={pathname.startsWith('/portal/chores')}>{PORTAL_LABELS.nav.chores}</PortalNavLink>
          <PortalNavLink href="/portal/housing" active={pathname === '/portal/housing'}>{PORTAL_LABELS.nav.housing}</PortalNavLink>
          <PortalNavLink href="/portal/report" active={pathname === '/portal/report'}>{PORTAL_LABELS.nav.report}</PortalNavLink>
          <PortalNavLink href="/portal/preferences" active={pathname === '/portal/preferences'}>{PORTAL_LABELS.nav.preferences}</PortalNavLink>
          <PortalNavLink href="/portal/help" active={pathname === '/portal/help'}>{PORTAL_LABELS.nav.help}</PortalNavLink>
          <form action="/api/portal/logout" method="POST" className="ml-2">
            <button
              type="submit"
              className="min-h-[44px] px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {PORTAL_LABELS.nav.logout}
            </button>
          </form>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={menuOpen ? 'Menü schliessen' : 'Menü öffnen'}
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile navigation dropdown */}
      {menuOpen && (
        <nav className="sm:hidden pt-3 pb-1 border-t border-gray-100 mt-3 flex flex-col gap-1">
          <PortalNavLinkMobile href="/portal" active={pathname === '/portal'} onClick={() => setMenuOpen(false)}>
            {PORTAL_LABELS.nav.overview}
          </PortalNavLinkMobile>
          <PortalNavLinkMobile href="/portal/roommates" active={pathname === '/portal/roommates'} onClick={() => setMenuOpen(false)}>
            {PORTAL_LABELS.nav.roommates}
          </PortalNavLinkMobile>
          <PortalNavLinkMobile href="/portal/chores" active={pathname.startsWith('/portal/chores')} onClick={() => setMenuOpen(false)}>
            {PORTAL_LABELS.nav.chores}
          </PortalNavLinkMobile>
          <PortalNavLinkMobile href="/portal/housing" active={pathname === '/portal/housing'} onClick={() => setMenuOpen(false)}>
            {PORTAL_LABELS.nav.housing}
          </PortalNavLinkMobile>
          <PortalNavLinkMobile href="/portal/report" active={pathname === '/portal/report'} onClick={() => setMenuOpen(false)}>
            {PORTAL_LABELS.nav.report}
          </PortalNavLinkMobile>
          <PortalNavLinkMobile href="/portal/preferences" active={pathname === '/portal/preferences'} onClick={() => setMenuOpen(false)}>
            {PORTAL_LABELS.nav.preferences}
          </PortalNavLinkMobile>
          <PortalNavLinkMobile href="/portal/help" active={pathname === '/portal/help'} onClick={() => setMenuOpen(false)}>
            {PORTAL_LABELS.nav.help}
          </PortalNavLinkMobile>
          <form action="/api/portal/logout" method="POST" className="mt-1">
            <button
              type="submit"
              className="w-full text-left text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors py-3 px-2 -mx-2 rounded-lg min-h-[44px] flex items-center"
            >
              {PORTAL_LABELS.nav.logout}
            </button>
          </form>
        </nav>
      )}
    </>
  )
}

function PortalNavLink({
  href,
  children,
  active,
}: {
  href: string
  children: React.ReactNode
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`min-h-[44px] px-3 py-2 rounded-lg transition-colors text-sm md:text-base flex items-center ${
        active
          ? 'text-aoz-primary bg-aoz-primary/10 font-medium'
          : 'text-gray-600 hover:text-aoz-primary hover:bg-gray-50'
      }`}
    >
      {children}
    </Link>
  )
}

function PortalNavLinkMobile({
  href,
  children,
  active,
  onClick,
}: {
  href: string
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`transition-colors py-3 px-2 -mx-2 rounded-lg min-h-[44px] flex items-center ${
        active
          ? 'text-aoz-primary bg-aoz-primary/10 font-medium'
          : 'text-gray-600 hover:text-aoz-primary hover:bg-gray-50'
      }`}
    >
      {children}
    </Link>
  )
}
