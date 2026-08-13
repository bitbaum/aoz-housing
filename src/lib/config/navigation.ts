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
  { href: '/ai-assistant', icon: 'bot', label: 'KI-Assistent' },
  // Einstellungen intentionally NOT here — system links live in SYSTEM_LINKS
  // (UserMenu + drawer), keeping the header row to the daily work.
]

// =============================================================================
// PORTAL NAV (resident-facing)
// =============================================================================

export interface PortalNavItem {
  href: string
  /** Label is resolved at render time from PORTAL_LABELS.nav, not hard-coded
   *  here, to keep the labels SSOT intact. The key indexes into that object. */
  labelKey: 'overview' | 'apartment' | 'expenses' | 'roommates' | 'chores' | 'housing' | 'activities' | 'report' | 'preferences' | 'profile' | 'help' | 'transfer' | 'rules' | 'decisions'
  /** Items in the `primary` set show as top-level links on desktop. Others
   *  only appear in the mobile drawer (avoiding desktop overflow). */
  primary?: boolean
}

export const PORTAL_NAV_ITEMS: PortalNavItem[] = [
  { href: '/portal', labelKey: 'overview', primary: true },
  { href: '/portal/apartment', labelKey: 'apartment', primary: true },
  { href: '/portal/expenses', labelKey: 'expenses', primary: true },
  { href: '/portal/chores', labelKey: 'chores', primary: true },
  { href: '/portal/rules', labelKey: 'rules', primary: true },
  { href: '/portal/decisions', labelKey: 'decisions', primary: true },
  { href: '/portal/report', labelKey: 'report', primary: true },
  // Roommates live inside the apartment profile now; the standalone page
  // stays reachable from the mobile drawer.
  { href: '/portal/roommates', labelKey: 'roommates' },
  { href: '/portal/profile', labelKey: 'profile' },
  { href: '/portal/preferences', labelKey: 'preferences' },
  { href: '/portal/housing', labelKey: 'housing' },
  { href: '/portal/activities', labelKey: 'activities' },
  { href: '/portal/transfer', labelKey: 'transfer' },
  { href: '/portal/help', labelKey: 'help' },
]
