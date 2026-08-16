import { PORTAL_LABELS } from '@/lib/constants/labels'
import type { PortalNavItem } from '@/lib/config/navigation'

/**
 * Display helpers shared by the portal's desktop nav and its mobile tab bar.
 *
 * Both surfaces answer the same two questions — what is this item called, and
 * am I on it — and they must answer them identically: a bar that highlights
 * "Aufgaben" where the desktop nav does not is worse than no highlight, because
 * it is confidently wrong about where you are.
 */

/**
 * Labels stay in PORTAL_LABELS rather than in the nav config, so German copy
 * has one home. The nav item carries the key.
 */
export function portalNavLabel(item: PortalNavItem): string {
  if (item.labelKey === 'transfer') return PORTAL_LABELS.transfer.navLabel
  const nav = PORTAL_LABELS.nav as Record<string, string>
  return nav[item.labelKey]
}

/**
 * `/portal` matches only itself. Every other entry also matches its sub-pages,
 * so a resident reading one chore still sees "Aufgaben" as where they are —
 * without it, opening any detail page blanks the whole bar.
 */
export function isPortalPathActive(pathname: string, href: string): boolean {
  if (href === '/portal') return pathname === '/portal'
  return pathname === href || pathname.startsWith(`${href}/`)
}
