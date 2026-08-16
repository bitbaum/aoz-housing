'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRightLeft, LogOut } from 'lucide-react'
import { PORTAL_LABELS, UI_LABELS } from '@/lib/constants/labels'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { PORTAL_NAV_ITEMS } from '@/lib/config/navigation'
import { isPortalPathActive, portalNavLabel } from '@/lib/utils/portal-nav'

interface PortalNavProps {
  hasStaffAccess?: boolean
}

/**
 * The portal header.
 *
 * Below `lg` this is just the title bar: navigation on a phone belongs at the
 * bottom of the screen where the thumb is, and `PortalTabBar` renders it there.
 * The hamburger that used to live here opened a flat list of every page, which
 * is the pattern this pair replaces.
 */
export function PortalNav({ hasStaffAccess }: PortalNavProps) {
  const pathname = usePathname()
  const primary = PORTAL_NAV_ITEMS.filter((item) => item.primary)

  return (
    <div className="flex items-center justify-between gap-4">
      <Link
        href="/portal"
        className="text-base font-semibold tracking-tight text-brand-primary transition-opacity hover:opacity-70 sm:text-lg"
      >
        {PORTAL_LABELS.title}
      </Link>

      <nav className="hidden lg:flex items-center gap-1">
        {primary.map((item) => {
          const active = isPortalPathActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`min-h-[44px] ${active ? 'nav-item-active' : 'nav-item'}`}
              aria-current={active ? 'page' : undefined}
            >
              {portalNavLabel(item)}
            </Link>
          )
        })}
        {hasStaffAccess && (
          <Link
            href="/"
            className="nav-item min-h-[44px] text-brand-primary hover:text-brand-primary hover:bg-brand-primary/10"
          >
            <ArrowRightLeft className="w-4 h-4" aria-hidden="true" />
            {UI_LABELS.switchToAdmin}
          </Link>
        )}
        <form action="/api/portal/logout" method="POST" className="ml-2">
          <button type="submit" className="nav-item min-h-[44px]">
            <LogOut className="w-4 h-4" aria-hidden="true" />
            {PORTAL_LABELS.nav.logout}
          </button>
        </form>
        <ThemeToggle />
      </nav>

      {/* The theme toggle still needs a home on phones, where the nav below
          carries destinations only. */}
      <div className="lg:hidden">
        <ThemeToggle />
      </div>
    </div>
  )
}
