'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRightLeft, LogOut } from 'lucide-react'
import {
  NAV_ICONS,
  PORTAL_NAV_GROUP_ORDER,
  PORTAL_NAV_ITEMS,
  type PortalNavGroup,
} from '@/lib/config/navigation'
import { PORTAL_LABELS, UI_LABELS } from '@/lib/constants/labels'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageSwitcher } from './LanguageSwitcher'
import { isPortalPathActive, portalNavMessageKey } from '@/lib/utils/portal-nav'
import { useT } from '@/lib/i18n/LocaleProvider'
import type { MessageKey } from '@/lib/i18n'

/**
 * The portal's desktop navigation.
 *
 * It replaces a horizontal strip in the header, which was already crowded at
 * seven links and would have wrapped at nine once messaging landed. A row is
 * the wrong container for fifteen destinations: it can only hold the ones that
 * fit, so the rest were reachable on a phone and invisible on a laptop —
 * exactly backwards, since the laptop is where there is room to spare.
 *
 * A sidebar also makes the two form factors say the same thing. Bottom tabs
 * where the thumb is, a sidebar where the space is, both permanently visible,
 * both grouped under the same headings, both generated from one nav config.
 */
export function PortalSidebar({ hasStaffAccess }: { hasStaffAccess?: boolean }) {
  const pathname = usePathname()
  const t = useT()

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 border-e border-ui-border bg-ui-surface"
      aria-label={UI_LABELS.navigation}
    >
      <div className="flex items-center justify-between gap-2 px-4 h-14 border-b border-ui-border">
        <Link
          href="/portal"
          className="text-base font-semibold tracking-tight text-brand-primary transition-opacity hover:opacity-70"
        >
          {PORTAL_LABELS.title}
        </Link>
        <ThemeToggle />
      </div>

      {/* Scrolls independently: the nav is long enough to outgrow a short
          viewport, and a nav that pushes the page down is worse than one that
          scrolls. */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {PORTAL_NAV_GROUP_ORDER.map((group) => (
          <SidebarGroup key={group} group={group} pathname={pathname} t={t} />
        ))}
      </nav>

      <div className="border-t border-ui-border">
        <LanguageSwitcher />

        <div className="px-2 pb-3">
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
      </div>
    </aside>
  )
}

function SidebarGroup({
  group,
  pathname,
  t,
}: {
  group: PortalNavGroup
  pathname: string
  t: (key: MessageKey) => string
}) {
  const items = PORTAL_NAV_ITEMS.filter((item) => item.group === group)
  if (items.length === 0) return null

  return (
    <div className="mt-4 first:mt-0">
      <p className="eyebrow px-3 mb-1">{t(`navGroup.${group}` as MessageKey)}</p>
      {items.map((item) => {
        const Icon = NAV_ICONS[item.icon]
        const active = isPortalPathActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`w-full min-h-[44px] ${active ? 'nav-item-active' : 'nav-item'}`}
          >
            <Icon
              className={`w-4 h-4 shrink-0 ${active ? 'text-brand-primary' : ''}`}
              aria-hidden="true"
            />
            <span>{t(portalNavMessageKey(item))}</span>
          </Link>
        )
      })}
    </div>
  )
}
