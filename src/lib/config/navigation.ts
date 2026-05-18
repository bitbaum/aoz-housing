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
}

export interface NavItem {
  href: string
  icon: keyof typeof NAV_ICONS
  label: string
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', icon: 'home', label: 'Dashboard' },
  { href: '/residents', icon: 'users', label: 'Bewohner' },
  { href: '/housing', icon: 'building', label: 'Unterkünfte' },
  { href: '/placements', icon: 'puzzle', label: 'Platzierungen' },
  { href: '/matching', icon: 'heart', label: 'Matching' },
  { href: '/incidents', icon: 'alert', label: 'Vorfälle' },
  { href: '/maintenance', icon: 'wrench', label: 'Wartung' },
  { href: '/chores', icon: 'clipboard', label: 'Aufgaben' },
  { href: '/activities', icon: 'calendar', label: 'Aktivitäten' },
  { href: '/transfer-requests', icon: 'transfer', label: 'Verlegungen' },
  { href: '/analytics', icon: 'chart', label: 'Auswertung' },
  { href: '/ai-assistant', icon: 'bot', label: 'KI-Assistent' },
  { href: '/settings', icon: 'settings', label: 'Einstellungen' },
]

export interface MegaMenuDropdownItem {
  href: string
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
      { href: '/residents', label: 'Alle Bewohner', desc: 'Bewohnerliste verwalten' },
      { href: '/residents/new', label: 'Neuer Bewohner', desc: 'Bewohner erfassen' },
      { href: '/matching', label: 'Matching', desc: 'Platzierung finden' },
      { href: '/transfer-requests', label: 'Verlegungsanfragen', desc: 'Anfragen prüfen & genehmigen' },
    ],
  },
  {
    label: 'Unterkünfte',
    items: [
      { href: '/housing', label: 'Alle Einheiten', desc: 'Wohneinheiten verwalten' },
      { href: '/housing/new', label: 'Neue Einheit', desc: 'Einheit hinzufügen' },
      { href: '/placements', label: 'Platzierungen', desc: 'Aktive Platzierungen' },
      { href: '/chores', label: 'Aufgaben', desc: 'Haushaltsaufgaben & Regeln' },
      { href: '/activities', label: 'Aktivitäten', desc: 'Angebote fürs Portal verwalten' },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { href: '/incidents', label: 'Vorfälle', desc: 'Konflikte & Wartung' },
      { href: '/analytics', label: 'Statistiken', desc: 'Auswertungen & Berichte' },
      { href: '/maintenance', label: 'Wartung', desc: 'Wartungsaufgaben' },
    ],
  },
  { href: '/ai-assistant', icon: 'bot', label: 'KI-Assistent' },
  { href: '/settings', icon: 'settings', label: 'Einstellungen' },
]
