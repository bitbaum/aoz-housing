import { Activity, BookOpen, HeartHandshake, Languages, Palette, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const ACTIVITY_CATEGORY_VALUES = [
  'SPORT',
  'LANGUAGE',
  'CULTURE',
  'COMMUNITY',
  'FAMILY',
  'SUPPORT',
] as const
export const ACTIVITY_COST_VALUES = ['FREE', 'REDUCED', 'PAID'] as const
export const ACTIVITY_STATUS_VALUES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const

export type ActivityCategory = (typeof ACTIVITY_CATEGORY_VALUES)[number]
export type ActivityCost = (typeof ACTIVITY_COST_VALUES)[number]
export type ActivityStatus = (typeof ACTIVITY_STATUS_VALUES)[number]

export type ActivityRecord = {
  id: string
  createdAt: Date
  updatedAt: Date
  title: string
  description: string
  category: ActivityCategory
  cost: ActivityCost
  costNote: string | null
  location: string | null
  website: string | null
  phone: string | null
  schedule: string | null
  startsAt: Date | null
  endsAt: Date | null
  status: ActivityStatus
  highlight: boolean
  createdByUserId: string | null
  updatedByUserId: string | null
}

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  SPORT: 'Sport',
  LANGUAGE: 'Sprache',
  CULTURE: 'Kultur',
  COMMUNITY: 'Gemeinschaft',
  FAMILY: 'Familie',
  SUPPORT: 'Unterstützung',
}

export const ACTIVITY_CATEGORY_ICONS: Record<ActivityCategory, LucideIcon> = {
  SPORT: Activity,
  LANGUAGE: Languages,
  CULTURE: Palette,
  COMMUNITY: Users,
  FAMILY: HeartHandshake,
  SUPPORT: BookOpen,
}

export const ACTIVITY_COST_LABELS: Record<ActivityCost, string> = {
  FREE: 'Kostenlos',
  REDUCED: 'Vergünstigt',
  PAID: 'Kostenpflichtig',
}

export const ACTIVITY_COST_BADGES: Record<ActivityCost, string> = {
  FREE: 'badge-active',
  REDUCED: 'badge-pending',
  PAID: 'badge-info',
}

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  DRAFT: 'Entwurf',
  PUBLISHED: 'Veröffentlicht',
  ARCHIVED: 'Archiviert',
}

export const ACTIVITY_STATUS_BADGES: Record<ActivityStatus, string> = {
  DRAFT: 'badge-pending',
  PUBLISHED: 'badge-active',
  ARCHIVED: 'badge-inactive',
}
