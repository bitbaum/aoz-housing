'use client'

import Link from 'next/link'
import { useLayoutEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { NAV_ICONS, MEGAMENU_GROUPS, type MegaMenuDropdownItem, type MegaMenuGroup } from '@/lib/config/navigation'
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
      className={`min-h-[40px] shrink-0 ${active ? 'nav-item-active' : 'nav-item'}`}
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

  const buttonRef = useRef<HTMLButtonElement>(null)
  // The bar scrolls horizontally when a role's permitted groups don't fit
  // (see `.scroll-fade` on the <nav>) — an `absolute` panel would then be
  // clipped by that same scroll container, since a non-`visible` overflow-x
  // forces overflow-y to `auto` too (CSS Overflow §3). `fixed`, anchored to
  // the button's own measured rect, escapes that clipping entirely: no
  // ancestor here sets `transform`/`filter`/`contain`, so nothing but the
  // viewport bounds it.
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!isOpen) return
    const measure = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (rect) setPanelPos({ top: rect.bottom + 6, left: rect.left })
    }
    measure()
    // The row itself can scroll (see above) — keep the panel glued to its
    // button rather than left floating over stale coordinates, by closing
    // on any scroll. `capture: true` catches the nav's own internal scroll,
    // not just the page's.
    window.addEventListener('scroll', onClose, { capture: true })
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', onClose, { capture: true })
      window.removeEventListener('resize', measure)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        // Deliberately NO hover-open from rest: menus that spring open while
        // the cursor crosses the bar feel broken. But once one group is open,
        // hovering a sibling switches to it (menubar behaviour).
        onMouseEnter={() => {
          if (anyOpen && !isOpen) onOpen()
        }}
        className={`min-h-[40px] shrink-0 ${sectionActive ? 'nav-item-active' : 'nav-item'}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {label}
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-60 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {isOpen && panelPos && (
        <div className="fixed z-50" style={{ top: panelPos.top, left: panelPos.left }}>
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

export function AdminMegaMenu({ groups = MEGAMENU_GROUPS }: { groups?: MegaMenuGroup[] }) {
  const pathname = usePathname()
  // ONE open group for the whole bar — opening a sibling closes the current
  // one, so panels never stack or fight.
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const navRef = useDismissable<HTMLElement>(openGroup !== null, () => setOpenGroup(null))

  // A role with every permission (or a narrow window) can have more groups
  // than the bar's width — `.scroll-fade` on <nav> already makes that safe
  // (it scrolls instead of overlapping the user menu), but a scrollable row
  // with no visual cue reads as "that's everything", not "scroll for more".
  // These fades are the cue, and they track REAL scroll state rather than
  // being permanently on: for the common case (fits, or already scrolled to
  // an edge) they're off, so the bar doesn't look perpetually cut open.
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useLayoutEffect(() => {
    const el = navRef.current
    if (!el) return
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 0)
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
    }
    update()
    el.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups])

  return (
    <div className="relative min-w-0">
      <nav ref={navRef} className="scroll-fade hidden md:flex items-center gap-0.5 min-w-0">
        {groups.map((group) =>
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
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-0 hidden w-8 bg-gradient-to-r from-ui-canvas to-transparent transition-opacity duration-150 md:block ${
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-0 hidden w-8 bg-gradient-to-l from-ui-canvas to-transparent transition-opacity duration-150 md:block ${
          canScrollRight ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}
