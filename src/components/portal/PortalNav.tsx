'use client'

import Link from 'next/link'
import { PORTAL_LABELS } from '@/lib/constants/labels'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

/**
 * The portal's title bar on phones and tablets.
 *
 * It carries no destinations at all. Below `lg` those live in `PortalTabBar`
 * at the bottom of the screen where the thumb is; at `lg` and above they live
 * in `PortalSidebar` and this bar is not rendered.
 *
 * It used to hold a horizontal row of every primary link, which was already
 * crowded at seven and would have wrapped at nine once messaging landed. A row
 * can only hold the links that fit, so the ones that did not were reachable on
 * a phone and invisible on a laptop — backwards, since the laptop is the screen
 * with room to spare.
 */
export function PortalNav() {
  return (
    <div className="flex items-center justify-between gap-4">
      <Link
        href="/portal"
        className="text-base font-semibold tracking-tight text-brand-primary transition-opacity hover:opacity-70 sm:text-lg"
      >
        {PORTAL_LABELS.title}
      </Link>

      <ThemeToggle />
    </div>
  )
}
