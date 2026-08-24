// =============================================================================
// Shared types for dashboard components
// =============================================================================

export interface OverdueCheckIn {
  id: string
  residentCode: string
  residentDisplayName: string | null
  residentId: string
  unitCode: string
  daysSinceLastCheckIn: number
  supportLevel: string
  isVeryOverdue?: boolean
}

export interface DueSoonCheckIn {
  id: string
  residentCode: string
  residentDisplayName: string | null
  residentId: string
  unitCode: string
  daysUntilDue: number
  supportLevel: string
}

export interface UnplacedResident {
  id: string
  code: string
  displayName: string | null
  createdAt: Date
}

export interface CriticalIncident {
  id: string
  type: string
  unitCode: string
  unitId: string
  daysSinceCreated: number
}

export interface PendingTransferRequest {
  id: string
  residentCode: string
  residentDisplayName: string | null
  /** Code of the unit the resident wants to leave; null if unplaced. */
  unitCode: string | null
  daysSinceCreated: number
}

export interface ProposalAwaitingStaff {
  id: string
  title: string
  unitCode: string
  daysWaiting: number
}

/**
 * Problem unit based on ACTUAL incidents (evidence-based)
 */
export interface ProblemUnit {
  id: string
  code: string
  /** Number of interpersonal incidents in the last 30 days */
  incidentCount: number
  /** Weighted score based on incident severity */
  problemScore: number
  /** Number of unresolved incidents */
  unresolvedCount: number
  /** Most common type of incident (e.g., NOISE_COMPLAINT) */
  primaryIssue: string
}
