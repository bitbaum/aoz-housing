/**
 * Resident report form — structural SSOT.
 *
 * Values and enums only. All display copy lives in i18n (`de.ts` keys under
 * `report.*`). UI builds labelled options via `buildReportFormLabels()`.
 */

export const REPORT_MAINTENANCE_TYPES = [
  'PLUMBING',
  'ELECTRICAL',
  'HEATING_COOLING',
  'APPLIANCE',
  'STRUCTURAL',
  'PEST_CONTROL',
  'SECURITY_SYSTEM',
  'GENERAL_MAINTENANCE',
] as const

export type ReportMaintenanceType = (typeof REPORT_MAINTENANCE_TYPES)[number]

export const REPORT_CONFLICT_TYPES = [
  'NOISE_COMPLAINT',
  'CLEANLINESS_DISPUTE',
  'SPACE_DISPUTE',
  'SCHEDULE_CONFLICT',
  'PERSONAL_CONFLICT',
  'CULTURAL_FRICTION',
  'SAFETY_CONCERN',
  'OTHER',
] as const

export type ReportConflictType = (typeof REPORT_CONFLICT_TYPES)[number]

export const REPORT_LOCATIONS = [
  'room',
  'bathroom',
  'kitchen',
  'common',
  'entrance',
  'other',
] as const

export type ReportLocation = (typeof REPORT_LOCATIONS)[number]

export const REPORT_MAINTENANCE_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export const REPORT_CONFLICT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const

export const MAINTENANCE_SEVERITY_ICONS: Record<
  (typeof REPORT_MAINTENANCE_SEVERITIES)[number],
  string
> = {
  LOW: '🟢',
  MEDIUM: '🟡',
  HIGH: '🟠',
  CRITICAL: '🔴',
}

export const REPORT_TEMPLATES = [
  {
    key: 'maintenance-urgent',
    category: 'MAINTENANCE' as const,
    type: '',
    severity: 'HIGH',
    location: 'common',
    descriptionKey: 'report.template.urgentRepair.description',
    labelKey: 'report.template.urgentRepair.label',
  },
  {
    key: 'noise',
    category: 'INTERPERSONAL' as const,
    type: 'NOISE_COMPLAINT',
    severity: 'MEDIUM',
    descriptionKey: 'report.template.noise.description',
    labelKey: 'report.template.noise.label',
  },
  {
    key: 'safety',
    category: 'INTERPERSONAL' as const,
    type: 'SAFETY_CONCERN',
    severity: 'HIGH',
    descriptionKey: 'report.template.safety.description',
    labelKey: 'report.template.safety.label',
  },
] as const
