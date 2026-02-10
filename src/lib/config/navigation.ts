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
  { href: '/analytics', icon: 'chart', label: 'Auswertung' },
]
