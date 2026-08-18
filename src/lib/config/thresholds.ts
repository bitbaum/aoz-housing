/**
 * Threshold Configuration - Single Source of Truth
 *
 * All numeric thresholds used for scoring, coloring, and status determination.
 * Non-engineers can adjust these values without touching component code.
 *
 * @see CLAUDE.md - Config over code principle
 */

// =============================================================================
// COMPATIBILITY SCORE THRESHOLDS
// =============================================================================

export const SCORE_THRESHOLDS = {
  /** Score at or above this is "excellent" (green) */
  excellent: 80,
  /** Score at or above this is "good" (yellow/amber) */
  good: 60,
  /** Score at or above this is "moderate" (orange) */
  moderate: 40,
  /** Score at or above this is "low" (red) */
  low: 20,
  /** Below low threshold is "critical" */
} as const

export type ScoreLevel = 'excellent' | 'good' | 'moderate' | 'low' | 'critical'

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= SCORE_THRESHOLDS.excellent) return 'excellent'
  if (score >= SCORE_THRESHOLDS.good) return 'good'
  if (score >= SCORE_THRESHOLDS.moderate) return 'moderate'
  if (score >= SCORE_THRESHOLDS.low) return 'low'
  return 'critical'
}

// =============================================================================
// OCCUPANCY THRESHOLDS
// =============================================================================

export const OCCUPANCY_THRESHOLDS = {
  /** Occupancy at or above this shows red (full/overcrowded) */
  critical: 90,
  /** Occupancy at or above this shows yellow (filling up) */
  warning: 70,
  /** Below warning shows green (healthy capacity) */
} as const

export type OccupancyLevel = 'critical' | 'warning' | 'healthy'

export function getOccupancyLevel(percent: number): OccupancyLevel {
  if (percent >= OCCUPANCY_THRESHOLDS.critical) return 'critical'
  if (percent >= OCCUPANCY_THRESHOLDS.warning) return 'warning'
  return 'healthy'
}

// =============================================================================
// INCIDENT/CONFLICT THRESHOLDS
// =============================================================================

export const INCIDENT_THRESHOLDS = {
  /** Number of incidents to show severe warning */
  severe: 3,
  /** Number of incidents to show moderate warning */
  moderate: 2,
  /** Number of incidents to show mild warning */
  mild: 1,
} as const

export type IncidentLevel = 'severe' | 'moderate' | 'mild' | 'none'

export function getIncidentLevel(count: number): IncidentLevel {
  if (count >= INCIDENT_THRESHOLDS.severe) return 'severe'
  if (count >= INCIDENT_THRESHOLDS.moderate) return 'moderate'
  if (count >= INCIDENT_THRESHOLDS.mild) return 'mild'
  return 'none'
}

// =============================================================================
// HARMONY STATUS THRESHOLDS
// =============================================================================

export const HARMONY_THRESHOLDS = {
  /** Score above this is "excellent" harmony */
  excellent: 80,
  /** Score above this is "good" harmony */
  good: 60,
  /** Score above this is "moderate" harmony */
  moderate: 40,
  /** Score above this is "concerning" harmony */
  concerning: 20,
  /** Conflict penalty multiplier */
  conflictPenalty: 10,
} as const

export type HarmonyLevel = 'excellent' | 'good' | 'moderate' | 'concerning' | 'critical'

export function getHarmonyLevel(avgCompatibility: number, recentConflicts: number): HarmonyLevel {
  const harmonyScore = avgCompatibility - (recentConflicts * HARMONY_THRESHOLDS.conflictPenalty)
  if (harmonyScore >= HARMONY_THRESHOLDS.excellent) return 'excellent'
  if (harmonyScore >= HARMONY_THRESHOLDS.good) return 'good'
  if (harmonyScore >= HARMONY_THRESHOLDS.moderate) return 'moderate'
  if (harmonyScore >= HARMONY_THRESHOLDS.concerning) return 'concerning'
  return 'critical'
}

// =============================================================================
// DEFAULT ENTITY STATUSES
// =============================================================================

export const DEFAULT_STATUSES = {
  resident: 'ACTIVE' as const,
  housing: 'AVAILABLE' as const,
  placement: 'ACTIVE' as const,
  spot: 'AVAILABLE' as const,
  incident: 'OPEN' as const,
  maintenance: 'OPEN' as const,
} as const

// =============================================================================
// COLOR MAPPINGS
// =============================================================================

export const SCORE_BG_COLORS = {
  excellent: 'bg-score-excellent',
  good: 'bg-score-good',
  moderate: 'bg-score-medium',
  low: 'bg-score-low',
  critical: 'bg-score-critical',
} as const

export const OCCUPANCY_COLORS = {
  critical: 'bg-status-error',
  warning: 'bg-status-warning',
  healthy: 'bg-status-success',
} as const

export const INCIDENT_BG_COLORS = {
  severe: 'bg-status-error/8',
  moderate: 'bg-status-warning/8',
  mild: 'bg-status-warning/8',
  none: 'bg-ui-subtle',
} as const

// =============================================================================
// FIT SCORE CALCULATION CONFIG
// =============================================================================

/**
 * Penalties and bonuses for fit score calculation
 * Used in lib/compatibility/aggregate.ts
 */
export const FIT_SCORE_CONFIG = {
  /** Point deductions per conflict severity */
  penalties: {
    BLOCKING: 40,
    HIGH: 20,
    MEDIUM: 10,
    LOW: 5,
  },
  /** Bonus points for positive factors */
  bonuses: {
    /** Points per strength factor */
    perStrength: 3,
    /** Maximum total bonus from strengths */
    maxStrengthBonus: 20,
    /** Bonus for small groups (easier integration) */
    smallGroup: 5,
    /** Threshold for small group bonus */
    smallGroupThreshold: 2,
  },
} as const

// =============================================================================
// UI DISPLAY LIMITS
// =============================================================================

/**
 * Limits for UI list displays
 */
export const DISPLAY_LIMITS = {
  /** "Beste Unterkünfte" shows top N units */
  topUnits: 5,
  /** "Wer passt hierher" shows top N residents */
  topResidents: 5,
  /** Dashboard action tiles show top N items */
  dashboardItems: 3,
  /** Dashboard problem units shows top N */
  problemUnits: 5,
  /** MatchCard strengths preview count */
  matchStrengths: 2,
  /** MatchCard concerns preview count */
  matchConcerns: 3,
  /** UnitModePanel visible match results */
  unitMatches: 10,
  /** Language/tag chips shown before +N overflow */
  languagePreview: 2,
  /** HeadToHead comparison resident columns */
  comparisonResidents: 4,
  /** Portal report description character preview */
  descriptionPreview: 50,
  /** Cron notification description character limit */
  emailSummary: 100,
  /** HeadToHead label abbreviation length */
  labelAbbreviation: 6,
  /** Analytics: top incident types shown in breakdown chart */
  topIncidentTypes: 5,
  /** CSV import: max validation errors displayed before truncating */
  importErrorPreview: 10,
  /** Portal dashboard incident/maintenance preview rows */
  portalIncidentPreview: 5,
  /** Audit-log change-summary description preview when a resident files a
   *  maintenance request or incident report */
  auditChangePreview: 200,
  /** Staff-notification email body description length for the same reports */
  reportEmailDescription: 500,
} as const

// =============================================================================
// HEALTH LEVEL (System Health Dashboard)
// =============================================================================

export type HealthLevel = 'excellent' | 'good' | 'moderate' | 'critical'

const HEALTH_THRESHOLDS = { excellent: 80, good: 60, moderate: 40 } as const

export function getHealthLevel(score: number): HealthLevel {
  if (score >= HEALTH_THRESHOLDS.excellent) return 'excellent'
  if (score >= HEALTH_THRESHOLDS.good) return 'good'
  if (score >= HEALTH_THRESHOLDS.moderate) return 'moderate'
  return 'critical'
}

// =============================================================================
// DATABASE QUERY LIMITS
// =============================================================================

/**
 * Row limits for Prisma queries, grouped by semantic context.
 * Distinct from DISPLAY_LIMITS (which cap rendered lists after data is fetched).
 */
export const QUERY_LIMITS = {
  /** Recent incidents/maintenance fetched for a single housing unit's detail view */
  unitHistory: 20,
  /** Incident history tab on the resident detail page */
  residentHistory: 10,
  /** Compatibility-assessment history tab on the resident detail page */
  residentAssessments: 5,
  /** Entity-level history: incidents for conflict analysis, audit entity log */
  entityHistory: 50,
  /** Maximum rows returned on full list pages (incidents, maintenance) */
  pageList: 100,
  /** Chore assignment history on portal chore detail and API route */
  choreHistory: 10,
  /** Upcoming appointments shown on a resident's care-team card */
  upcomingAppointments: 8,
  /** Learning records (planned/in-progress) on the staff learning queue */
  learningQueue: 50,
  /** Residents missing a German language test, on the staff learning queue */
  missingGermanQueue: 40,
  /** Language-learning activities suggested on the portal learning page */
  portalLearningActivities: 8,
} as const

// =============================================================================
// BACKGROUND JOB BATCH LIMITS
// =============================================================================

/**
 * Row caps for the daily notification cron (`api/cron/notifications`) and
 * similar background jobs — distinct from QUERY_LIMITS (user-facing page
 * queries): these cap a batch so a runaway dataset can't blow the function
 * timeout. The cron runs daily, so any backlog beyond the cap is caught on
 * the next run, not lost.
 */
export const CRON_BATCH_LIMITS = {
  /** Overdue incident follow-ups notified per run */
  overdueIncidents: 50,
  /** Active placements scanned for overdue check-ins per run */
  activePlacementScan: 1000,
} as const

// =============================================================================
// PROBLEM DETECTION THRESHOLDS
// =============================================================================

/**
 * Thresholds for problem unit detection
 * Used in dashboard to identify units that need attention
 */
export const PROBLEM_DETECTION = {
  /**
   * Roommate compatibility threshold - alert when score below this
   * Only applies to residents sharing the same room/spot
   */
  roommateCompatibilityAlert: 60,

  /**
   * Recent incidents window - days to look back for incident history
   */
  recentIncidentsDays: 30,

  /**
   * Minimum incidents to flag a unit as problematic
   */
  minIncidentsToFlag: 2,

  /**
   * Days without incidents to consider unit "stable"
   */
  stableUnitDays: 30,
} as const

/**
 * Lookback windows for `lib/analytics/unit-metrics.ts`'s per-unit history and
 * trend comparison. The "last 30 days" window there is the same policy as
 * `PROBLEM_DETECTION.recentIncidentsDays` — reuse that one rather than a
 * second 30-day constant.
 */
export const UNIT_METRICS_WINDOWS = {
  /** Placement/incident history considered for a unit's overall metrics
   *  (~6 months, kept as a flat day count to match the existing behaviour
   *  rather than a calendar-month calculation) */
  historyDays: 180,
  /** Trend-comparison window: incidents older than "recent" but within this
   *  many days count toward "is this unit improving or not" */
  trendComparisonDays: 60,
} as const

/**
 * Severity weights for incident-based problem scoring
 * Higher score = more serious problem
 */
export const INCIDENT_SEVERITY_WEIGHTS = {
  CRITICAL: 10,
  HIGH: 5,
  MEDIUM: 2,
  LOW: 1,
} as const

// =============================================================================
// DISCRIMINATION SAFEGUARD THRESHOLDS
// =============================================================================

/**
 * Thresholds for `lib/compatibility/safeguards.ts` — flags low compatibility
 * scores that may be proxy-discrimination (driven by language or age alone)
 * rather than a genuine lifestyle mismatch. These are fairness-relevant
 * policy values, not styling constants — they belong here, auditable
 * alongside every other threshold, not buried as file-local numbers.
 */
export const DISCRIMINATION_SAFEGUARD_THRESHOLDS = {
  /** Score below this triggers safeguard checks at all */
  lowScoreReview: 40,
  /** If one dimension is this much below the others' average, flag it */
  dimensionGap: 40,
  /** Shared-language count at or below this can trigger the language-only flag */
  languageOverlapMax: 0,
  /** Social dimension must be below this for the language-only flag */
  languageOnlySocialMax: 40,
  /** Lifestyle/practical must be at or above this for the language-only flag
   *  (the other dimensions have to look fine for language to be "the" cause) */
  languageOnlyOtherDimensionMin: 60,
  /** Age-distance steps (on AGE_ORDER) that count as a "large" gap */
  ageGapSteps: 2,
  /** Risk dimension must be above this for the age-only flag */
  ageOnlyRiskMin: 50,
  /** Lifestyle/practical/social must be at or above this for the age-only flag */
  ageOnlyOtherDimensionMin: 50,
  /** A single dimension must fall below this absolute value, not just relative
   *  to the others, before it's flagged on its own */
  singleDimensionAbsoluteMax: 30,
  /** Overall score below this with no other identified pattern still needs
   *  manual review */
  extremeGapReview: 20,
} as const
