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
// SEVERITY COLORS
// =============================================================================

export function getSeverityBorderClass(severity: string): string {
  const classes: Record<string, string> = {
    LOW: 'border-l-gray-300',
    MEDIUM: 'border-l-yellow-400',
    HIGH: 'border-l-orange-500',
    CRITICAL: 'border-l-red-500',
  }
  return classes[severity] || classes.LOW
}

export function getSeverityDotClass(severity: string): string {
  const classes: Record<string, string> = {
    LOW: 'bg-gray-400',
    MEDIUM: 'bg-yellow-500',
    HIGH: 'bg-orange-500',
    CRITICAL: 'bg-red-500',
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
