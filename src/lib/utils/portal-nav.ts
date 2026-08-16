import type { PortalNavItem } from '@/lib/config/navigation'
import type { MessageKey } from '@/lib/i18n'

/**
 * Display helpers shared by the portal's desktop nav and its mobile tab bar.
 *
 * Both surfaces answer the same two questions — what is this item called, and
 * am I on it — and they must answer them identically: a bar that highlights
 * "Aufgaben" where the desktop nav does not is worse than no highlight, because
 * it is confidently wrong about where you are.
 */

/**
 * The nav item carries a KEY, not a string, so the same item renders in
 * whatever language the reader chose. Translations live in the dictionaries and
 * the nav config stays language-free — which is what stops a new destination
 * from being added in German only.
 */
export function portalNavMessageKey(item: PortalNavItem): MessageKey {
  return `nav.${item.labelKey}` as MessageKey
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
