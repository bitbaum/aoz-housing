/**
 * Check-in Interval Configuration - Single Source of Truth
 *
 * Defines how often residents should be checked on based on their support level.
 * These intervals are used in the dashboard to determine overdue check-ins.
 *
 * @see CLAUDE.md - Config over code principle
 */

/**
 * Days between required check-ins per support level
 */
export const CHECK_IN_INTERVALS = {
  /** High-need residents: weekly check-ins */
  INTENSIVE: 7,
  /** Elevated support: bi-weekly check-ins */
  ELEVATED: 14,
  /** Standard support: monthly check-ins */
  STANDARD: 28,
} as const

export type SupportLevel = keyof typeof CHECK_IN_INTERVALS

/**
 * Get check-in interval for a support level
 * Falls back to STANDARD if level is unknown
 */
export function getCheckInInterval(supportLevel: string | null | undefined): number {
  if (!supportLevel) return CHECK_IN_INTERVALS.STANDARD
  const level = supportLevel as SupportLevel
  return CHECK_IN_INTERVALS[level] ?? CHECK_IN_INTERVALS.STANDARD
}

/**
 * Threshold for "very overdue" check-ins (shown as priority in dashboard)
 * Check-ins overdue by more than this many days beyond their interval
 */
export const VERY_OVERDUE_THRESHOLD_DAYS = 14
