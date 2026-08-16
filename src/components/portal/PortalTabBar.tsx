'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowRightLeft, LogOut, X } from 'lucide-react'
import {
  NAV_ICONS,
  PORTAL_NAV_GROUP_ORDER,
  PORTAL_NAV_ITEMS,
  PORTAL_TAB_ITEMS,
  type PortalNavGroup,
  type PortalNavItem,
} from '@/lib/config/navigation'
import { UI_LABELS } from '@/lib/constants/labels'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { isPortalPathActive, portalNavMessageKey } from '@/lib/utils/portal-nav'
import { useT } from '@/lib/i18n/LocaleProvider'
import type { MessageKey } from '@/lib/i18n'
import { LanguageSwitcher } from './LanguageSwitcher'

/**
 * The portal's mobile navigation: four pinned destinations plus everything
 * else, one tap away and grouped.
 *
 * What this replaces: a hamburger that opened a flat list of fourteen labels in
 * arbitrary order. Nothing about it was broken, which is why it survived — it
 * just meant that finding the expense you owe took a tap, a scan of fourteen
 * items and a second tap, on the surface residents use most and the only one
 * they use on a phone.
 */
export function PortalTabBar({ hasStaffAccess }: { hasStaffAccess?: boolean }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const t = useT()
  const pathname = usePathname()
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Escape closes, focus moves into the sheet and back to the trigger, and the
  // page behind cannot scroll while it is open.
  useEffect(() => {
    if (!moreOpen) return
    closeButtonRef.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMoreOpen(false)
        openButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [moreOpen])

  // A tab tap navigates, so the sheet must not survive the route change and
  // cover the page the resident just asked for.
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  const close = () => {
    setMoreOpen(false)
    openButtonRef.current?.focus()
  }

  const MoreIcon = NAV_ICONS.more
  // "Mehr" is the current section whenever the open page is not itself a tab —
  // otherwise a resident deep in Regeln sees no mark anywhere and the bar
  // stops answering "where am I".
  const onTabPage = PORTAL_TAB_ITEMS.some((item) => isPortalPathActive(pathname, item.href))

  return (
    <>
      {moreOpen && (
        <div className="scrim z-40 lg:hidden" onClick={close} aria-hidden="true" />
      )}

      <div
        id="portal-more-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.moreTitle')}
        hidden={!moreOpen}
        className="fixed inset-x-0 bottom-0 z-50 lg:hidden max-h-[85vh] overflow-y-auto
                   rounded-t-xl border-t border-ui-border bg-ui-surface"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-ui-border">
          <p className="eyebrow">{t('nav.moreTitle')}</p>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              ref={closeButtonRef}
              onClick={close}
              className="btn-icon -me-2"
              aria-label={t('nav.closeMore')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="px-3 py-3">
          {PORTAL_NAV_GROUP_ORDER.map((group) => (
            <MoreGroup key={group} group={group} pathname={pathname} />
          ))}

          <div className="mt-4 pt-3 border-t border-ui-border">
            <LanguageSwitcher />
          </div>

          <div className="mt-3 pt-3 border-t border-ui-border">
            {hasStaffAccess && (
              <Link
                href="/"
                className="nav-item w-full min-h-[44px] text-brand-primary hover:text-brand-primary hover:bg-brand-primary/10"
              >
                <ArrowRightLeft className="w-4 h-4" aria-hidden="true" />
                {UI_LABELS.switchToAdmin}
              </Link>
            )}
            <form action="/api/portal/logout" method="POST">
              <button type="submit" className="nav-item w-full min-h-[44px] justify-start">
                <LogOut className="w-4 h-4" aria-hidden="true" />
                {t('nav.logout')}
              </button>
            </form>
          </div>
        </nav>
      </div>

      <nav className="tab-bar lg:hidden" aria-label={UI_LABELS.navigation}>
        {PORTAL_TAB_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.icon]
          const active = isPortalPathActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? 'tab-item-active' : 'tab-item'}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span>{t(portalNavMessageKey(item))}</span>
            </Link>
          )
        })}

        <button
          ref={openButtonRef}
          onClick={() => setMoreOpen((open) => !open)}
          className={!onTabPage || moreOpen ? 'tab-item-active' : 'tab-item'}
          aria-expanded={moreOpen}
          aria-controls="portal-more-sheet"
        >
          <MoreIcon className="w-5 h-5" aria-hidden="true" />
          <span>{t('nav.more')}</span>
        </button>
      </nav>
    </>
  )
}

function MoreGroup({ group, pathname }: { group: PortalNavGroup; pathname: string }) {
  const t = useT()
  const items = PORTAL_NAV_ITEMS.filter((item) => item.group === group)
  if (items.length === 0) return null

  return (
    <div className="mt-4 first:mt-0">
      <p className="eyebrow px-3 mb-1">{t(`navGroup.${group}` as MessageKey)}</p>
      {items.map((item) => (
        <MoreLink key={item.href} item={item} active={isPortalPathActive(pathname, item.href)} />
      ))}
    </div>
  )
}

function MoreLink({ item, active }: { item: PortalNavItem; active: boolean }) {
  const t = useT()
  const Icon = NAV_ICONS[item.icon]
  return (
    <Link
      href={item.href}
      className={`w-full min-h-[44px] ${active ? 'nav-item-active' : 'nav-item'}`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-brand-primary' : ''}`} aria-hidden="true" />
      <span>{t(portalNavMessageKey(item))}</span>
    </Link>
  )
}
