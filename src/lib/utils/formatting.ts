/**
 * Formatting utilities
 *
 * Single source of truth for date formatting, score colors, etc.
 * Thresholds are defined in lib/config/thresholds.ts (SSOT)
 */

import { COMPATIBILITY_SCORE_LABELS } from '@/lib/constants/labels'
import {
  SCORE_THRESHOLDS,
  OCCUPANCY_THRESHOLDS,
  HARMONY_THRESHOLDS,
  getScoreLevel as getScoreLevelFromConfig,
  getOccupancyLevel,
  getHarmonyLevel,
  getHealthLevel as getHealthLevelFromConfig,
  type ScoreLevel,
  type OccupancyLevel,
  type HarmonyLevel,
  type HealthLevel,
  OCCUPANCY_COLORS,
} from '@/lib/config/thresholds'
import { SCORE_TOKENS, HARMONY_TOKENS, HEALTH_TOKENS } from '@/lib/config/ui-tokens'

// =============================================================================
// DATE FORMATTING
// =============================================================================

const DATE_LOCALE = 'de-CH'

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString(DATE_LOCALE)
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString(DATE_LOCALE)
}

export function formatRelativeDate(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Heute'
  if (days === 1) return 'Gestern'
  if (days < 7) return `Vor ${days} Tagen`
  if (days < 30) return `Vor ${Math.floor(days / 7)} Wochen`
  return formatDate(date)
}

/**
 * Get a date N days ago from now
 * @example getDateDaysAgo(30) // Date 30 days ago
 */
export function getDateDaysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

/**
 * Common date ranges used throughout the app
 */
export const DATE_RANGES = {
  LAST_7_DAYS: () => getDateDaysAgo(7),
  LAST_30_DAYS: () => getDateDaysAgo(30),
  LAST_90_DAYS: () => getDateDaysAgo(90),
} as const

// =============================================================================
// SCORE FORMATTING (thresholds from config/thresholds.ts)
// =============================================================================

export type { ScoreLevel } from '@/lib/config/thresholds'

// Re-export from config for backward compatibility
export const getScoreLevel = getScoreLevelFromConfig

export function getScoreLabel(score: number): string {
  // Use SSOT from constants/labels.ts
  return COMPATIBILITY_SCORE_LABELS[getScoreLevel(score)]
}

export function getScoreColorClass(score: number): string {
  const classes: Record<ScoreLevel, string> = {
    excellent: 'text-score-excellent-text',
    good:      'text-score-good-text',
    moderate:  'text-score-medium-text',
    low:       'text-score-low-text',
    critical:  'text-score-critical-text',
  }
  return classes[getScoreLevel(score)]
}

export function getScoreBgClass(score: number): string {
  return SCORE_TOKENS[getScoreLevel(score)].soft
}

export function getScoreBadgeClass(score: number): string {
  const classes: Record<ScoreLevel, string> = {
    excellent: 'bg-score-excellent text-ui-on-accent',
    good: 'bg-score-good text-ui-on-accent',
    moderate: 'bg-score-medium text-score-contrast',
    low: 'bg-score-low text-ui-on-accent',
    critical: 'bg-score-critical text-ui-on-accent',
  }
  return classes[getScoreLevel(score)]
}

// =============================================================================
// HARMONY STATUS (thresholds from config/thresholds.ts)
// =============================================================================

export type HarmonyStatus = HarmonyLevel

// Re-export from config for backward compatibility
export const getHarmonyStatus = getHarmonyLevel

export function getHarmonyColorClass(status: HarmonyStatus): string {
  return HARMONY_TOKENS[status]
}

// =============================================================================
// SEVERITY COLORS (using Tailwind severity-* classes from config)
// =============================================================================

export function getSeverityBorderClass(severity: string): string {
  const classes: Record<string, string> = {
    LOW: 'border-l-severity-low',
    MEDIUM: 'border-l-severity-medium',
    HIGH: 'border-l-severity-high',
    CRITICAL: 'border-l-severity-critical',
  }
  return classes[severity] || classes.LOW
}

export function getSeverityDotClass(severity: string): string {
  const classes: Record<string, string> = {
    LOW: 'bg-severity-low',
    MEDIUM: 'bg-severity-medium',
    HIGH: 'bg-severity-high',
    CRITICAL: 'bg-severity-critical',
  }
  return classes[severity] || classes.LOW
}

export function getSeverityBgClass(severity: string): string {
  const classes: Record<string, string> = {
    LOW: 'bg-ui-subtle text-ui-muted',
    MEDIUM: 'bg-status-warning/15 text-status-warning-text',
    HIGH: 'bg-score-low/15 text-score-low-text',
    CRITICAL: 'bg-status-error/15 text-status-error-text',
  }
  return classes[severity] || classes.LOW
}

// Severity radio button styles (for forms)
export function getSeverityRadioClass(severity: string): string {
  const classes: Record<string, string> = {
    LOW: 'peer-checked:border-ui-border-strong peer-checked:bg-ui-subtle',
    MEDIUM: 'peer-checked:border-status-warning peer-checked:bg-status-warning/8',
    HIGH: 'peer-checked:border-score-low peer-checked:bg-score-low/8',
    CRITICAL: 'peer-checked:border-status-error peer-checked:bg-status-error/8',
  }
  return classes[severity] || classes.LOW
}

// =============================================================================
// OCCUPANCY COLORS (thresholds from config/thresholds.ts)
// =============================================================================

export function getOccupancyColorClass(percent: number): string {
  return OCCUPANCY_COLORS[getOccupancyLevel(percent)]
}

// =============================================================================
// STATUS COLORS
// =============================================================================

export function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    ACTIVE: 'badge-active',
    AVAILABLE: 'badge-active',
    PLACED: 'badge-active',
    PENDING: 'badge-pending',
    FULL: 'badge-pending',
    ENDED: 'badge-ended',
    CLOSED: 'badge-ended',
    TRANSFERRED: 'badge-ended',
    MAINTENANCE: 'badge-alert',
    ALERT: 'badge-alert',
  }
  return classes[status] || 'badge-ended'
}

// =============================================================================
// HEALTH INDICATOR (System Health Dashboard)
// =============================================================================

// HealthLevel and getHealthLevel live in thresholds.ts; re-exported for compat
export type { HealthLevel }
export const getHealthLevel = getHealthLevelFromConfig

export function getHealthColorClass(score: number): string {
  return HEALTH_TOKENS[getHealthLevel(score)]
}

// =============================================================================
// TREND COLORS (Metric Cards)
// =============================================================================

export type TrendType = 'good' | 'warning' | 'neutral'

export function getTrendColorClass(trend: TrendType): string {
  const classes: Record<TrendType, string> = {
    good:    'text-status-success-text',
    warning: 'text-status-warning-text',
    neutral: 'text-ui-muted',
  }
  return classes[trend]
}

// =============================================================================
// CONFLICT INDICATOR COLORS
// =============================================================================

export function getConflictIndicatorClass(conflictCount: number): string {
  if (conflictCount >= 3) return 'bg-severity-critical'
  if (conflictCount >= 2) return 'bg-severity-high'
  if (conflictCount >= 1) return 'bg-severity-medium'
  return 'bg-status-success'
}
