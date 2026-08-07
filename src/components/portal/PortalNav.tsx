'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, ArrowRightLeft, LogOut } from 'lucide-react'
import { PORTAL_LABELS, UI_LABELS } from '@/lib/constants/labels'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { PORTAL_NAV_ITEMS, type PortalNavItem } from '@/lib/config/navigation'
import { useDismissable } from '@/lib/hooks/useDismissable'

interface PortalNavProps {
  hasStaffAccess?: boolean
}

export function PortalNav({ hasStaffAccess }: PortalNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const navRef = useDismissable<HTMLDivElement>(menuOpen, () => setMenuOpen(false))

  const primary = PORTAL_NAV_ITEMS.filter((i) => i.primary)

  return (
    <div ref={navRef}>
      <div className="flex items-center justify-between">
        <Link href="/portal" className="text-base font-semibold tracking-tight text-brand-primary transition-opacity hover:opacity-70 sm:text-lg">
          {PORTAL_LABELS.title}
        </Link>

        {/* Desktop nav — primary items only */}
        <nav className="hidden lg:flex items-center gap-1">
          {primary.map((item) => (
            <PortalNavLink
              key={item.href}
              href={item.href}
              active={isActive(pathname, item.href)}
            >
              {labelFor(item)}
            </PortalNavLink>
          ))}
          {hasStaffAccess && (
            <Link
              href="/"
              className="nav-item min-h-[44px] text-brand-primary hover:text-brand-primary hover:bg-brand-primary/10"
            >
              <ArrowRightLeft className="w-4 h-4" aria-hidden="true" />
              {UI_LABELS.switchToAdmin}
            </Link>
          )}
          <LogoutButton variant="desktop" />
          <ThemeToggle />
        </nav>

        {/* Mobile/tablet hamburger — < lg (1024px) */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="btn-icon lg:hidden -mr-1"
          aria-label={menuOpen ? UI_LABELS.menuClose : UI_LABELS.menuOpen}
          aria-expanded={menuOpen}
          aria-controls="portal-mobile-nav"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile/tablet menu — every item (primary + secondary) */}
      {menuOpen && (
        <nav id="portal-mobile-nav" className="lg:hidden pt-3 pb-1 border-t border-ui-border mt-3 flex flex-col gap-1">
          <div className="mb-1 flex justify-end">
            <ThemeToggle />
          </div>
          {PORTAL_NAV_ITEMS.map((item) => (
            <PortalNavLink
              key={item.href}
              href={item.href}
              active={isActive(pathname, item.href)}
              onClick={() => setMenuOpen(false)}
              variant="mobile"
            >
              {labelFor(item)}
            </PortalNavLink>
          ))}
          {hasStaffAccess && (
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="nav-item w-full min-h-[44px] text-brand-primary hover:text-brand-primary hover:bg-brand-primary/10"
            >
              <ArrowRightLeft className="w-4 h-4" aria-hidden="true" />
              {UI_LABELS.switchToAdmin}
            </Link>
          )}
          <LogoutButton variant="mobile" />
        </nav>
      )}
    </div>
  )
}

// ---------- helpers ----------

function isActive(pathname: string, href: string): boolean {
  if (href === '/portal') return pathname === '/portal'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function labelFor(item: PortalNavItem): string {
  const nav = PORTAL_LABELS.nav as Record<string, string>
  if (item.labelKey === 'transfer') return PORTAL_LABELS.transfer.navLabel
  return nav[item.labelKey]
}

// Single link primitive — `variant` collapses the old PortalNavLink +
// PortalNavLinkMobile pair into one component with a size flag.
function PortalNavLink({
  href,
  children,
  active,
  onClick,
  variant = 'desktop',
}: {
  href: string
  children: React.ReactNode
  active: boolean
  onClick?: () => void
  variant?: 'desktop' | 'mobile'
}) {
  // Active state comes from the shared `.nav-item-active` class rather than a
  // local brand tint, so "where am I" looks identical in the portal, the admin
  // megamenu and the mobile drawer.
  const sizing = variant === 'mobile' ? 'w-full' : ''
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`min-h-[44px] ${active ? 'nav-item-active' : 'nav-item'} ${sizing}`}
    >
      {children}
    </Link>
  )
}

function LogoutButton({ variant }: { variant: 'desktop' | 'mobile' }) {
  const className =
    variant === 'mobile'
      ? 'nav-item w-full min-h-[44px] justify-start'
      : 'nav-item min-h-[44px]'
  return (
    <form action="/api/portal/logout" method="POST" className={variant === 'mobile' ? 'mt-1' : 'ml-2'}>
      <button type="submit" className={className}>
        <LogOut className="w-4 h-4" aria-hidden="true" />
        {PORTAL_LABELS.nav.logout}
      </button>
    </form>
  )
}
