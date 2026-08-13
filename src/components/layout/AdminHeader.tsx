'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { NAV_ICONS, MEGAMENU_GROUPS, type MegaMenuDropdownItem } from '@/lib/config/navigation'
import { useDismissable } from '@/lib/hooks/useDismissable'

/** Route-aware active check: exact for '/', prefix for everything else. */
export function isRouteActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function MegaMenuItem({
  href,
  icon,
  label,
  active,
}: {
  href: string
  icon: string
  label: string
  active: boolean
}) {
  const Icon = NAV_ICONS[icon] || NAV_ICONS.home
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`min-h-[40px] ${active ? 'nav-item-active' : 'nav-item'}`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-brand-primary' : ''}`} aria-hidden="true" />
      {label}
    </Link>
  )
}

function MegaMenuDropdown({
  label,
  items,
  pathname,
  isOpen,
  anyOpen,
  onToggle,
  onOpen,
  onClose,
}: {
  label: string
  items: MegaMenuDropdownItem[]
  pathname: string
  isOpen: boolean
  anyOpen: boolean
  onToggle: () => void
  onOpen: () => void
  onClose: () => void
}) {
  // The group is "where you are" when any of its destinations is.
  const sectionActive = items.some((item) => isRouteActive(pathname, item.href))

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        // Deliberately NO hover-open from rest: menus that spring open while
        // the cursor crosses the bar feel broken. But once one group is open,
        // hovering a sibling switches to it (menubar behaviour).
        onMouseEnter={() => {
          if (anyOpen && !isOpen) onOpen()
        }}
        className={`min-h-[40px] ${sectionActive ? 'nav-item-active' : 'nav-item'}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {label}
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-60 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full pt-1.5 z-50">
          <div className="overlay-panel py-1.5 min-w-[280px]">
            {items.map((item) => {
              const Icon = NAV_ICONS[item.icon] || NAV_ICONS.home
              const active = isRouteActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={`mx-1.5 flex min-h-[44px] items-center gap-3 rounded-md px-2.5 py-2 transition-colors ${
                    active ? 'bg-ui-subtle' : 'hover:bg-ui-subtle'
                  }`}
                >
                  <span className="icon-container-sm shrink-0" aria-hidden="true">
                    <Icon className={`w-4 h-4 ${active ? 'text-brand-primary' : 'text-ui-muted'}`} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-tight text-ui-text">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-ui-muted">{item.desc}</span>
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminMegaMenu() {
  const pathname = usePathname()
  // ONE open group for the whole bar — opening a sibling closes the current
  // one, so panels never stack or fight.
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const navRef = useDismissable<HTMLElement>(openGroup !== null, () => setOpenGroup(null))

  return (
    <nav ref={navRef} className="hidden md:flex items-center gap-0.5">
      {MEGAMENU_GROUPS.map((group) =>
        'items' in group ? (
          <MegaMenuDropdown
            key={group.label}
            label={group.label}
            items={group.items}
            pathname={pathname}
            isOpen={openGroup === group.label}
            anyOpen={openGroup !== null}
            onToggle={() => setOpenGroup(openGroup === group.label ? null : group.label)}
            onOpen={() => setOpenGroup(group.label)}
            onClose={() => setOpenGroup(null)}
          />
        ) : (
          <MegaMenuItem
            key={group.href}
            href={group.href}
            icon={group.icon}
            label={group.label}
            active={isRouteActive(pathname, group.href)}
          />
        )
      )}
    </nav>
  )
}
