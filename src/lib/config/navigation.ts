/**
 * Navigation configuration - SSOT for all nav items and icons
 */

import {
  Home,
  Users,
  Building2,
  Puzzle,
  Heart,
  BarChart3,
  AlertTriangle,
  Settings,
  Lightbulb,
  ClipboardList,
  ArrowRightLeft,
  UserCog,
  Bot,
  CalendarDays,
  ScrollText,
  CircleHelp,
  UserPlus,
  HousePlus,
  Wallet,
  Vote,
  MoreHorizontal,
  MessageSquare,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const NAV_ICONS: Record<string, LucideIcon> = {
  home: Home,
  users: Users,
  building: Building2,
  puzzle: Puzzle,
  heart: Heart,
  chart: BarChart3,
  alert: AlertTriangle,
  wrench: Settings,
  brain: Lightbulb,
  clipboard: ClipboardList,
  transfer: ArrowRightLeft,
  settings: UserCog,
  bot: Bot,
  calendar: CalendarDays,
  scroll: ScrollText,
  help: CircleHelp,
  'user-plus': UserPlus,
  'house-plus': HousePlus,
  wallet: Wallet,
  vote: Vote,
  more: MoreHorizontal,
  message: MessageSquare,
}

export interface NavItem {
  href: string
  icon: keyof typeof NAV_ICONS
  label: string
}

/**
 * System destinations — settings, algorithm docs, help. ONE definition,
 * rendered by the UserMenu dropdown (desktop) and the drawer's bottom
 * section (mobile). Deliberately not part of the megamenu: they are about
 * the tool, not the daily work, and they were the overflow that used to
 * clutter the header row on wide screens.
 */
export const SYSTEM_LINKS: NavItem[] = [
  { href: '/settings', icon: 'settings', label: 'Einstellungen' },
  { href: '/algorithm', icon: 'brain', label: 'Algorithmus' },
  { href: '/portal/help', icon: 'help', label: 'Hilfe' },
]

export interface MegaMenuDropdownItem {
  href: string
  icon: keyof typeof NAV_ICONS
  label: string
  desc: string
}

export type MegaMenuGroup =
  | { label: string; href: string; icon: string }
  | { label: string; items: MegaMenuDropdownItem[] }

export const MEGAMENU_GROUPS: MegaMenuGroup[] = [
  { href: '/', icon: 'home', label: 'Dashboard' },
  {
    label: 'Personen',
    items: [
      { href: '/residents', icon: 'users', label: 'Alle Bewohner', desc: 'Bewohnerliste verwalten' },
      { href: '/residents/new', icon: 'user-plus', label: 'Neuer Bewohner', desc: 'Bewohner erfassen' },
      { href: '/matching', icon: 'puzzle', label: 'Matching', desc: 'Platzierung finden' },
      { href: '/transfer-requests', icon: 'transfer', label: 'Verlegungsanfragen', desc: 'Anfragen prüfen & genehmigen' },
    ],
  },
  {
    label: 'Unterkünfte',
    items: [
      { href: '/housing', icon: 'building', label: 'Alle Einheiten', desc: 'Wohneinheiten verwalten' },
      { href: '/housing/new', icon: 'house-plus', label: 'Neue Einheit', desc: 'Einheit hinzufügen' },
      { href: '/placements', icon: 'clipboard', label: 'Platzierungen', desc: 'Aktive Platzierungen' },
      { href: '/chores', icon: 'calendar', label: 'Aufgaben', desc: 'Haushaltsaufgaben & Regeln' },
      { href: '/activities', icon: 'heart', label: 'Aktivitäten', desc: 'Angebote fürs Portal verwalten' },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { href: '/incidents', icon: 'alert', label: 'Vorfälle', desc: 'Konflikte & Wartung' },
      { href: '/rules', icon: 'scroll', label: 'Regeln', desc: 'Hausregeln & Beschlüsse' },
      { href: '/analytics', icon: 'chart', label: 'Statistiken', desc: 'Auswertungen & Berichte' },
      { href: '/maintenance', icon: 'wrench', label: 'Wartung', desc: 'Wartungsaufgaben' },
    ],
  },
  { href: '/messages', icon: 'message', label: 'Nachrichten' },
  { href: '/ai-assistant', icon: 'bot', label: 'KI-Assistent' },
  // Einstellungen intentionally NOT here — system links live in SYSTEM_LINKS
  // (UserMenu + drawer), keeping the header row to the daily work.
]

// =============================================================================
// PORTAL NAV (resident-facing)
// =============================================================================

/**
 * The sections the portal's "Mehr" sheet is organised into.
 *
 * A resident opening the menu used to meet fourteen equally-weighted labels in
 * no particular order, which is a list to read rather than a place to navigate.
 * Grouping is what turns "scan everything" into "look in the obvious box", so
 * every item declares which box it is in and the type system requires it.
 */
export type PortalNavGroup = 'living' | 'together' | 'concerns' | 'account'

export const PORTAL_NAV_GROUP_ORDER: readonly PortalNavGroup[] = [
  'living',
  'together',
  'concerns',
  'account',
]

export interface PortalNavItem {
  href: string
  /** Label is resolved at render time from PORTAL_LABELS.nav, not hard-coded
   *  here, to keep the labels SSOT intact. The key indexes into that object. */
  labelKey: 'overview' | 'messages' | 'apartment' | 'expenses' | 'roommates' | 'chores' | 'housing' | 'activities' | 'report' | 'reports' | 'preferences' | 'profile' | 'help' | 'transfer' | 'rules' | 'decisions'
  icon: keyof typeof NAV_ICONS
  /** Items in the `primary` set show as top-level links on desktop. Others
   *  only appear in the "Mehr" sheet (avoiding desktop overflow). */
  primary?: boolean
  /**
   * Position in the mobile bottom bar. A phone shows a handful of destinations
   * permanently or it shows none, and four plus "Mehr" is what fits a 375px
   * screen at a 44px touch target without the labels truncating.
   */
  tab?: 1 | 2 | 3 | 4
  /** Which section of the "Mehr" sheet this appears under. Required, so a new
   *  page cannot be added without deciding where a resident would look for it. */
  group: PortalNavGroup
}

export const PORTAL_NAV_ITEMS: PortalNavItem[] = [
  { href: '/portal', labelKey: 'overview', icon: 'home', primary: true, tab: 1, group: 'living' },
  { href: '/portal/chores', labelKey: 'chores', icon: 'calendar', primary: true, tab: 2, group: 'living' },
  { href: '/portal/expenses', labelKey: 'expenses', icon: 'wallet', primary: true, tab: 3, group: 'living' },
  { href: '/portal/apartment', labelKey: 'apartment', icon: 'building', primary: true, tab: 4, group: 'living' },
  // Messaging sits in `concerns`: it is where you go when something is wrong
  // or unclear, next to reporting and transfer.
  { href: '/portal/messages', labelKey: 'messages', icon: 'message', primary: true, group: 'concerns' },
  { href: '/portal/rules', labelKey: 'rules', icon: 'scroll', primary: true, group: 'together' },
  { href: '/portal/decisions', labelKey: 'decisions', icon: 'vote', primary: true, group: 'together' },
  // Roommates live inside the apartment profile now; the standalone page
  // stays reachable from the "Mehr" sheet.
  { href: '/portal/roommates', labelKey: 'roommates', icon: 'users', group: 'together' },
  { href: '/portal/report', labelKey: 'report', icon: 'alert', primary: true, group: 'concerns' },
  { href: '/portal/reports', labelKey: 'reports', icon: 'clipboard', group: 'concerns' },
  { href: '/portal/transfer', labelKey: 'transfer', icon: 'transfer', group: 'concerns' },
  { href: '/portal/housing', labelKey: 'housing', icon: 'house-plus', group: 'concerns' },
  { href: '/portal/activities', labelKey: 'activities', icon: 'heart', group: 'concerns' },
  { href: '/portal/profile', labelKey: 'profile', icon: 'settings', group: 'account' },
  { href: '/portal/preferences', labelKey: 'preferences', icon: 'wrench', group: 'account' },
  { href: '/portal/help', labelKey: 'help', icon: 'help', group: 'account' },
]

/** The bottom-bar destinations, in the order they are pinned. */
export const PORTAL_TAB_ITEMS: PortalNavItem[] = PORTAL_NAV_ITEMS.filter(
  (item) => item.tab !== undefined
).sort((a, b) => (a.tab ?? 0) - (b.tab ?? 0))
