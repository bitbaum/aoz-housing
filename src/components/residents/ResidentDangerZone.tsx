'use client'

import { hardDeleteResidentProtected } from '@/lib/actions'
import { DANGER_ZONE_LABELS } from '@/lib/constants'
import { DangerZone } from '@/components/ui/DangerZone'

interface Props {
  residentId: string
  residentCode: string
}

const RESIDENT_BLOCKER_LABELS: Record<string, string> = {
  placements: DANGER_ZONE_LABELS.blockers.placements,
  incidentsReported: DANGER_ZONE_LABELS.blockers.incidentsReported,
  incidentsAsSubject: DANGER_ZONE_LABELS.blockers.incidentsSubject,
  involvements: DANGER_ZONE_LABELS.blockers.incidentInvolvements,
  maintenanceRequests: DANGER_ZONE_LABELS.blockers.maintenanceReports,
  assessments: DANGER_ZONE_LABELS.blockers.compatibilityAssessments,
}

const RESIDENT_DZ_LABELS = {
  title: DANGER_ZONE_LABELS.title,
  description: DANGER_ZONE_LABELS.description,
  notEligible: DANGER_ZONE_LABELS.notTestResident,
  blockerReportTitle: DANGER_ZONE_LABELS.blockerReport,
  noDetails: DANGER_ZONE_LABELS.noDetails,
  copyReport: DANGER_ZONE_LABELS.copyReport,
  copiedToClipboard: DANGER_ZONE_LABELS.copiedToClipboard,
  confirmPlaceholder: DANGER_ZONE_LABELS.confirmLabel,
  reasonPlaceholder: DANGER_ZONE_LABELS.reasonLabel,
  deleteFailed: DANGER_ZONE_LABELS.deleteFailed,
  deleteSuccess: DANGER_ZONE_LABELS.deleteSuccess,
  deleteButton: DANGER_ZONE_LABELS.deleteButton,
} as const

export function ResidentDangerZone({ residentId, residentCode }: Props) {
  return (
    <DangerZone
      entityId={residentId}
      entityCode={residentCode}
      entityType="Resident"
      labels={RESIDENT_DZ_LABELS}
      blockerLabels={RESIDENT_BLOCKER_LABELS}
      onDelete={hardDeleteResidentProtected}
      redirectPath="/residents?view=all"
      ariaId="resident-danger-zone-title"
    />
  )
}
