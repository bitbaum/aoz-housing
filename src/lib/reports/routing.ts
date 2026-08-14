/**
 * Where a resident's report goes — pure mapping, no I/O.
 *
 * A dripping tap and a roommate conflict are not the same kind of thing and are
 * not worked by the same people. Maintenance belongs on the maintenance board
 * as a MaintenanceRequest; everything else is an Incident on the conflict
 * ladder.
 *
 * Filing both as Incidents had two costs, and both showed up in production:
 * a tap reported from the portal never appeared on the board built to fix it,
 * and it inflated the incident count AOZ uses to measure whether conflicts are
 * going down. A broken appliance is not a conflict, and counting it as one
 * corrupts the single number the pilot is judged on.
 */

import type {
  IncidentSeverity,
  IncidentType,
  MaintenanceCategory,
  MaintenancePriority,
} from '@prisma/client'

/**
 * The maintenance incident types, mapped onto the maintenance board's own
 * categories. An exhaustive Record: adding a maintenance type without deciding
 * which board category it lands in is a type error, not a silent 'OTHER'.
 */
export const MAINTENANCE_TYPE_TO_CATEGORY = {
  PLUMBING: 'PLUMBING',
  ELECTRICAL: 'ELECTRICAL',
  HEATING_COOLING: 'HEATING_COOLING',
  APPLIANCE: 'APPLIANCE',
  STRUCTURAL: 'STRUCTURAL',
  PEST_CONTROL: 'PEST_CONTROL',
  SECURITY_SYSTEM: 'SECURITY',
  GENERAL_MAINTENANCE: 'OTHER',
} as const satisfies Partial<Record<IncidentType, MaintenanceCategory>>

export type MaintenanceIncidentType = keyof typeof MAINTENANCE_TYPE_TO_CATEGORY

export function isMaintenanceType(type: string): type is MaintenanceIncidentType {
  return type in MAINTENANCE_TYPE_TO_CATEGORY
}

/**
 * How urgently a resident's severity is worked.
 *
 * MEDIUM maps to NORMAL rather than to a middle rung of its own: the boards
 * have four levels each and the words differ, so the mapping is stated once
 * here instead of being re-guessed at each call site.
 */
export const SEVERITY_TO_MAINTENANCE_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'NORMAL',
  HIGH: 'HIGH',
  CRITICAL: 'URGENT',
} as const satisfies Record<IncidentSeverity, MaintenancePriority>

export function maintenancePriorityFor(severity: IncidentSeverity): MaintenancePriority {
  return SEVERITY_TO_MAINTENANCE_PRIORITY[severity]
}

export function maintenanceCategoryFor(type: MaintenanceIncidentType): MaintenanceCategory {
  return MAINTENANCE_TYPE_TO_CATEGORY[type]
}
