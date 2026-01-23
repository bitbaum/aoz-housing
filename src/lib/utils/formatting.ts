/**
 * Formatting utilities
 *
 * Single source of truth for date formatting, score colors, etc.
 */

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

// =============================================================================
// SCORE FORMATTING
// =============================================================================

export type ScoreLevel = 'excellent' | 'good' | 'moderate' | 'low' | 'critical'

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'moderate'
  if (score >= 20) return 'low'
  return 'critical'
}

export function getScoreLabel(score: number): string {
  const labels: Record<ScoreLevel, string> = {
    excellent: 'Sehr gut',
    good: 'Gut',
    moderate: 'Mittel',
    low: 'Niedrig',
    critical: 'Kritisch',
  }
  return labels[getScoreLevel(score)]
}

export function getScoreColorClass(score: number): string {
  const classes: Record<ScoreLevel, string> = {
    excellent: 'text-green-600',
    good: 'text-emerald-600',
    moderate: 'text-yellow-600',
    low: 'text-orange-600',
    critical: 'text-red-600',
  }
  return classes[getScoreLevel(score)]
}

export function getScoreBgClass(score: number): string {
  const classes: Record<ScoreLevel, string> = {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-emerald-100 text-emerald-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    low: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  }
  return classes[getScoreLevel(score)]
}

export function getScoreBadgeClass(score: number): string {
  const classes: Record<ScoreLevel, string> = {
    excellent: 'bg-score-excellent text-white',
    good: 'bg-score-good text-white',
    moderate: 'bg-score-moderate text-gray-900',
    low: 'bg-score-low text-white',
    critical: 'bg-score-poor text-white',
  }
  return classes[getScoreLevel(score)]
}

// =============================================================================
// HARMONY STATUS
// =============================================================================

export type HarmonyStatus = 'excellent' | 'good' | 'moderate' | 'concerning' | 'critical'

export function getHarmonyStatus(
  avgCompatibility: number,
  recentConflicts: number
): HarmonyStatus {
  let harmonyScore = avgCompatibility
  harmonyScore -= recentConflicts * 10

  if (harmonyScore >= 80) return 'excellent'
  if (harmonyScore >= 60) return 'good'
  if (harmonyScore >= 40) return 'moderate'
  if (harmonyScore >= 20) return 'concerning'
  return 'critical'
}

export function getHarmonyColorClass(status: HarmonyStatus): string {
  const classes: Record<HarmonyStatus, string> = {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-emerald-100 text-emerald-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    concerning: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  }
  return classes[status]
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
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-amber-100 text-amber-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  }
  return classes[severity] || classes.LOW
}

// Severity radio button styles (for forms)
export function getSeverityRadioClass(severity: string): string {
  const classes: Record<string, string> = {
    LOW: 'peer-checked:border-gray-500 peer-checked:bg-gray-50',
    MEDIUM: 'peer-checked:border-yellow-500 peer-checked:bg-yellow-50',
    HIGH: 'peer-checked:border-orange-500 peer-checked:bg-orange-50',
    CRITICAL: 'peer-checked:border-red-500 peer-checked:bg-red-50',
  }
  return classes[severity] || classes.LOW
}

// =============================================================================
// OCCUPANCY COLORS
// =============================================================================

export function getOccupancyColorClass(percent: number): string {
  if (percent >= 90) return 'bg-red-500'
  if (percent >= 70) return 'bg-yellow-500'
  return 'bg-green-500'
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

export type HealthLevel = 'excellent' | 'good' | 'moderate' | 'critical'

export function getHealthLevel(score: number): HealthLevel {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'moderate'
  return 'critical'
}

export function getHealthColorClass(score: number): string {
  const classes: Record<HealthLevel, string> = {
    excellent: 'text-green-600 bg-green-100',
    good: 'text-yellow-600 bg-yellow-100',
    moderate: 'text-orange-600 bg-orange-100',
    critical: 'text-red-600 bg-red-100',
  }
  return classes[getHealthLevel(score)]
}

// =============================================================================
// TREND COLORS (Metric Cards)
// =============================================================================

export type TrendType = 'good' | 'warning' | 'neutral'

export function getTrendColorClass(trend: TrendType): string {
  const classes: Record<TrendType, string> = {
    good: 'text-green-600',
    warning: 'text-orange-600',
    neutral: 'text-gray-500',
  }
  return classes[trend]
}

// =============================================================================
// CONFLICT INDICATOR COLORS
// =============================================================================

export function getConflictIndicatorClass(conflictCount: number): string {
  if (conflictCount >= 3) return 'bg-red-500'
  if (conflictCount >= 2) return 'bg-orange-500'
  if (conflictCount >= 1) return 'bg-yellow-500'
  return 'bg-green-500'
}
